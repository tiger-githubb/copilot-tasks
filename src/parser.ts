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
  private static readonly TASK_REGEX = /^(\s*)-\s*\[([ x])\]\s*(.+?)(?:\r?\n|$)/gm;
  private static readonly HEADER_REGEX = /^(#{1,6})\s*(.+?)(?:\r?\n|$)/gm;
  private static readonly TASK_LINE_REGEX = /^(\s*)-\s*\[([ x])\]\s*(.+)$/;
  private static readonly HEADER_LINE_REGEX = /^(#{1,6})\s*(.+)$/;

  /**
   * Parse a markdown content and extract all tasks
   */ public static parse(content: string): Task[] {
    const tasks: Task[] = [];
    const lines = content.split(/\r?\n/);
    let currentCategory: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; // Check for headers (categories)
      const headerMatch = line.match(this.HEADER_LINE_REGEX);
      if (headerMatch) {
        currentCategory = headerMatch[2].trim();
        continue;
      } // Check for tasks
      const taskMatch = line.match(this.TASK_LINE_REGEX);
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
    // Parse existing tasks to know which lines are already occupied
    const existingTasks = this.parse(originalContent);

    // Update existing tasks
    for (const task of tasks) {
      const existingTask = existingTasks.find((et) => et.id === task.id);
      if (existingTask && existingTask.line >= 0 && existingTask.line < updatedLines.length) {
        const checkbox = task.completed ? "[x]" : "[ ]";
        const lineMatch = updatedLines[existingTask.line].match(/^(\s*)-\s*\[([ x])\]\s*/);
        if (lineMatch) {
          const indent = lineMatch[1];
          updatedLines[existingTask.line] = `${indent}- ${checkbox} ${task.text}`;
        }
      }
    }

    // Add new tasks that don't exist in the original content
    const newTasks = tasks.filter((task) => !existingTasks.some((et) => et.id === task.id));

    if (newTasks.length > 0) {
      // Group new tasks by category
      const tasksByCategory = new Map<string, Task[]>();
      const uncategorizedTasks: Task[] = [];

      for (const task of newTasks) {
        if (task.category) {
          if (!tasksByCategory.has(task.category)) {
            tasksByCategory.set(task.category, []);
          }
          tasksByCategory.get(task.category)!.push(task);
        } else {
          uncategorizedTasks.push(task);
        }
      } // Add tasks to appropriate sections
      for (const [category, categoryTasks] of tasksByCategory) {
        const insertionInfo = this.findCategoryInsertionPoint(updatedLines, category);
        let insertIndex = insertionInfo.index;

        // Add category header if needed
        if (insertionInfo.needsHeader) {
          updatedLines.splice(insertIndex, 0, "", `## ${category}`, "");
          insertIndex += 3;
        }

        // Add tasks
        for (let i = 0; i < categoryTasks.length; i++) {
          const task = categoryTasks[i];
          const checkbox = task.completed ? "[x]" : "[ ]";
          const newTaskLine = `- ${checkbox} ${task.text}`;
          updatedLines.splice(insertIndex + i, 0, newTaskLine);
        }
      }

      // Add uncategorized tasks at the end
      if (uncategorizedTasks.length > 0) {
        // Ensure there's a "Tasks" section for uncategorized tasks
        let hasTasksSection = false;
        for (const line of updatedLines) {
          if (line.match(/^#{1,6}\s*Tasks\s*$/i)) {
            hasTasksSection = true;
            break;
          }
        }

        if (!hasTasksSection) {
          // Add a Tasks section if it doesn't exist
          updatedLines.push("", "## Tasks", "");
        } // Find insertion point for uncategorized tasks
        const insertionInfo = this.findCategoryInsertionPoint(updatedLines, "Tasks");
        let insertIndex = insertionInfo.index;

        // Add category header if needed
        if (insertionInfo.needsHeader) {
          updatedLines.splice(insertIndex, 0, "", `## Tasks`, "");
          insertIndex += 3;
        }

        // Add tasks
        for (let i = 0; i < uncategorizedTasks.length; i++) {
          const task = uncategorizedTasks[i];
          const checkbox = task.completed ? "[x]" : "[ ]";
          const newTaskLine = `- ${checkbox} ${task.text}`;
          updatedLines.splice(insertIndex + i, 0, newTaskLine);
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
  /**
   * Find the insertion point for a category
   */
  private static findCategoryInsertionPoint(lines: string[], category: string): { index: number; needsHeader: boolean } {
    let insertIndex = lines.length;
    let categoryFound = false;

    // Find the category section using simple string operations
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line is a header by looking for # at the start
      if (line.startsWith("#")) {
        // Extract the header text by removing all # characters and spaces from the beginning
        const headerText = line.replace(/^#+\s*/, "").trim();

        if (headerText.toLowerCase() === category.toLowerCase()) {
          categoryFound = true;
          insertIndex = i + 1; // Start right after the header

          // Find the end of this section by looking for the next header or end of file
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();

            // If we find another header, insert before it
            if (nextLine.startsWith("#")) {
              insertIndex = j;
              break;
            }

            // If we find a task line, update insertion point to after this task
            if (nextLine.match(/^-\s*\[([ x])\]\s*/)) {
              insertIndex = j + 1;
            }

            // If we find an empty line after tasks, that's a good insertion point
            if (nextLine === "" && insertIndex > i + 1) {
              break;
            }
          }
          break;
        }
      }
    }

    return { index: insertIndex, needsHeader: !categoryFound };
  }
}
