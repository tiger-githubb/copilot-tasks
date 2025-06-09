/**
 * Shared types and interfaces for the Copilot Tasks extension
 */

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  line: number;
  category?: string;
  priority?: "low" | "medium" | "high";
}

export interface ParsedTask extends Task {
  filePath: string;
  indentLevel: number;
}

export interface UsageMetrics {
  tasksCreated: number;
  tasksCompleted: number;
  copilotInteractions: number;
  githubSyncs: number;
  sessionDuration: number;
  activeUsers: number;
}

export interface SyncStatus {
  isEnabled: boolean;
  lastSync: Date | null;
  pendingChanges: number;
}

export interface TreeItem {
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  contextValue?: string;
  collapsibleState?: number;
  children?: TreeItem[];
}

export interface MetricsData {
  timestamp: number;
  metrics: UsageMetrics;
}
