/**
 * Task manager for handling task state and synchronization
 */

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Task, TodoParser } from "./parser";

export class TaskManager {
  private static instance: TaskManager;
  private tasks: Task[] = [];
  private todoPath: string | null = null;
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private readonly _onTasksChanged = new vscode.EventEmitter<Task[]>();
  public readonly onTasksChanged = this._onTasksChanged.event;

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

    this.todoPath = path.join(workspaceFolder.uri.fsPath, "todo.md");
    await this.setupFileWatcher();
    await this.loadTasks();
  }

  /**
   * Setup file system watcher for todo.md
   */
  private async setupFileWatcher(): Promise<void> {
    if (!this.todoPath) {
      return;
    }

    // Watch for changes to todo.md
    const pattern = new vscode.RelativePattern(path.dirname(this.todoPath), "todo.md");

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    // Handle file changes
    this.fileWatcher.onDidChange(async () => {
      console.log("Todo file changed, reloading tasks...");
      await this.loadTasks();
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
      // Read current content to preserve formatting
      let originalContent = "";
      if (fs.existsSync(this.todoPath)) {
        originalContent = await fs.promises.readFile(this.todoPath, "utf8");
      }

      // Generate new content
      const newContent = TodoParser.generateContent(this.tasks, originalContent); // Temporarily disable file watcher to avoid recursive updates
      const wasWatching = this.fileWatcher;
      if (wasWatching) {
        wasWatching.dispose();
        this.fileWatcher = null;
      }

      // Write file
      await fs.promises.writeFile(this.todoPath, newContent, "utf8");
      console.log(`Saved ${this.tasks.length} tasks to todo.md`);

      // Re-enable file watcher after a short delay
      if (wasWatching) {
        setTimeout(async () => {
          await this.setupFileWatcher();
        }, 100);
      }
    } catch (error) {
      console.error("Error saving tasks:", error);
      vscode.window.showErrorMessage(`Error saving tasks: ${error}`);
    }
  }

  /**
   * Get all tasks
   */
  public getTasks(): Task[] {
    return [...this.tasks];
  }

  /**
   * Add a new task
   */
  public async addTask(text: string, category?: string): Promise<void> {
    const newTask: Task = {
      id: `task-${Date.now()}-${text.substring(0, 10).replace(/\s+/g, "-")}`,
      text,
      completed: false,
      line: this.tasks.length,
      category,
    };

    this.tasks.push(newTask);
    await this.saveTasks();
    this._onTasksChanged.fire(this.tasks);
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
