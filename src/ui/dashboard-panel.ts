/**
 * Dashboard WebView Panel - Onglet personnalisé pour l'extension
 */
import * as vscode from "vscode";
import { TaskManager } from "../core/task-manager";
import { Task } from "../types";

export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  public static readonly viewType = "copilotTasksDashboard";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // Si le panel existe déjà, le montrer
    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Sinon, créer un nouveau panel
    const panel = vscode.window.createWebviewPanel(
      DashboardPanel.viewType,
      "Copilot Tasks Dashboard",
      column || vscode.ViewColumn.One,
      {
        // Activer JavaScript dans le webview
        enableScripts: true,
        // Conserver l'état quand caché
        retainContextWhenHidden: true,
        // Restriction du contenu local uniquement
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "resources")],
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Définir le contenu initial
    this._update();

    // Écouter quand le panel se ferme
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Écouter les messages du webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "refresh":
            this._update();
            return;
          case "addTask":
            this._handleAddTask(message.text);
            return;
          case "deleteTask":
            this._handleDeleteTask(message.taskId);
            return;
          case "toggleTask":
            this._handleToggleTask(message.taskId);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private async _handleAddTask(taskText: string) {
    if (taskText && taskText.trim()) {
      const taskManager = TaskManager.getInstance();
      await taskManager.addTask(taskText.trim());
      this._update(); // Rafraîchir l'affichage

      vscode.window.showInformationMessage(`Tâche ajoutée: ${taskText}`);
    }
  }

  private async _handleDeleteTask(taskId: string) {
    const taskManager = TaskManager.getInstance();
    const tasks = taskManager.getTasks();
    const task = tasks.find((t) => t.id === taskId);

    if (task) {
      const response = await vscode.window.showWarningMessage(
        `Êtes-vous sûr de vouloir supprimer la tâche "${task.text}" ?`,
        "Oui",
        "Non"
      );

      if (response === "Oui") {
        await taskManager.deleteTask(taskId);
        this._update();
        vscode.window.showInformationMessage("Tâche supprimée avec succès");
      }
    }
  }

  private async _handleToggleTask(taskId: string) {
    const taskManager = TaskManager.getInstance();
    await taskManager.toggleTask(taskId);
    this._update(); // Rafraîchir l'affichage
  }

  public dispose() {
    DashboardPanel.currentPanel = undefined;

    // Nettoyer les ressources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;
    this._panel.title = "Copilot Tasks Dashboard";
    this._panel.webview.html = await this._getHtmlForWebview(webview);
  }

  private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    // Récupérer les tâches
    const taskManager = TaskManager.getInstance();
    const tasks = taskManager.getTasks();

    // Statistiques
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Copilot Tasks Dashboard</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                padding: 20px;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .title {
                font-size: 24px;
                font-weight: bold;
                color: var(--vscode-textPreformat-foreground);
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: var(--vscode-editor-inactiveSelectionBackground);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            
            .stat-number {
                font-size: 32px;
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
                margin-bottom: 8px;
            }
            
            .stat-label {
                font-size: 14px;
                color: var(--vscode-descriptionForeground);
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: var(--vscode-progressBar-background);
                border-radius: 4px;
                overflow: hidden;
                margin: 10px 0;
            }
            
            .progress-fill {
                height: 100%;
                background: var(--vscode-progressBar-background);
                background: linear-gradient(90deg, #4CAF50, #45a049);
                width: ${completionRate}%;
                transition: width 0.3s ease;
            }
            
            .add-task-form {
                background: var(--vscode-input-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 30px;
            }
            
            .form-group {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .form-input {
                flex: 1;
                background: var(--vscode-input-background);
                border: 1px solid var(--vscode-input-border);
                color: var(--vscode-input-foreground);
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .btn {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }
            
            .btn:hover {
                background: var(--vscode-button-hoverBackground);
            }
            
            .btn-refresh {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }
            
            .tasks-section {
                margin-top: 30px;
            }
              .task-item {
                display: flex;
                align-items: center;
                padding: 12px;
                margin: 8px 0;
                background: var(--vscode-list-inactiveSelectionBackground);
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .task-item:hover {
                background: var(--vscode-list-hoverBackground);
            }
            
            .task-checkbox {
                margin-right: 12px;
                cursor: pointer;
            }
            
            .task-text {
                flex: 1;
                font-size: 14px;
            }
            
            .task-completed {
                text-decoration: line-through;
                opacity: 0.6;
            }
            
            .btn-delete {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-left: 8px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .btn-delete:hover {
                opacity: 1;
                background: var(--vscode-errorForeground);
                color: white;
            }
            
            .filter-section {
                margin-bottom: 20px;
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .filter-btn {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }
            
            .filter-btn.active {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }
            
            .section-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
                color: var(--vscode-textPreformat-foreground);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">📋 Copilot Tasks Dashboard</div>
            <button class="btn btn-refresh" onclick="refreshDashboard()">🔄 Actualiser</button>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${totalTasks}</div>
                <div class="stat-label">Total Tâches</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${completedTasks}</div>
                <div class="stat-label">Complétées</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${pendingTasks}</div>
                <div class="stat-label">En Attente</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${completionRate}%</div>
                <div class="stat-label">Progression</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        </div>
        
        <div class="add-task-form">
            <div class="section-title">➕ Ajouter une tâche</div>
            <div class="form-group">
                <input type="text" class="form-input" id="taskInput" placeholder="Entrez votre nouvelle tâche..." />
                <button class="btn" onclick="addTask()">Ajouter</button>
            </div>
        </div>
          <div class="tasks-section">
            <div class="section-title">📝 Mes Tâches</div>
            <div class="filter-section">
                <button class="filter-btn active" onclick="filterTasks('all')">Toutes</button>
                <button class="filter-btn" onclick="filterTasks('pending')">En cours</button>
                <button class="filter-btn" onclick="filterTasks('completed')">Terminées</button>
            </div>
            <div id="tasks-container">
                ${this._generateTasksHtml(tasks)}
            </div>
        </div>        <script>
            const vscode = acquireVsCodeApi();
            let currentFilter = 'all';
            
            function refreshDashboard() {
                vscode.postMessage({ command: 'refresh' });
            }
            
            function addTask() {
                const input = document.getElementById('taskInput');
                const text = input.value.trim();
                
                if (text) {
                    vscode.postMessage({ 
                        command: 'addTask', 
                        text: text 
                    });
                    input.value = '';
                }
            }
            
            function toggleTask(taskId) {
                vscode.postMessage({ 
                    command: 'toggleTask', 
                    taskId: taskId 
                });
            }
            
            function deleteTask(taskId) {
                vscode.postMessage({ 
                    command: 'deleteTask', 
                    taskId: taskId 
                });
            }
            
            function filterTasks(filter) {
                currentFilter = filter;
                
                // Update button states
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                event.target.classList.add('active');
                
                // Filter tasks
                const taskItems = document.querySelectorAll('.task-item');
                taskItems.forEach(item => {
                    const isCompleted = item.querySelector('.task-checkbox').checked;
                    let show = true;
                    
                    switch(filter) {
                        case 'pending':
                            show = !isCompleted;
                            break;
                        case 'completed':
                            show = isCompleted;
                            break;
                        case 'all':
                        default:
                            show = true;
                            break;
                    }
                    
                    item.style.display = show ? 'flex' : 'none';
                });
            }
            
            // Permettre d'ajouter avec Entrée
            document.getElementById('taskInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addTask();
                }
            });
        </script>
    </body>
    </html>`;
  }

  private _generateTasksHtml(tasks: Task[]): string {
    if (tasks.length === 0) {
      return `<p style="text-align: center; color: var(--vscode-descriptionForeground); padding: 40px;">
        Aucune tâche trouvée. Ajoutez votre première tâche ci-dessus ! 🚀
      </p>`;
    }
    return tasks
      .map(
        (task) => `
      <div class="task-item">
        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} readonly onclick="toggleTask('${task.id}')" />
        <span class="task-text ${task.completed ? "task-completed" : ""}" onclick="toggleTask('${task.id}')">${this._escapeHtml(
          task.text
        )}</span>
        <button class="btn-delete" onclick="event.stopPropagation(); deleteTask('${task.id}')" title="Supprimer la tâche">🗑️</button>
      </div>
    `
      )
      .join("");
  }
  private _escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
}
