/**
 * Parser for Markdown todo files
 * Handles parsing of task checkboxes and extracting task information
 */

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  line: number;
  category?: string;
}

export class TodoParser {
  private static readonly TASK_REGEX = /^(\s*)-\s*\[([ x])\]\s*(.+)$/gm;
  private static readonly HEADER_REGEX = /^(#{1,6})\s*(.+)$/gm;

  /**
   * Parse a markdown content and extract all tasks
   */
  public static parse(content: string): Task[] {
    const tasks: Task[] = [];
    const lines = content.split("\n");
    let currentCategory: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for headers (categories)
      const headerMatch = line.match(/^(#{1,6})\s*(.+)$/);
      if (headerMatch) {
        currentCategory = headerMatch[2].trim();
        continue;
      }

      // Check for tasks
      const taskMatch = line.match(/^(\s*)-\s*\[([ x])\]\s*(.+)$/);
      if (taskMatch) {
        const [, indent, checkbox, text] = taskMatch;
        const completed = checkbox.toLowerCase() === "x";

        tasks.push({
          id: this.generateTaskId(i, text),
          text: text.trim(),
          completed,
          line: i,
          category: currentCategory,
        });
      }
    }

    return tasks;
  }

  /**
   * Generate content from tasks array
   */
  public static generateContent(tasks: Task[], originalContent?: string): string {
    if (!originalContent) {
      return this.generateDefaultContent(tasks);
    }

    const lines = originalContent.split("\n");
    const updatedLines = [...lines];

    // Update existing tasks
    for (const task of tasks) {
      if (task.line < updatedLines.length) {
        const checkbox = task.completed ? "[x]" : "[ ]";
        const lineMatch = updatedLines[task.line].match(/^(\s*)-\s*\[([ x])\]\s*/);
        if (lineMatch) {
          const indent = lineMatch[1];
          updatedLines[task.line] = `${indent}- ${checkbox} ${task.text}`;
        }
      }
    }

    return updatedLines.join("\n");
  }

  /**
   * Update a specific task's completion status
   */
  public static updateTaskCompletion(content: string, taskId: string, completed: boolean): string {
    const tasks = this.parse(content);
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      return content;
    }

    task.completed = completed;
    return this.generateContent(tasks, content);
  }

  /**
   * Add a new task to the content
   */
  public static addTask(content: string, taskText: string, category?: string): string {
    const lines = content.split("\n");

    // Find the insertion point
    let insertIndex = lines.length;

    if (category) {
      // Find the category section
      for (let i = 0; i < lines.length; i++) {
        const headerMatch = lines[i].match(/^(#{1,6})\s*(.+)$/);
        if (headerMatch && headerMatch[2].trim() === category) {
          // Find the end of this section
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].match(/^#{1,6}/)) {
              insertIndex = j;
              break;
            }
          }
          break;
        }
      }
    }

    // Insert the new task
    const newTask = `- [ ] ${taskText}`;
    lines.splice(insertIndex, 0, newTask);

    return lines.join("\n");
  }

  /**
   * Generate a unique task ID
   */
  private static generateTaskId(line: number, text: string): string {
    const textHash = text.substring(0, 20).replace(/\s+/g, "-").toLowerCase();
    return `task-${line}-${textHash}`;
  }

  /**
   * Generate default content with tasks
   */
  private static generateDefaultContent(tasks: Task[]): string {
    let content = "# Todo List\n\n";

    const categories = new Set(tasks.map((t) => t.category).filter(Boolean));

    if (categories.size === 0) {
      content += "## Tasks\n\n";
      for (const task of tasks) {
        const checkbox = task.completed ? "[x]" : "[ ]";
        content += `- ${checkbox} ${task.text}\n`;
      }
    } else {
      for (const category of categories) {
        content += `## ${category}\n\n`;
        const categoryTasks = tasks.filter((t) => t.category === category);
        for (const task of categoryTasks) {
          const checkbox = task.completed ? "[x]" : "[ ]";
          content += `- ${checkbox} ${task.text}\n`;
        }
        content += "\n";
      }
    }

    return content;
  }

  /**
   * Get task statistics
   */
  public static getStats(tasks: Task[]): { total: number; completed: number; remaining: number; completionRate: number } {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const remaining = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, remaining, completionRate };
  }
}
