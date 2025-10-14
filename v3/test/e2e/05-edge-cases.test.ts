/**
 * @file
 *
 *   E2E tests for edge cases and error scenarios.
 *
 *   Tests boundary conditions, error handling, and unusual scenarios.
 *
 * @category E2E Testing
 */

import { expect, test } from "vitest";
import { compileMatcher } from "../../src/patterns/matcher";
import { parsePattern } from "../../src/patterns/parser";
import { createMemoryAdapter } from "../../src/runtime";
import { RouterState } from "../../src/state/router-state.svelte";

test("Edge case - empty path", () => {
  const result = parsePattern("");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/")).toMatchObject({ matched: true });
  expect(matcher("")).toMatchObject({ matched: true });
});

test("Edge case - root path variations", () => {
  const result = parsePattern("/");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/")).toMatchObject({ matched: true });
  expect(matcher("")).toMatchObject({ matched: true });
  expect(matcher("//")).toMatchObject({ matched: true });
});

test("Edge case - trailing slashes", () => {
  const result = parsePattern("/users");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/users")).toMatchObject({ matched: true });
  expect(matcher("/users/")).toMatchObject({ matched: true });
  expect(matcher("/users///")).toMatchObject({ matched: true });
});

test("Edge case - multiple consecutive slashes", () => {
  const result = parsePattern("/users/:id/posts");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/users/123/posts")).toMatchObject({
    matched: true,
    params: { id: "123" }
  });

  expect(matcher("//users//123//posts")).toMatchObject({
    matched: true,
    params: { id: "123" }
  });
});

test("Edge case - special characters in parameters", () => {
  const result = parsePattern("/users/:id");
  const matcher = compileMatcher(result.ast);

  const match = matcher("/users/abc-123_XYZ");
  expect(match?.params).toEqual({ id: "abc-123_XYZ" });
});

test("Edge case - unicode in paths", () => {
  const result = parsePattern("/users/:name");
  const matcher = compileMatcher(result.ast);

  const match = matcher("/users/josé");
  expect(match?.params).toEqual({ name: "josé" });
});

test("Edge case - very long path", () => {
  const longSegment = "a".repeat(1000);
  const result = parsePattern("/users/:id");
  const matcher = compileMatcher(result.ast);

  const match = matcher(`/users/${longSegment}`);
  expect(match?.params.id).toBe(longSegment);
});

test("Edge case - many parameters", () => {
  const result = parsePattern("/:a/:b/:c/:d/:e/:f/:g/:h/:i/:j");
  const matcher = compileMatcher(result.ast);

  const match = matcher("/1/2/3/4/5/6/7/8/9/10");
  expect(match?.params).toEqual({
    a: "1",
    b: "2",
    c: "3",
    d: "4",
    e: "5",
    f: "6",
    g: "7",
    h: "8",
    i: "9",
    j: "10"
  });
});

test("Edge case - optional parameter at end", () => {
  const result = parsePattern("/users/:id?");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/users")).toMatchObject({
    matched: true,
    params: {}
  });

  expect(matcher("/users/123")).toMatchObject({
    matched: true,
    params: { id: "123" }
  });

  expect(matcher("/users/123/extra")).toBeNull();
});

test("Edge case - wildcard with no segments", () => {
  const result = parsePattern("/files/*path");
  const matcher = compileMatcher(result.ast);

  // Wildcard requires at least one segment
  expect(matcher("/files")).toBeNull();
});

test("Edge case - empty parameter value", () => {
  const result = parsePattern("/users/:id/posts");
  const matcher = compileMatcher(result.ast);

  // Empty parameter value should not match
  expect(matcher("/users//posts")).toBeNull();
});

test("Edge case - case sensitivity", () => {
  const caseSensitive = parsePattern("/Users");
  const caseInsensitive = parsePattern("/Users", { caseInsensitive: true });

  const sensitiveMatcher = compileMatcher(caseSensitive.ast);
  const insensitiveMatcher = compileMatcher(caseInsensitive.ast);

  expect(sensitiveMatcher("/Users")).toMatchObject({ matched: true });
  expect(sensitiveMatcher("/users")).toBeNull();

  expect(insensitiveMatcher("/Users")).toMatchObject({ matched: true });
  expect(insensitiveMatcher("/users")).toMatchObject({ matched: true });
  expect(insensitiveMatcher("/USERS")).toMatchObject({ matched: true });
});

test("Edge case - adapter history overflow", () => {
  const adapter = createMemoryAdapter("/");

  // Push many entries
  for (let i = 0; i < 1000; i++) {
    adapter.push(`/page${i}`);
  }

  expect(adapter.getURL()).toBe("/page999");

  // Navigate back many times
  for (let i = 0; i < 500; i++) {
    adapter.back();
  }

  expect(adapter.getURL()).toBe("/page499");
});

test("Edge case - rapid navigation", () => {
  const adapter = createMemoryAdapter("/");
  const urls: string[] = [];

  adapter.listen((url) => urls.push(url));

  // Rapid navigation
  for (let i = 0; i < 100; i++) {
    adapter.push(`/page${i}`);
  }

  expect(urls.length).toBe(100);
  expect(adapter.getURL()).toBe("/page99");
});

test("Edge case - state management during navigation", () => {
  const state = new RouterState();

  // Rapid state changes
  for (let i = 0; i < 100; i++) {
    state.setRoute({
      matched: true,
      params: { id: String(i) },
      query: {}
    });
  }

  expect(state.current?.params.id).toBe("99");
  expect(state.previous?.params.id).toBe("98");
});

test("Edge case - circular navigation pattern", () => {
  const adapter = createMemoryAdapter("/");

  // Create circular pattern
  adapter.push("/a");
  adapter.push("/b");
  adapter.push("/c");
  adapter.push("/a"); // Back to start

  // Navigate through cycle
  adapter.back(); // c
  adapter.back(); // b
  adapter.back(); // a
  adapter.back(); // root

  expect(adapter.getURL()).toBe("/");

  adapter.forward(); // a
  adapter.forward(); // b
  adapter.forward(); // c
  adapter.forward(); // a (second occurrence)

  expect(adapter.getURL()).toBe("/a");
});

test("Edge case - query parameter edge cases", async () => {
  const queries = [
    "a=", // Empty value
    "=b", // Empty key
    "a", // No value
    "a&b&c", // Multiple no-value params
    "a=1&a=2&a=3", // Repeated keys
    "key%20with%20spaces=value%20with%20spaces", // Spaces
    "unicode=日本語", // Unicode
    "special=!@#$%^&*()" // Special chars
  ];

  const { parseQuery } = await import("../../src/patterns/matcher");

  for (const query of queries) {
    const result = parseQuery(query);
    expect(result).toBeDefined();
  }
});

test("Edge case - malformed patterns", () => {
  const malformed = [
    "/users/::id", // Double colon
    "/users/:", // Incomplete parameter
    "/users/*", // Just wildcard (valid but edge case)
    "///", // Only slashes
    "/users/:id//:post" // Double slash in middle
  ];

  for (const pattern of malformed) {
    const result = parsePattern(pattern);
    // Should not throw, but may have warnings or errors
    expect(result.ast).toBeDefined();
  }
});

test("Edge case - memory adapter with no initial URL", () => {
  const adapter = createMemoryAdapter();

  expect(adapter.getURL()).toBe("/");
  expect(adapter.isAvailable()).toBe(true);
});

test("Edge case - pattern with only optional parameters", () => {
  const result = parsePattern("/:a?/:b?/:c?");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/")).toMatchObject({
    matched: true,
    params: {}
  });

  expect(matcher("/1")).toMatchObject({
    matched: true,
    params: { a: "1" }
  });

  expect(matcher("/1/2")).toMatchObject({
    matched: true,
    params: { a: "1", b: "2" }
  });

  expect(matcher("/1/2/3")).toMatchObject({
    matched: true,
    params: { a: "1", b: "2", c: "3" }
  });
});

test("Edge case - maximum pattern depth", () => {
  const segments = Array.from({ length: 50 }, (_, i) => `:param${i}`);
  const pattern = "/" + segments.join("/");

  const result = parsePattern(pattern);
  const matcher = compileMatcher(result.ast);

  const pathSegments = Array.from({ length: 50 }, (_, i) => String(i));
  const path = "/" + pathSegments.join("/");

  const match = matcher(path);
  expect(match?.matched).toBe(true);
  expect(Object.keys(match?.params || {}).length).toBe(50);
});

test("Edge case - navigation listener cleanup", () => {
  const adapter = createMemoryAdapter("/");
  const calls: string[] = [];

  const unlisten1 = adapter.listen((url) => calls.push("listener1"));
  const unlisten2 = adapter.listen((url) => calls.push("listener2"));

  adapter.push("/page1");
  expect(calls.length).toBe(2);

  unlisten1();
  adapter.push("/page2");
  expect(calls.length).toBe(3); // Only listener2

  unlisten2();
  adapter.push("/page3");
  expect(calls.length).toBe(3); // No new calls
});
