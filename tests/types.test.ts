/**
 * Tests for types and constants
 */
import * as assert from "assert";
import { COMMANDS, CONFIG, EXTENSION_ID, REGEX_PATTERNS } from "../src/constants";
import { Task, UsageMetrics } from "../src/types";

suite("Types and Constants Tests", () => {
  suite("Constants", () => {
    test("should have correct extension ID", () => {
      assert.strictEqual(EXTENSION_ID, "copilot-tasks");
    });

    test("should have all required commands", () => {
      const expectedCommands = [
        "copilot-tasks.openTodo",
        "copilot-tasks.addTask",
        "copilot-tasks.toggleTask",
        "copilot-tasks.forceSync",
        "copilot-tasks.refreshTree",
        "copilot-tasks.completeWithCopilot",
        "copilot-tasks.showMetrics",
        "copilot-tasks.showStats",
        "copilot-tasks.insertSuggestion",
        "copilot-tasks.syncStatus",
      ];
      const commandValues = Object.values(COMMANDS) as string[];
      expectedCommands.forEach((cmd) => {
        assert.ok(commandValues.includes(cmd), `Command ${cmd} should exist`);
      });
    });

    test("should have valid regex patterns", () => {
      // Test that regex patterns are actually RegExp objects
      assert.ok(REGEX_PATTERNS.TASK_REGEX instanceof RegExp);
      assert.ok(REGEX_PATTERNS.HEADER_REGEX instanceof RegExp);
      assert.ok(REGEX_PATTERNS.TASK_LINE_REGEX instanceof RegExp);
      assert.ok(REGEX_PATTERNS.HEADER_LINE_REGEX instanceof RegExp);
    });

    test("should have reasonable config values", () => {
      assert.strictEqual(CONFIG.DEFAULT_TODO_FILE, "todo.md");
      assert.ok(CONFIG.SYNC_INTERVAL > 0);
      assert.ok(CONFIG.MAX_TASK_LENGTH > 0);
      assert.ok(CONFIG.METRICS_RETENTION_DAYS > 0);
    });

    test("regex patterns should match expected formats", () => {
      // Test task regex
      const taskMatch = "- [ ] Sample task".match(REGEX_PATTERNS.TASK_LINE_REGEX);
      assert.ok(taskMatch, "Task regex should match unchecked task");

      const completedTaskMatch = "- [x] Completed task".match(REGEX_PATTERNS.TASK_LINE_REGEX);
      assert.ok(completedTaskMatch, "Task regex should match completed task");

      // Test header regex
      const headerMatch = "# Header".match(REGEX_PATTERNS.HEADER_LINE_REGEX);
      assert.ok(headerMatch, "Header regex should match header");
    });
  });

  suite("Types", () => {
    test("Task interface should be properly structured", () => {
      const task: Task = {
        id: "test-id",
        text: "Test task",
        completed: false,
        line: 0,
        category: "Test Category",
      };

      assert.strictEqual(task.id, "test-id");
      assert.strictEqual(task.text, "Test task");
      assert.strictEqual(task.completed, false);
      assert.strictEqual(task.line, 0);
      assert.strictEqual(task.category, "Test Category");
    });

    test("UsageMetrics interface should be properly structured", () => {
      const metrics: UsageMetrics = {
        tasksCreated: 5,
        tasksCompleted: 3,
        copilotInteractions: 2,
        githubSyncs: 1,
        sessionDuration: 1200,
        activeUsers: 1,
      };

      assert.strictEqual(metrics.tasksCreated, 5);
      assert.strictEqual(metrics.tasksCompleted, 3);
      assert.strictEqual(metrics.copilotInteractions, 2);
      assert.strictEqual(metrics.githubSyncs, 1);
      assert.strictEqual(metrics.sessionDuration, 1200);
      assert.strictEqual(metrics.activeUsers, 1);
    });

    test("Task priority should accept valid values", () => {
      const lowPriorityTask: Task = {
        id: "test",
        text: "Test",
        completed: false,
        line: 0,
        priority: "low",
      };

      const mediumPriorityTask: Task = {
        id: "test",
        text: "Test",
        completed: false,
        line: 0,
        priority: "medium",
      };

      const highPriorityTask: Task = {
        id: "test",
        text: "Test",
        completed: false,
        line: 0,
        priority: "high",
      };

      assert.strictEqual(lowPriorityTask.priority, "low");
      assert.strictEqual(mediumPriorityTask.priority, "medium");
      assert.strictEqual(highPriorityTask.priority, "high");
    });
  });
});
