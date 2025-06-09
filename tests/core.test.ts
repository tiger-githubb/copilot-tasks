/**
 * Unit tests for the core logic (without VS Code dependencies)
 */
import * as assert from "assert";
import { TodoParser } from "../src/core/parser";
import { Task } from "../src/types";

suite("Core Logic Tests", () => {
  suite("TodoParser", () => {
    test("should parse simple tasks", () => {
      const content = `# Tasks
- [ ] Task 1
- [x] Task 2 completed
- [ ] Task 3`;

      const tasks: Task[] = TodoParser.parse(content);

      assert.strictEqual(tasks.length, 3);
      assert.strictEqual(tasks[0].text, "Task 1");
      assert.strictEqual(tasks[0].completed, false);
      assert.strictEqual(tasks[1].text, "Task 2 completed");
      assert.strictEqual(tasks[1].completed, true);
      assert.strictEqual(tasks[2].text, "Task 3");
      assert.strictEqual(tasks[2].completed, false);
    });

    test("should handle categories from headers", () => {
      const content = `# Work Tasks
- [ ] Review PR
- [ ] Write documentation

## Personal
- [x] Buy groceries
- [ ] Call doctor`;

      const tasks: Task[] = TodoParser.parse(content);

      assert.strictEqual(tasks.length, 4);
      assert.strictEqual(tasks[0].category, "Work Tasks");
      assert.strictEqual(tasks[1].category, "Work Tasks");
      assert.strictEqual(tasks[2].category, "Personal");
      assert.strictEqual(tasks[3].category, "Personal");
    });

    test("should handle empty content", () => {
      const tasks: Task[] = TodoParser.parse("");
      assert.strictEqual(tasks.length, 0);
    });

    test("should handle content without tasks", () => {
      const content = `# My Notes
This is just some text without any tasks.
No checkboxes here.`;

      const tasks: Task[] = TodoParser.parse(content);
      assert.strictEqual(tasks.length, 0);
    });

    test("should assign correct line numbers", () => {
      const content = `# Tasks

- [ ] First task
- [ ] Second task

- [x] Third task`;

      const tasks: Task[] = TodoParser.parse(content);

      assert.strictEqual(tasks.length, 3);
      assert.strictEqual(tasks[0].line, 2); // Line numbers are 0-based
      assert.strictEqual(tasks[1].line, 3);
      assert.strictEqual(tasks[2].line, 5);
    });

    test("should generate unique IDs for tasks", () => {
      const content = `- [ ] Task 1
- [ ] Task 2
- [ ] Task 3`;

      const tasks: Task[] = TodoParser.parse(content);

      const ids = tasks.map((task) => task.id);
      const uniqueIds = new Set(ids);

      assert.strictEqual(ids.length, uniqueIds.size, "All task IDs should be unique");
    });

    test("should handle mixed indentation", () => {
      const content = `# Tasks
- [ ] Top level task
  - [ ] Indented task
    - [ ] Deeply indented task`;

      const tasks: Task[] = TodoParser.parse(content);

      assert.strictEqual(tasks.length, 3);
      // All should have the same category
      tasks.forEach((task) => {
        assert.strictEqual(task.category, "Tasks");
      });
    });
  });
});
