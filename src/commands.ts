/**
 * All commands for the Copilot Tasks extension
 */

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { COMMANDS, CONFIG } from "./constants";
import { SyncManager } from "./core/sync-manager";
import { TaskManager } from "./core/task-manager";
import { Task } from "./types";
import { DashboardPanel } from "./ui/dashboard-panel";
import { MetricsCollector } from "./ui/metrics-view";
import { TaskTreeDataProvider } from "./ui/tree-provider";

export function registerAllCommands(
  context: vscode.ExtensionContext,
  taskManager: TaskManager,
  syncManager: SyncManager,
  metricsCollector: MetricsCollector,
  taskTreeDataProvider: TaskTreeDataProvider
) {
  const disposables = [
    vscode.commands.registerCommand(COMMANDS.OPEN_TODO, openTodo),
    vscode.commands.registerCommand(COMMANDS.ADD_TASK, () => addTask(taskManager, metricsCollector)),
    vscode.commands.registerCommand(COMMANDS.TOGGLE_TASK, (taskArg?: any) => toggleTask(taskManager, metricsCollector, taskArg)),
    vscode.commands.registerCommand(COMMANDS.SHOW_STATS, () => showStats(taskManager)),
    vscode.commands.registerCommand(COMMANDS.FORCE_SYNC, () => forceSync(syncManager)),
    vscode.commands.registerCommand(COMMANDS.SYNC_STATUS, () => syncStatus(syncManager)),
    vscode.commands.registerCommand(COMMANDS.SHOW_METRICS, () => showMetrics(metricsCollector)),
    vscode.commands.registerCommand(COMMANDS.REFRESH_TREE, () => refreshTree(taskTreeDataProvider)),
    vscode.commands.registerCommand(COMMANDS.OPEN_DASHBOARD, () => openDashboard(context)),
    vscode.commands.registerCommand("copilot-tasks.toggleGrouping", () => toggleGrouping(taskTreeDataProvider)),
    vscode.commands.registerCommand(COMMANDS.COMPLETE_WITH_COPILOT, (taskArg?: any) =>
      completeWithCopilot(taskManager, metricsCollector, taskArg)
    ),
    vscode.commands.registerCommand(COMMANDS.INSERT_SUGGESTION, (taskArg?: any) =>
      insertSuggestion(taskManager, metricsCollector, taskArg)
    ),
  ];

  context.subscriptions.push(...disposables);
}

// ==============================
// COMMAND IMPLEMENTATIONS
// ==============================

/**
 * Open or create the todo.md file
 */
async function openTodo(): Promise<void> {
  try {
    const todoPath = await getTodoPath();
    if (!todoPath) {
      return;
    }

    // Check if todo.md exists, if not create it
    if (!fs.existsSync(todoPath)) {
      await createDefaultTodoFile(todoPath);
      vscode.window.showInformationMessage("Created todo.md file at workspace root.");
    }

    // Open the todo.md file
    const document = await vscode.workspace.openTextDocument(todoPath);
    await vscode.window.showTextDocument(document);
  } catch (error) {
    vscode.window.showErrorMessage(`Error opening todo.md: ${error}`);
  }
}

/**
 * Add a new task
 */
async function addTask(taskManager: TaskManager, metricsCollector: MetricsCollector): Promise<void> {
  try {
    // Get task text from user
    const taskText = await vscode.window.showInputBox({
      prompt: "Enter the task description",
      placeHolder: "What needs to be done?",
    });

    if (!taskText) {
      return;
    }

    // Get existing categories
    const tasks = taskManager.getTasks();
    const existingCategories = [...new Set(tasks.map((task) => task.category).filter(Boolean))];

    let category: string | undefined;

    if (existingCategories.length > 0) {
      // Create category options
      const categoryOptions = [
        { label: "$(plus) New category...", value: "NEW_CATEGORY" },
        { label: "$(list-unordered) No category", value: "NO_CATEGORY" },
        ...existingCategories.map((cat) => ({ label: `$(folder) ${cat}`, value: cat })),
      ];

      const selectedCategory = await vscode.window.showQuickPick(categoryOptions, {
        placeHolder: "Select a category for this task",
        matchOnDescription: true,
      });

      if (!selectedCategory) {
        return; // User cancelled
      }

      if (selectedCategory.value === "NEW_CATEGORY") {
        // Ask for new category name
        category = await vscode.window.showInputBox({
          prompt: "Enter new category name",
          placeHolder: "Tasks, Ideas, Bugs, etc.",
        });
      } else if (selectedCategory.value !== "NO_CATEGORY") {
        category = selectedCategory.value;
      }
    } else {
      // No existing categories, ask for optional category
      category = await vscode.window.showInputBox({
        prompt: "Enter category (optional)",
        placeHolder: "Tasks, Ideas, Bugs, etc.",
      });
    }

    // Use task manager to add task
    await taskManager.addTask(taskText, category || undefined);

    // Track metrics
    metricsCollector.trackTaskCreated();

    const categoryText = category ? ` in category "${category}"` : "";
    vscode.window.showInformationMessage(`Task added: "${taskText}"${categoryText}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Error adding task: ${error}`);
  }
}

/**
 * Toggle task completion (supports both TreeView and QuickPick)
 */
async function toggleTask(taskManager: TaskManager, metricsCollector: MetricsCollector, taskArg?: any): Promise<void> {
  try {
    let taskToToggle: Task;

    if (taskArg && taskArg.id) {
      // Called from TreeView with task argument
      taskToToggle = taskArg;
    } else {
      // Called from command palette, show QuickPick
      const tasks = taskManager.getTasks();

      if (tasks.length === 0) {
        vscode.window.showInformationMessage("No tasks found. Add some tasks first.");
        return;
      }

      // Show task selection
      const taskItems = tasks.map((task) => ({
        label: task.completed ? `✅ ${task.text}` : `⭕ ${task.text}`,
        description: task.category ? `Category: ${task.category}` : undefined,
        task: task,
      }));

      const selectedItem = await vscode.window.showQuickPick(taskItems, {
        placeHolder: "Select a task to toggle",
      });

      if (!selectedItem) {
        return;
      }

      taskToToggle = selectedItem.task;
    }

    // Toggle the task using task manager
    await taskManager.toggleTask(taskToToggle.id);

    // Track metrics if task was completed
    if (!taskToToggle.completed) {
      metricsCollector.trackTaskCompleted();
    }

    const status = taskToToggle.completed ? "uncompleted" : "completed";
    vscode.window.showInformationMessage(`Task marked as ${status}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Error toggling task: ${error}`);
  }
}

/**
 * Show task statistics
 */
async function showStats(taskManager: TaskManager): Promise<void> {
  try {
    const stats = taskManager.getStats();

    // Show statistics
    const message = `📊 Task Statistics:
Total: ${stats.total}
Completed: ${stats.completed}
Remaining: ${stats.remaining}
Progress: ${stats.completionRate.toFixed(1)}%`;

    vscode.window.showInformationMessage(message);
  } catch (error) {
    vscode.window.showErrorMessage(`Error showing stats: ${error}`);
  }
}

/**
 * Force synchronization
 */
async function forceSync(syncManager: SyncManager): Promise<void> {
  try {
    await syncManager.forcSync();
    vscode.window.showInformationMessage("Synchronization completed!");
  } catch (error) {
    vscode.window.showErrorMessage(`Error during sync: ${error}`);
  }
}

/**
 * Show sync status
 */
function syncStatus(syncManager: SyncManager): void {
  syncManager.showSyncStatus();
}

/**
 * Show metrics
 */
async function showMetrics(metricsCollector: MetricsCollector): Promise<void> {
  await metricsCollector.showMetricsSummary();
}

/**
 * Refresh tree view
 */
function refreshTree(taskTreeDataProvider: TaskTreeDataProvider): void {
  taskTreeDataProvider.refresh();
}

/**
 * Toggle grouping in tree view
 */
function toggleGrouping(taskTreeDataProvider: TaskTreeDataProvider): void {
  taskTreeDataProvider.toggleGrouping();
  const mode = taskTreeDataProvider.getGroupingMode() ? "categories" : "flat list";
  vscode.window.showInformationMessage(`Tasks now grouped by: ${mode}`);
}

/**
 * Complete task with Copilot assistance
 */
async function completeWithCopilot(taskManager: TaskManager, metricsCollector: MetricsCollector, taskArg?: any): Promise<void> {
  try {
    let taskToComplete: Task;

    if (taskArg && taskArg.id) {
      // Called from TreeView with task argument
      taskToComplete = taskArg;
    } else {
      // Called from command palette, show QuickPick for pending tasks
      const tasks = taskManager.getTasks().filter((task) => !task.completed);

      if (tasks.length === 0) {
        vscode.window.showInformationMessage("No pending tasks found. Add some tasks first.");
        return;
      }

      // Show task selection
      const taskItems = tasks.map((task) => ({
        label: `⏳ ${task.text}`,
        description: task.category ? `Category: ${task.category}` : undefined,
        task: task,
      }));

      const selectedItem = await vscode.window.showQuickPick(taskItems, {
        placeHolder: "Select a task to complete with Copilot",
      });

      if (!selectedItem) {
        return;
      }

      taskToComplete = selectedItem.task;
    }

    // Open todo.md at the specific task line
    const todoPath = await getTodoPath();
    if (!todoPath) {
      return;
    }

    if (!fs.existsSync(todoPath)) {
      await createDefaultTodoFile(todoPath);
      vscode.window.showInformationMessage("Created todo.md file at workspace root.");
    }

    const document = await vscode.workspace.openTextDocument(todoPath);
    const editor = await vscode.window.showTextDocument(document); // Find the task in the document and position cursor
    const content = document.getText();
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(taskToComplete.text)) {
        const position = new vscode.Position(i, lines[i].length);

        // Add a new line for Copilot to work with
        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, position, "\n\n// TODO: ");
        await vscode.workspace.applyEdit(edit);

        // Position cursor after the inserted comment (position is now updated)
        const newPosition = new vscode.Position(i + 2, 9);
        editor.selection = new vscode.Selection(newPosition, newPosition);
        editor.revealRange(new vscode.Range(newPosition, newPosition));

        // Track Copilot interaction
        metricsCollector.trackCopilotInteraction();

        vscode.window.showInformationMessage(`Positioned cursor for Copilot completion. Task: "${taskToComplete.text}"`);
        break;
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error completing with Copilot: ${error}`);
  }
}

/**
 * Insert Copilot suggestion for a task
 */
async function insertSuggestion(taskManager: TaskManager, metricsCollector: MetricsCollector, taskArg?: any): Promise<void> {
  try {
    let selectedTask: Task;

    if (taskArg && taskArg.id) {
      // Called from TreeView with task argument
      selectedTask = taskArg;
    } else {
      // Called from command palette, show QuickPick for pending tasks
      const tasks = taskManager.getTasks().filter((task) => !task.completed);

      if (tasks.length === 0) {
        vscode.window.showInformationMessage("No pending tasks found. Add some tasks first.");
        return;
      }

      const taskItems = tasks.map((task) => ({
        label: `⏳ ${task.text}`,
        description: task.category ? `Category: ${task.category}` : undefined,
        task: task,
      }));

      const selectedItem = await vscode.window.showQuickPick(taskItems, {
        placeHolder: "Select a task to generate suggestions for",
      });

      if (!selectedItem) {
        return;
      }

      selectedTask = selectedItem.task;
    }

    // Generate suggestion prompt based on task
    const suggestions = [
      `Break down the task "${selectedTask.text}" into smaller actionable steps`,
      `What are the key requirements for: ${selectedTask.text}`,
      `Create a checklist for completing: ${selectedTask.text}`,
      `List potential challenges and solutions for: ${selectedTask.text}`,
      `Estimate time and resources needed for: ${selectedTask.text}`,
    ];

    const selectedSuggestion = await vscode.window.showQuickPick(suggestions, {
      placeHolder: "Select the type of suggestion to generate",
    });

    if (!selectedSuggestion) {
      return;
    }

    // Open todo.md and insert the suggestion prompt
    const todoPath = await getTodoPath();
    if (!todoPath) {
      return;
    }

    if (!fs.existsSync(todoPath)) {
      await createDefaultTodoFile(todoPath);
    }

    const document = await vscode.workspace.openTextDocument(todoPath);
    const editor = await vscode.window.showTextDocument(document); // Find insertion point after the selected task
    const content = document.getText();
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(selectedTask.text)) {
        const insertPosition = new vscode.Position(i + 1, 0);
        const suggestionText = `\n### ${selectedSuggestion}\n\n`;

        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, insertPosition, suggestionText);
        await vscode.workspace.applyEdit(edit);

        // Position cursor for Copilot to generate content (after the inserted text)
        const newPosition = new vscode.Position(i + 4, 0);
        editor.selection = new vscode.Selection(newPosition, newPosition);
        editor.revealRange(new vscode.Range(newPosition, newPosition));

        // Track Copilot interaction
        metricsCollector.trackCopilotInteraction();
        vscode.window.showInformationMessage(`Added suggestion prompt. Use Copilot to complete the content.`);
        break;
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error inserting Copilot suggestion: ${error}`);
  }
}

// ==============================
// UTILITY FUNCTIONS
// ==============================

/**
 * Get the path to the todo.md file in the current workspace
 */
async function getTodoPath(): Promise<string | null> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("No workspace folder found. Please open a folder in VS Code first.");
    return null;
  }

  // Use the first workspace folder
  const workspaceFolder = workspaceFolders[0];
  return path.join(workspaceFolder.uri.fsPath, CONFIG.DEFAULT_TODO_FILE);
}

/**
 * Creates a default todo.md file with some example tasks
 */
async function createDefaultTodoFile(filePath: string): Promise<string> {
  await fs.promises.writeFile(filePath, CONFIG.DEFAULT_TODO_CONTENT, "utf8");
  return filePath;
}

/**
 * Open the dashboard panel - our custom tab
 */
function openDashboard(context: vscode.ExtensionContext): void {
  try {
    DashboardPanel.createOrShow(context.extensionUri);
  } catch (error) {
    vscode.window.showErrorMessage(`Error opening dashboard: ${error}`);
  }
}
