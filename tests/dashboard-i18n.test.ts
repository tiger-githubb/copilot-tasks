/**
 * Tests for Dashboard i18n functionality
 */
import * as assert from "assert";
import * as nls from "vscode-nls";

suite("Dashboard i18n Tests", () => {
  test("should initialize vscode-nls without errors", () => {
    // This tests that vscode-nls can be imported and initialized
    const localize = nls.loadMessageBundle();
    assert.ok(localize, "localize function should be available");
    assert.strictEqual(typeof localize, "function", "localize should be a function");
  });

  test("should have fallback behavior for localization", () => {
    const localize = nls.loadMessageBundle();
    
    // Test with a key that might not exist - should return the fallback
    const result = localize("test.nonexistent", "Fallback Text");
    assert.strictEqual(result, "Fallback Text", "Should return fallback text for non-existent keys");
  });

  test("should handle string formatting", () => {
    const localize = nls.loadMessageBundle();
    
    // Test with parameter substitution
    const result = localize("test.format", "Hello {0}", "World");
    assert.ok(result.includes("World"), "Should substitute parameters correctly");
  });
});