/**
 * Unit tests for extension structure and core modules (VS Code independent)
 */
import * as assert from "assert";

// Import only modules that don't depend on VS Code
import * as constants from "../src/constants";

// Use require() for dynamic imports to avoid VS Code dependency issues
function requireCoreModule(modulePath: string) {
  try {
    return require(modulePath);
  } catch (error) {
    console.error(`Failed to require ${modulePath}:`, error);
    return null;
  }
}

suite("Extension Structure Tests (Unit)", () => {
  test("Constants module should export required constants", () => {
    assert.ok(constants.EXTENSION_ID !== undefined, "EXTENSION_ID should be defined");
    assert.ok(constants.COMMANDS !== undefined, "COMMANDS should be defined");
    assert.ok(constants.CONFIG !== undefined, "CONFIG should be defined");
    assert.ok(constants.REGEX_PATTERNS !== undefined, "REGEX_PATTERNS should be defined");
  });
  test("Constants should have expected values", () => {
    assert.strictEqual(constants.EXTENSION_ID, "copilot-tasks");
    assert.strictEqual(constants.CONFIG.DEFAULT_TODO_FILE, "todo.md");
    assert.ok(constants.CONFIG.SYNC_INTERVAL > 0);
    assert.ok(Array.isArray(constants.CONFIG.TODO_PATTERNS));
    assert.ok(Array.isArray(constants.CONFIG.DONE_PATTERNS));
  });
  test("Core module parser should be importable without VS Code", () => {
    // Test that the parser module can be imported without VS Code dependencies
    const TodoParser = requireCoreModule("../src/core/parser");
    assert.ok(TodoParser !== null, "TodoParser should be importable");
    assert.ok(TodoParser.TodoParser !== undefined, "TodoParser class should be exported");

    // Test that we can actually use the parser
    const content = "- [ ] Test task\n- [x] Completed task";
    const tasks = TodoParser.TodoParser.parse(content);
    assert.ok(Array.isArray(tasks), "Parser should return an array");
    assert.strictEqual(tasks.length, 2, "Parser should find 2 tasks");
  });
  test("COMMANDS constants should be properly structured", () => {
    const commands = constants.COMMANDS;
    assert.ok(typeof commands.OPEN_TODO === "string");
    assert.ok(typeof commands.ADD_TASK === "string");
    assert.ok(typeof commands.TOGGLE_TASK === "string");
    assert.ok(typeof commands.FORCE_SYNC === "string");
    assert.ok(typeof commands.SHOW_METRICS === "string");
    assert.ok(typeof commands.REFRESH_TREE === "string");
  });
  test("REGEX_PATTERNS should be valid RegExp objects", () => {
    const patterns = constants.REGEX_PATTERNS;
    assert.ok(patterns.TASK_REGEX instanceof RegExp, "TASK_REGEX pattern should be a RegExp");
    assert.ok(patterns.HEADER_REGEX instanceof RegExp, "HEADER_REGEX pattern should be a RegExp");
    assert.ok(patterns.TASK_LINE_REGEX instanceof RegExp, "TASK_LINE_REGEX pattern should be a RegExp");
    assert.ok(patterns.HEADER_LINE_REGEX instanceof RegExp, "HEADER_LINE_REGEX pattern should be a RegExp");
  });
});
