/**
 * Synchronization manager for editor changes
 */

import * as vscode from "vscode";
import { TodoParser } from "./parser";
import { TaskManager } from "./task-manager";

export class SyncManager {
  private static instance: SyncManager;
  private taskManager: TaskManager;
  private editorChangeDisposable: vscode.Disposable | null = null;
  private saveDocumentDisposable: vscode.Disposable | null = null;
  private isUpdatingFromFile = false;
  private lastKnownContent = "";
  private isSyncDisabled = false;

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
      if (this.isUpdatingFromFile || this.isSyncDisabled) {
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
    this.saveDocumentDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (this.isSyncDisabled) {
        console.log("Sync disabled, skipping save sync...");
        return;
      }

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

      // Skip if TaskManager is currently saving to avoid conflicts
      if (this.taskManager.isSavingFile && this.taskManager.isSavingFile()) {
        console.log("TaskManager is saving, skipping sync from editor");
        return;
      }

      this.lastKnownContent = currentContent;
      this.isUpdatingFromFile = true;

      // Parse tasks from current editor content
      const newTasks = TodoParser.parse(currentContent);
      const currentTasks = this.taskManager.getTasks();

      // Only update if tasks actually changed (avoid duplication)
      if (this.tasksAreEqual(newTasks, currentTasks)) {
        console.log("Tasks unchanged, skipping sync");
        return;
      }

      // Update task manager using the proper method to avoid conflicts
      await this.taskManager.setTasksFromSync(newTasks);

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
   * Temporarily disable synchronization during TaskManager operations
   */
  public disableSync(): void {
    this.isSyncDisabled = true;
    console.log("SyncManager: Sync disabled");
  }

  /**
   * Re-enable synchronization after TaskManager operations
   */
  public enableSync(): void {
    setTimeout(() => {
      this.isSyncDisabled = false;
      console.log("SyncManager: Sync re-enabled");
    }, 500); // Increased delay to wait for file system to settle
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
    if (this.saveDocumentDisposable) {
      this.saveDocumentDisposable.dispose();
    }
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }

  /**
   * Compare two task arrays to check if they are functionally equal
   */
  private tasksAreEqual(tasks1: any[], tasks2: any[]): boolean {
    if (tasks1.length !== tasks2.length) {
      return false;
    }

    // Sort both arrays by id for comparison
    const sorted1 = [...tasks1].sort((a, b) => a.id.localeCompare(b.id));
    const sorted2 = [...tasks2].sort((a, b) => a.id.localeCompare(b.id));

    for (let i = 0; i < sorted1.length; i++) {
      const task1 = sorted1[i];
      const task2 = sorted2[i];

      if (
        task1.id !== task2.id ||
        task1.text !== task2.text ||
        task1.completed !== task2.completed ||
        task1.category !== task2.category
      ) {
        return false;
      }
    }

    return true;
  }
}
