/**
 * Main extension entry point - orchestrates all components
 */
import * as vscode from "vscode";
import { registerAllCommands } from "./commands";
import { SyncManager } from "./core/sync-manager";
import { TaskManager } from "./core/task-manager";
import { MetricsCollector } from "./ui/metrics-view";
import { TaskTreeDataProvider } from "./ui/tree-provider";

/**
 * This method is called when your extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "copilot-tasks" is now active!');

  // Initialize core managers
  const taskManager = TaskManager.getInstance();
  const syncManager = SyncManager.getInstance();
  const metricsCollector = MetricsCollector.getInstance(context);

  // Initialize components
  taskManager.initialize();
  syncManager.initialize();

  // Initialize Tree View
  const taskTreeDataProvider = new TaskTreeDataProvider();
  const treeView = vscode.window.createTreeView("copilot-tasks.taskView", {
    treeDataProvider: taskTreeDataProvider,
    showCollapseAll: true,
  });

  // Register all commands
  registerAllCommands(context, taskManager, syncManager, metricsCollector, taskTreeDataProvider);

  // Add to disposables
  context.subscriptions.push(treeView);
}

/**
 * This method is called when your extension is deactivated
 */
export function deactivate() {
  // Dispose of managers
  TaskManager.getInstance().dispose();
  SyncManager.getInstance().dispose();
  MetricsCollector.getInstance(null as any).dispose();
}
