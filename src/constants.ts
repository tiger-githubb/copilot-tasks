/**
 * Constants and configuration for the Copilot Tasks extension
 */

export const EXTENSION_ID = "copilot-tasks";

export const COMMANDS = {
  OPEN_TODO: "copilot-tasks.openTodo",
  ADD_TASK: "copilot-tasks.addTask",
  TOGGLE_TASK: "copilot-tasks.toggleTask",
  FORCE_SYNC: "copilot-tasks.forceSync",
  REFRESH_TREE: "copilot-tasks.refreshTree",
  COMPLETE_WITH_COPILOT: "copilot-tasks.completeWithCopilot",
  SHOW_METRICS: "copilot-tasks.showMetrics",
  SHOW_STATS: "copilot-tasks.showStats",
  INSERT_SUGGESTION: "copilot-tasks.insertCopilotSuggestion", // Fixed: match package.json
  SYNC_STATUS: "copilot-tasks.syncStatus",
  OPEN_DASHBOARD: "copilot-tasks.openDashboard",
} as const;

export const CONFIG = {
  // Task patterns for parsing
  TODO_PATTERNS: [/- \[ \]/, /\* \[ \]/, /\d+\. \[ \]/],
  DONE_PATTERNS: [/- \[x\]/, /\* \[x\]/, /\d+\. \[x\]/],

  // File configuration
  DEFAULT_TODO_FILE: "todo.md",
  DEFAULT_TODO_CONTENT: `# TODO

## Tasks
- [ ] Sample task
- [x] Completed task

## Ideas
- [ ] New feature idea

## Bugs
- [ ] Fix this bug
`,

  // Sync configuration
  SYNC_INTERVAL: 30000, // 30 seconds
  MAX_TASK_LENGTH: 500,
  MAX_CATEGORY_LENGTH: 50,

  // UI configuration
  TREE_VIEW_ID: "copilot-tasks.taskView",

  // Metrics configuration
  METRICS_FILE: "copilot-tasks-metrics.json",
  METRICS_RETENTION_DAYS: 30,
} as const;

export const REGEX_PATTERNS = {
  TASK_REGEX: /^(\s*)-\s*\[([ x])\]\s*(.+?)(?:\r?\n|$)/gm,
  HEADER_REGEX: /^(#{1,6})\s*(.+?)(?:\r?\n|$)/gm,
  TASK_LINE_REGEX: /^(\s*)-\s*\[([ x])\]\s*(.+)$/,
  HEADER_LINE_REGEX: /^(#{1,6})\s*(.+)$/,
} as const;

export const TREE_ITEM_CONTEXT = {
  TASK_INCOMPLETE: "taskIncomplete",
  TASK_COMPLETE: "taskComplete",
  CATEGORY: "category",
  ROOT: "root",
} as const;
