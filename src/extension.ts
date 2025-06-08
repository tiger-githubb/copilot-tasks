// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { MetricsCollector } from "./metrics-collector";
import { SyncManager } from "./sync-manager";
import { TaskManager } from "./task-manager";
import { TaskTreeDataProvider } from "./tree-view-provider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "copilot-tasks" is now active!');

  // Initialize metrics collector
  const metricsCollector = MetricsCollector.getInstance(context);

  // Initialize task manager and synchronization
  const taskManager = TaskManager.getInstance();
  const syncManager = SyncManager.getInstance();

  // Initialize components
  taskManager.initialize();
  syncManager.initialize();

  // Initialize TreeView
  const taskTreeDataProvider = new TaskTreeDataProvider();
  const treeView = vscode.window.createTreeView("copilot-tasks.taskView", {
    treeDataProvider: taskTreeDataProvider,
    showCollapseAll: true,
  });

  // Add to disposables
  context.subscriptions.push(treeView);

  // Register the command to open/create the todo.md file
  const openTodoDisposable = vscode.commands.registerCommand("copilot-tasks.openTodo", async () => {
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
  });
  // Register the command to add a new task
  const addTaskDisposable = vscode.commands.registerCommand("copilot-tasks.addTask", async () => {
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
  });

  // Register the command to toggle task completion (supports both TreeView and QuickPick)
  const toggleTaskDisposable = vscode.commands.registerCommand("copilot-tasks.toggleTask", async (taskArg?: any) => {
    try {
      let taskToToggle;

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
  });

  // Register the command to show task statistics
  const showStatsDisposable = vscode.commands.registerCommand("copilot-tasks.showStats", async () => {
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
  });

  // Register the command to force synchronization
  const forceSyncDisposable = vscode.commands.registerCommand("copilot-tasks.forceSync", async () => {
    try {
      await syncManager.forcSync();
      vscode.window.showInformationMessage("Synchronization completed!");
    } catch (error) {
      vscode.window.showErrorMessage(`Error during sync: ${error}`);
    }
  });

  // Register the command to show sync status
  const syncStatusDisposable = vscode.commands.registerCommand("copilot-tasks.syncStatus", () => {
    syncManager.showSyncStatus();
  });

  // Register metrics commands
  const showMetricsDisposable = vscode.commands.registerCommand("copilot-tasks.showMetrics", async () => {
    await metricsCollector.showMetricsSummary();
  });

  // Register TreeView commands
  const refreshTreeDisposable = vscode.commands.registerCommand("copilot-tasks.refreshTree", () => {
    taskTreeDataProvider.refresh();
  });

  const toggleGroupingDisposable = vscode.commands.registerCommand("copilot-tasks.toggleGrouping", () => {
    taskTreeDataProvider.toggleGrouping();
    const mode = taskTreeDataProvider.getGroupingMode() ? "categories" : "flat list";
    vscode.window.showInformationMessage(`Tasks now grouped by: ${mode}`);
  });

  // Register the command to complete with Copilot
  const completeWithCopilotDisposable = vscode.commands.registerCommand("copilot-tasks.completeWithCopilot", async (taskArg?: any) => {
    try {
      let taskToComplete;

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
      const editor = await vscode.window.showTextDocument(document);

      // Find the task in the document and position cursor
      const content = document.getText();
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(taskToComplete.text)) {
          const position = new vscode.Position(i, lines[i].length);
          editor.selection = new vscode.Selection(position, position);
          editor.revealRange(new vscode.Range(position, position));

          // Add a new line for Copilot to work with
          const edit = new vscode.WorkspaceEdit();
          edit.insert(document.uri, position, "\n\n// TODO: ");
          await vscode.workspace.applyEdit(edit);

          // Position cursor after the comment
          const newPosition = new vscode.Position(i + 2, 9);
          editor.selection = new vscode.Selection(newPosition, newPosition);

          // Track Copilot interaction
          metricsCollector.trackCopilotInteraction();

          vscode.window.showInformationMessage(`Positioned cursor for Copilot completion. Task: "${taskToComplete.text}"`);
          break;
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error completing with Copilot: ${error}`);
    }
  });

  // Register the command to insert Copilot suggestion
  const insertCopilotSuggestionDisposable = vscode.commands.registerCommand(
    "copilot-tasks.insertCopilotSuggestion",
    async (taskArg?: any) => {
      try {
        let selectedTask;

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
        const editor = await vscode.window.showTextDocument(document);

        // Find insertion point after the selected task
        const content = document.getText();
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(selectedTask.text)) {
            const insertPosition = new vscode.Position(i + 1, 0);
            const suggestionText = `\n### ${selectedSuggestion}\n\n`;

            const edit = new vscode.WorkspaceEdit();
            edit.insert(document.uri, insertPosition, suggestionText);
            await vscode.workspace.applyEdit(edit);

            // Position cursor for Copilot to generate content
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
  );

  context.subscriptions.push(
    openTodoDisposable,
    addTaskDisposable,
    toggleTaskDisposable,
    showStatsDisposable,
    forceSyncDisposable,
    syncStatusDisposable,
    showMetricsDisposable,
    refreshTreeDisposable,
    toggleGroupingDisposable,
    completeWithCopilotDisposable,
    insertCopilotSuggestionDisposable
  );
}

/**
 * Get the path to the todo.md file in the current workspace
 */
async function getTodoPath(): Promise<string | null> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found. Please open a folder first.");
    return null;
  }

  return path.join(workspaceFolder.uri.fsPath, "todo.md");
}

/**
 * Creates a default todo.md file with some example tasks
 */
async function createDefaultTodoFile(filePath: string): Promise<string> {
  const defaultContent = `# Todo List

Welcome to your task manager! Use checkboxes to track your progress.

## Tasks

- [ ] First task - Edit this list to add your own tasks
- [ ] Second task - Mark tasks as done by changing [ ] to [x]
- [x] Example completed task

## Ideas

- [ ] Add more tasks as needed
- [ ] Organize tasks by categories
- [ ] Use Copilot to help generate task descriptions

---
*This file is managed by Copilot Tasks extension*
`;

  try {
    await fs.promises.writeFile(filePath, defaultContent, "utf8");
    return defaultContent;
  } catch (error) {
    throw new Error(`Failed to create todo.md: ${error}`);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  // Dispose of managers
  TaskManager.getInstance().dispose();
  SyncManager.getInstance().dispose();
  MetricsCollector.getInstance(null as any).dispose();
}
