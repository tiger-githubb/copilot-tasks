// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { TodoParser } from "./parser";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "copilot-tasks" is now active!');

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
      const todoPath = await getTodoPath();
      if (!todoPath) {
        return;
      }

      // Get task text from user
      const taskText = await vscode.window.showInputBox({
        prompt: "Enter the task description",
        placeHolder: "What needs to be done?",
      });

      if (!taskText) {
        return;
      }

      // Get category (optional)
      const category = await vscode.window.showInputBox({
        prompt: "Enter category (optional)",
        placeHolder: "Tasks, Ideas, Bugs, etc.",
      });

      // Read current content
      let content = "";
      if (fs.existsSync(todoPath)) {
        content = await fs.promises.readFile(todoPath, "utf8");
      } else {
        content = await createDefaultTodoFile(todoPath);
      }

      // Add the new task
      const updatedContent = TodoParser.addTask(content, taskText, category || undefined);
      await fs.promises.writeFile(todoPath, updatedContent, "utf8");

      vscode.window.showInformationMessage(`Task added: "${taskText}"`);
    } catch (error) {
      vscode.window.showErrorMessage(`Error adding task: ${error}`);
    }
  });

  // Register the command to toggle task completion
  const toggleTaskDisposable = vscode.commands.registerCommand("copilot-tasks.toggleTask", async () => {
    try {
      const todoPath = await getTodoPath();
      if (!todoPath || !fs.existsSync(todoPath)) {
        vscode.window.showErrorMessage("No todo.md file found. Create one first.");
        return;
      }

      // Read current content
      const content = await fs.promises.readFile(todoPath, "utf8");
      const tasks = TodoParser.parse(content);

      if (tasks.length === 0) {
        vscode.window.showInformationMessage("No tasks found in todo.md");
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

      // Toggle the task
      const updatedContent = TodoParser.updateTaskCompletion(content, selectedItem.task.id, !selectedItem.task.completed);

      await fs.promises.writeFile(todoPath, updatedContent, "utf8");

      const status = selectedItem.task.completed ? "uncompleted" : "completed";
      vscode.window.showInformationMessage(`Task marked as ${status}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Error toggling task: ${error}`);
    }
  });

  // Register the command to show task statistics
  const showStatsDisposable = vscode.commands.registerCommand("copilot-tasks.showStats", async () => {
    try {
      const todoPath = await getTodoPath();
      if (!todoPath || !fs.existsSync(todoPath)) {
        vscode.window.showErrorMessage("No todo.md file found. Create one first.");
        return;
      }

      // Read current content and parse tasks
      const content = await fs.promises.readFile(todoPath, "utf8");
      const tasks = TodoParser.parse(content);
      const stats = TodoParser.getStats(tasks);

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

  context.subscriptions.push(openTodoDisposable, addTaskDisposable, toggleTaskDisposable, showStatsDisposable);
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
export function deactivate() {}
