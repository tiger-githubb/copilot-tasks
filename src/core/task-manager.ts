/**
 * Task manager for handling task state and synchronization
 */

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { CONFIG } from "../constants";
import { Task } from "../types";
import { TodoParser } from "./parser";

export class TaskManager {
  private static instance: TaskManager;
  private tasks: Task[] = [];
  private todoPath: string | null = null;
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private readonly _onTasksChanged = new vscode.EventEmitter<Task[]>();
  public readonly onTasksChanged = this._onTasksChanged.event;
  private isSaving = false; // Track if we're currently saving to avoid reload conflicts

  private constructor() {}

  public static getInstance(): TaskManager {
    if (!TaskManager.instance) {
      TaskManager.instance = new TaskManager();
    }
    return TaskManager.instance;
  }

  /**
   * Initialize the task manager with workspace
   */
  public async initialize(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    this.todoPath = path.join(workspaceFolder.uri.fsPath, CONFIG.DEFAULT_TODO_FILE);
    await this.setupFileWatcher();
    await this.loadTasks();
  }

  /**
   * Setup file system watcher for todo.md
   */
  private async setupFileWatcher(): Promise<void> {
    if (!this.todoPath) {
      return;
    } // Watch for changes to todo.md
    const pattern = new vscode.RelativePattern(path.dirname(this.todoPath), CONFIG.DEFAULT_TODO_FILE);

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern); // Handle file changes
    this.fileWatcher.onDidChange(async () => {
      if (this.isSaving) {
        console.log("File changed during save, skipping reload...");
        return;
      }

      // Add small delay to avoid rapid successive changes
      setTimeout(async () => {
        if (!this.isSaving) {
          // Double-check after delay
          console.log("Todo file changed, reloading tasks...");
          await this.loadTasks();
        }
      }, 100);
    });

    // Handle file creation
    this.fileWatcher.onDidCreate(async () => {
      console.log("Todo file created, loading tasks...");
      await this.loadTasks();
    });

    // Handle file deletion
    this.fileWatcher.onDidDelete(() => {
      console.log("Todo file deleted, clearing tasks...");
      this.tasks = [];
      this._onTasksChanged.fire(this.tasks);
    });
  }

  /**
   * Load tasks from todo.md file
   */
  public async loadTasks(): Promise<void> {
    if (!this.todoPath || !fs.existsSync(this.todoPath)) {
      this.tasks = [];
      this._onTasksChanged.fire(this.tasks);
      return;
    }

    try {
      const content = await fs.promises.readFile(this.todoPath, "utf8");
      this.tasks = TodoParser.parse(content);
      this._onTasksChanged.fire(this.tasks);
      console.log(`Loaded ${this.tasks.length} tasks from todo.md`);
    } catch (error) {
      console.error("Error loading tasks:", error);
      vscode.window.showErrorMessage(`Error loading tasks: ${error}`);
    }
  }
  /**
   * Save tasks to todo.md file
   */
  public async saveTasks(): Promise<void> {
    if (!this.todoPath) {
      return;
    }

    try {
      this.isSaving = true; // Set flag to prevent reload during save

      // Disable SyncManager during save operation
      const syncManager = await this.getSyncManager();
      if (syncManager) {
        syncManager.disableSync();
      }

      // Read current content to preserve formatting
      let originalContent = "";
      if (fs.existsSync(this.todoPath)) {
        originalContent = await fs.promises.readFile(this.todoPath, "utf8");
      }

      // Generate new content
      const newContent = TodoParser.generateContent(this.tasks, originalContent);

      // Write file
      await fs.promises.writeFile(this.todoPath, newContent, "utf8");
      console.log(`Saved ${this.tasks.length} tasks to todo.md`);

      // Re-enable SyncManager after save
      if (syncManager) {
        syncManager.enableSync();
      }
    } catch (error) {
      console.error("Error saving tasks:", error);
      vscode.window.showErrorMessage(`Error saving tasks: ${error}`);
    } finally {
      // Reset flag after a longer delay to allow file system to settle
      setTimeout(() => {
        this.isSaving = false;
      }, 500); // Increased from 200ms to 500ms
    }
  }
  /**
   * Get SyncManager instance (lazy import to avoid circular dependency)
   */
  private async getSyncManager(): Promise<any> {
    try {
      const { SyncManager } = await import("./sync-manager.js");
      return SyncManager.getInstance();
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if TaskManager is currently saving
   */
  public isSavingFile(): boolean {
    return this.isSaving;
  }

  /**
   * Get all tasks
   */
  public getTasks(): Task[] {
    return [...this.tasks];
  }

  /**
   * Set tasks from synchronization (avoids triggering save)
   */
  public async setTasksFromSync(newTasks: Task[]): Promise<void> {
    this.tasks = newTasks;
    this._onTasksChanged.fire(this.tasks);
  }
  /**
   * Add a new task
   */
  public async addTask(text: string, category?: string): Promise<void> {
    const newTask: Task = {
      id: this.generateStableTaskId(text),
      text,
      completed: false,
      line: -1, // Use -1 to indicate this is a new task not yet in the file
      category,
    };

    this.tasks.push(newTask);
    this._onTasksChanged.fire(this.tasks); // Notify UI immediately
    await this.saveTasks();
    // Do NOT reload here - let the file watcher handle it
  }

  /**
   * Generate a stable task ID based on content (matches parser logic)
   */
  private generateStableTaskId(text: string): string {
    // Use the same logic as the parser for consistency
    const textHash = text.substring(0, 20).replace(/\s+/g, "-").toLowerCase();
    const fullTextHash = this.simpleHash(text);
    return `task-${fullTextHash}-${textHash}`;
  }

  /**
   * Generate a simple hash from text for stable IDs
   */
  private simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Toggle task completion
   */
  public async toggleTask(taskId: string): Promise<void> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      await this.saveTasks();
      this._onTasksChanged.fire(this.tasks);
    }
  }

  /**
   * Update task text
   */
  public async updateTask(taskId: string, newText: string): Promise<void> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.text = newText;
      await this.saveTasks();
      this._onTasksChanged.fire(this.tasks);
    }
  }

  /**
   * Delete a task
   */
  public async deleteTask(taskId: string): Promise<void> {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      await this.saveTasks();
      this._onTasksChanged.fire(this.tasks);
    }
  }

  /**
   * Get task statistics
   */
  public getStats(): { total: number; completed: number; remaining: number; completionRate: number } {
    return TodoParser.getStats(this.tasks);
  }

  /**
   * Get tasks by category
   */
  public getTasksByCategory(): Map<string, Task[]> {
    const categoryMap = new Map<string, Task[]>();

    for (const task of this.tasks) {
      const category = task.category || "Uncategorized";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(task);
    }

    return categoryMap;
  }

  /**
   * Get todo.md file path
   */
  public getTodoPath(): string | null {
    return this.todoPath;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
    this._onTasksChanged.dispose();
  }
}
