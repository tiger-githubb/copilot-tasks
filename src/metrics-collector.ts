import * as vscode from "vscode";

export interface UsageMetrics {
  tasksCreated: number;
  tasksCompleted: number;
  copilotInteractions: number;
  githubSyncs: number;
  activeUsers: number;
  sessionDuration: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: UsageMetrics;
  private sessionStart: number;
  private context: vscode.ExtensionContext;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.sessionStart = Date.now();
    this.metrics = this.loadMetrics();
  }

  public static getInstance(context: vscode.ExtensionContext): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector(context);
    }
    return MetricsCollector.instance;
  }

  private loadMetrics(): UsageMetrics {
    return this.context.globalState.get("copilot-tasks.metrics", {
      tasksCreated: 0,
      tasksCompleted: 0,
      copilotInteractions: 0,
      githubSyncs: 0,
      activeUsers: 1,
      sessionDuration: 0,
    });
  }

  private saveMetrics(): void {
    this.context.globalState.update("copilot-tasks.metrics", this.metrics);
  }

  public trackTaskCreated(): void {
    this.metrics.tasksCreated++;
    this.saveMetrics();
    console.log(`[Metrics] Task created. Total: ${this.metrics.tasksCreated}`);
  }

  public trackTaskCompleted(): void {
    this.metrics.tasksCompleted++;
    this.saveMetrics();
    console.log(`[Metrics] Task completed. Total: ${this.metrics.tasksCompleted}`);
  }

  public trackCopilotInteraction(): void {
    this.metrics.copilotInteractions++;
    this.saveMetrics();
    console.log(`[Metrics] Copilot interaction. Total: ${this.metrics.copilotInteractions}`);
  }

  public trackGithubSync(): void {
    this.metrics.githubSyncs++;
    this.saveMetrics();
    console.log(`[Metrics] GitHub sync. Total: ${this.metrics.githubSyncs}`);
  }

  public updateSessionDuration(): void {
    this.metrics.sessionDuration = Date.now() - this.sessionStart;
    this.saveMetrics();
  }

  public getMetrics(): UsageMetrics {
    this.updateSessionDuration();
    return { ...this.metrics };
  }

  public getProductivityScore(): number {
    const completionRate = this.metrics.tasksCompleted / Math.max(this.metrics.tasksCreated, 1);
    const copilotUsage = this.metrics.copilotInteractions / Math.max(this.metrics.tasksCreated, 1);
    return Math.round((completionRate * 0.7 + copilotUsage * 0.3) * 100);
  }

  public async showMetricsSummary(): Promise<void> {
    const metrics = this.getMetrics();
    const productivityScore = this.getProductivityScore();
    const sessionHours = Math.round((metrics.sessionDuration / (1000 * 60 * 60)) * 100) / 100;

    const message = `📊 Copilot Tasks Metrics:
        
✅ Tasks Created: ${metrics.tasksCreated}
🎯 Tasks Completed: ${metrics.tasksCompleted}
🤖 Copilot Interactions: ${metrics.copilotInteractions}
📈 Productivity Score: ${productivityScore}%
⏱️ Session Duration: ${sessionHours}h

${
  productivityScore > 80
    ? "🚀 Excellent productivity!"
    : productivityScore > 60
    ? "👍 Good progress!"
    : "💡 Try using Copilot more for better results!"
}`;

    vscode.window.showInformationMessage(message, "Export Metrics", "Reset Metrics").then(async (selection) => {
      if (selection === "Export Metrics") {
        await this.exportMetrics();
      } else if (selection === "Reset Metrics") {
        await this.resetMetrics();
      }
    });
  }

  private async exportMetrics(): Promise<void> {
    const metrics = this.getMetrics();
    const data = {
      timestamp: new Date().toISOString(),
      extension: "copilot-tasks",
      version: "0.0.1",
      publisher: "TigerDev",
      ...metrics,
      productivityScore: this.getProductivityScore(),
    };

    const jsonData = JSON.stringify(data, null, 2);

    try {
      const document = await vscode.workspace.openTextDocument({
        content: jsonData,
        language: "json",
      });
      await vscode.window.showTextDocument(document);
      vscode.window.showInformationMessage("📊 Metrics exported successfully!");
    } catch (error) {
      vscode.window.showErrorMessage("Failed to export metrics: " + error);
    }
  }

  private async resetMetrics(): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      "Are you sure you want to reset all metrics? This action cannot be undone.",
      "Yes, Reset",
      "Cancel"
    );

    if (confirm === "Yes, Reset") {
      this.metrics = {
        tasksCreated: 0,
        tasksCompleted: 0,
        copilotInteractions: 0,
        githubSyncs: 0,
        activeUsers: 1,
        sessionDuration: 0,
      };
      this.sessionStart = Date.now();
      this.saveMetrics();
      vscode.window.showInformationMessage("🔄 Metrics reset successfully!");
    }
  }

  public dispose(): void {
    this.updateSessionDuration();
    this.saveMetrics();
  }
}
