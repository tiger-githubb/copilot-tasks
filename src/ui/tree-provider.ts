/**
 * TreeView provider for displaying tasks in the sidebar
 */

import * as vscode from "vscode";
import { TaskManager } from "../core/task-manager";
import { Task } from "../types";

export class TaskTreeItem extends vscode.TreeItem {
  constructor(public readonly task: Task, public readonly collapsibleState: vscode.TreeItemCollapsibleState) {
    super(task.text, collapsibleState);

    this.id = task.id;
    this.tooltip = this.getTooltip();
    this.description = this.getDescription();
    this.iconPath = this.getIcon();
    this.contextValue = this.getContextValue();
    this.command = this.getCommand();
  }
  private getTooltip(): string {
    const status = this.task.completed ? "✅ Completed" : "⏳ Pending";
    let tooltip = `${status}\n${this.task.text}`;

    if (this.task.category) {
      tooltip += `\nCategory: ${this.task.category}`;
    }

    if (this.task.line !== undefined) {
      tooltip += `\nLine: ${this.task.line + 1}`;
    }

    return tooltip;
  }

  private getDescription(): string | undefined {
    if (this.task.category) {
      return `[${this.task.category}]`;
    }
    return undefined;
  }

  private getIcon(): vscode.ThemeIcon {
    if (this.task.completed) {
      return new vscode.ThemeIcon("check", new vscode.ThemeColor("testing.iconPassed"));
    } else {
      return new vscode.ThemeIcon("circle-outline", new vscode.ThemeColor("testing.iconQueued"));
    }
  }

  private getContextValue(): string {
    return this.task.completed ? "completedTask" : "pendingTask";
  }

  private getCommand(): vscode.Command | undefined {
    return {
      command: "copilot-tasks.toggleTask",
      title: "Toggle Task",
      arguments: [this.task],
    };
  }
}

export class CategoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly category: string,
    public readonly tasks: Task[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(category, collapsibleState);

    this.id = `category-${category}`;
    this.tooltip = `${category} (${tasks.length} tasks)`;
    this.description = `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`;
    this.iconPath = new vscode.ThemeIcon("folder");
    this.contextValue = "taskCategory";
  }
}

export class TaskTreeDataProvider implements vscode.TreeDataProvider<TaskTreeItem | CategoryTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | CategoryTreeItem | undefined | null | void> =
    new vscode.EventEmitter<TaskTreeItem | CategoryTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | CategoryTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private taskManager: TaskManager;
  private groupByCategory: boolean = true;

  constructor() {
    this.taskManager = TaskManager.getInstance();

    // Listen to task changes
    this.taskManager.onTasksChanged(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TaskTreeItem | CategoryTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TaskTreeItem | CategoryTreeItem): Thenable<(TaskTreeItem | CategoryTreeItem)[]> {
    if (!element) {
      // Root level - show categories or tasks
      return Promise.resolve(this.getRootItems());
    } else if (element instanceof CategoryTreeItem) {
      // Category level - show tasks in this category
      return Promise.resolve(element.tasks.map((task) => new TaskTreeItem(task, vscode.TreeItemCollapsibleState.None)));
    } else {
      // Task level - no children
      return Promise.resolve([]);
    }
  }

  private getRootItems(): (TaskTreeItem | CategoryTreeItem)[] {
    const tasks = this.taskManager.getTasks();

    if (!this.groupByCategory) {
      // Show all tasks directly
      return tasks.map((task) => new TaskTreeItem(task, vscode.TreeItemCollapsibleState.None));
    }

    // Group tasks by category
    const categorized = new Map<string, Task[]>();
    const uncategorized: Task[] = [];

    for (const task of tasks) {
      if (task.category) {
        if (!categorized.has(task.category)) {
          categorized.set(task.category, []);
        }
        categorized.get(task.category)!.push(task);
      } else {
        uncategorized.push(task);
      }
    }

    const result: (TaskTreeItem | CategoryTreeItem)[] = [];

    // Add categorized tasks
    for (const [category, categoryTasks] of categorized) {
      result.push(new CategoryTreeItem(category, categoryTasks, vscode.TreeItemCollapsibleState.Expanded));
    }

    // Add uncategorized tasks
    for (const task of uncategorized) {
      result.push(new TaskTreeItem(task, vscode.TreeItemCollapsibleState.None));
    }

    return result;
  }

  public toggleGrouping(): void {
    this.groupByCategory = !this.groupByCategory;
    this.refresh();
  }

  public getGroupingMode(): boolean {
    return this.groupByCategory;
  }
}
