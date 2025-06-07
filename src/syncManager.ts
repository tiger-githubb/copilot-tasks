/**
 * Synchronization manager for editor changes
 */

import * as vscode from "vscode";
import { TodoParser } from "./parser";
import { TaskManager } from "./taskManager";

export class SyncManager {
  private static instance: SyncManager;
  private taskManager: TaskManager;
  private editorChangeDisposable: vscode.Disposable | null = null;
  private isUpdatingFromFile = false;
  private lastKnownContent = "";

  private constructor() {
    this.taskManager = TaskManager.getInstance();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize synchronization
   */
  public initialize(): void {
    this.setupEditorSync();
    this.setupTaskManagerSync();
  }

  /**
   * Setup editor synchronization (editor -> task manager)
   */
  private setupEditorSync(): void {
    // Listen to document changes
    this.editorChangeDisposable = vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (this.isUpdatingFromFile) {
        return; // Avoid recursive updates
      }

      const todoPath = this.taskManager.getTodoPath();
      if (!todoPath || event.document.uri.fsPath !== todoPath) {
        return; // Not our todo.md file
      }

      // Debounce changes to avoid too frequent updates
      this.debounceEditorChange(event.document);
    });

    // Listen to document saves
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const todoPath = this.taskManager.getTodoPath();
      if (todoPath && document.uri.fsPath === todoPath) {
        console.log("Todo file saved, synchronizing...");
        await this.syncFromEditor(document);
      }
    });
  }

  /**
   * Setup task manager synchronization (task manager -> editor)
   */
  private setupTaskManagerSync(): void {
    this.taskManager.onTasksChanged(async (tasks) => {
      if (this.isUpdatingFromFile) {
        return; // This change came from the file watcher
      }

      await this.updateEditorFromTasks();
    });
  }

  /**
   * Debounced editor change handler
   */
  private debounceTimeout: NodeJS.Timeout | null = null;
  private debounceEditorChange(document: vscode.TextDocument): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(async () => {
      await this.syncFromEditor(document);
    }, 500); // 500ms debounce
  }

  /**
   * Synchronize from editor to task manager
   */
  private async syncFromEditor(document: vscode.TextDocument): Promise<void> {
    try {
      const currentContent = document.getText();

      // Skip if content hasn't actually changed
      if (currentContent === this.lastKnownContent) {
        return;
      }

      this.lastKnownContent = currentContent;
      this.isUpdatingFromFile = true;

      // Parse tasks from current editor content
      const newTasks = TodoParser.parse(currentContent);

      // Update task manager without triggering file save
      const taskManager = this.taskManager as any;
      taskManager.tasks = newTasks;
      taskManager._onTasksChanged.fire(newTasks);

      console.log(`Synchronized ${newTasks.length} tasks from editor`);

      // Show status in status bar
      vscode.window.setStatusBarMessage(`✅ Synchronized ${newTasks.length} tasks`, 2000);
    } catch (error) {
      console.error("Error syncing from editor:", error);
    } finally {
      this.isUpdatingFromFile = false;
    }
  }

  /**
   * Update editor from task manager changes
   */
  private async updateEditorFromTasks(): Promise<void> {
    const todoPath = this.taskManager.getTodoPath();
    if (!todoPath) {
      return;
    }

    try {
      // Check if todo.md is currently open in editor
      const document = vscode.workspace.textDocuments.find((doc) => doc.uri.fsPath === todoPath);

      if (!document) {
        return; // File not open in editor
      }

      // Generate new content from current tasks
      const tasks = this.taskManager.getTasks();
      const currentContent = document.getText();
      const newContent = TodoParser.generateContent(tasks, currentContent);

      // Only update if content is different
      if (newContent !== currentContent) {
        this.isUpdatingFromFile = true;

        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(currentContent.length));
        edit.replace(document.uri, fullRange, newContent);

        await vscode.workspace.applyEdit(edit);
        this.lastKnownContent = newContent;

        console.log("Updated editor from task manager");

        this.isUpdatingFromFile = false;
      }
    } catch (error) {
      console.error("Error updating editor:", error);
      this.isUpdatingFromFile = false;
    }
  }

  /**
   * Force synchronization
   */
  public async forcSync(): Promise<void> {
    const todoPath = this.taskManager.getTodoPath();
    if (!todoPath) {
      return;
    }

    const document = vscode.workspace.textDocuments.find((doc) => doc.uri.fsPath === todoPath);

    if (document) {
      await this.syncFromEditor(document);
    } else {
      await this.taskManager.loadTasks();
    }
  }

  /**
   * Show synchronization status
   */
  public showSyncStatus(): void {
    const stats = this.taskManager.getStats();
    const todoPath = this.taskManager.getTodoPath();
    const isOpen = todoPath && vscode.workspace.textDocuments.some((doc) => doc.uri.fsPath === todoPath);

    const status = `📋 Tasks: ${stats.total} | ✅ Done: ${stats.completed} | 📝 Editor: ${isOpen ? "Open" : "Closed"}`;
    vscode.window.showInformationMessage(status);
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.editorChangeDisposable) {
      this.editorChangeDisposable.dispose();
    }
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }
}
