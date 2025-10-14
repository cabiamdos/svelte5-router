/**
 * @file
 *
 *   Pattern matching unit tests.
 *
 *   Comprehensive tests for the AST-based pattern matching system. These tests validate
 *   parsing, compilation, and matching behavior across all pattern types.
 *
 * @category Testing
 */

import { test, expect } from "vitest";
import { parsePattern } from "../../src/patterns/parser";
import { compileMatcher, matchURL, parseQuery } from "../../src/patterns/matcher";

// Parser tests
test("parses static paths", () => {
  const result = parsePattern("/users");

  expect(result.ast.segments).toEqual([{ type: "static", value: "users" }]);
  expect(result.errors).toEqual([]);
});

test("parses parameter paths", () => {
  const result = parsePattern("/users/:id");

  expect(result.ast.segments).toEqual([
    { type: "static", value: "users" },
    { type: "parameter", name: "id", optional: false }
  ]);
  expect(result.errors).toEqual([]);
});

test("parses optional parameters", () => {
  const result = parsePattern("/users/:id?");

  expect(result.ast.segments).toEqual([
    { type: "static", value: "users" },
    { type: "parameter", name: "id", optional: true }
  ]);
  expect(result.errors).toEqual([]);
});

test("parses wildcard paths", () => {
  const result = parsePattern("/files/*");

  expect(result.ast.segments).toEqual([
    { type: "static", value: "files" },
    { type: "wildcard", greedy: false }
  ]);
  expect(result.errors).toEqual([]);
});

test("parses greedy wildcard paths", () => {
  const result = parsePattern("/files/**");

  expect(result.ast.segments).toEqual([
    { type: "static", value: "files" },
    { type: "wildcard", greedy: true }
  ]);
  expect(result.errors).toEqual([]);
});

test("parses named wildcards", () => {
  const result = parsePattern("/files/*path");

  expect(result.ast.segments).toEqual([
    { type: "static", value: "files" },
    { type: "wildcard", greedy: false, name: "path" }
  ]);
  expect(result.errors).toEqual([]);
});

test("parses complex patterns", () => {
  const result = parsePattern("/users/:id/posts/:postId");

  expect(result.ast.segments).toEqual([
    { type: "static", value: "users" },
    { type: "parameter", name: "id", optional: false },
    { type: "static", value: "posts" },
    { type: "parameter", name: "postId", optional: false }
  ]);
  expect(result.errors).toEqual([]);
});

test("detects duplicate parameter names", () => {
  const result = parsePattern("/users/:id/posts/:id");

  expect(result.errors).toContain('Duplicate parameter name: "id"');
});

test("handles empty patterns", () => {
  const result = parsePattern("");

  expect(result.ast.segments).toEqual([]);
  expect(result.warnings.length).toBeGreaterThan(0);
});

test("handles root path", () => {
  const result = parsePattern("/");

  expect(result.ast.segments).toEqual([]);
  expect(result.errors).toEqual([]);
});

// Matcher tests
test("matches static paths", () => {
  const ast = parsePattern("/users").ast;
  const matcher = compileMatcher(ast);

  expect(matcher("/users")).toMatchObject({
    matched: true,
    params: {}
  });

  expect(matcher("/posts")).toBeNull();
});

test("matches parameter paths", () => {
  const ast = parsePattern("/users/:id").ast;
  const matcher = compileMatcher(ast);

  const match = matcher("/users/123");
  expect(match).toMatchObject({
    matched: true,
    params: { id: "123" }
  });

  expect(matcher("/users")).toBeNull();
  expect(matcher("/users/123/extra")).toBeNull();
});

test("matches optional parameters", () => {
  const ast = parsePattern("/users/:id?").ast;
  const matcher = compileMatcher(ast);

  expect(matcher("/users")).toMatchObject({
    matched: true,
    params: {}
  });

  expect(matcher("/users/123")).toMatchObject({
    matched: true,
    params: { id: "123" }
  });
});

test("matches wildcard paths", () => {
  const ast = parsePattern("/files/*").ast;
  const matcher = compileMatcher(ast);

  expect(matcher("/files/doc.txt")).toMatchObject({
    matched: true,
    params: {}
  });

  expect(matcher("/files")).toBeNull();
});

test("matches greedy wildcard paths", () => {
  const ast = parsePattern("/files/**path").ast;
  const matcher = compileMatcher(ast);

  const match = matcher("/files/docs/2024/report.pdf");
  expect(match).toMatchObject({
    matched: true,
    params: { path: "docs/2024/report.pdf" }
  });
});

test("matches complex patterns", () => {
  const ast = parsePattern("/users/:userId/posts/:postId").ast;
  const matcher = compileMatcher(ast);

  const match = matcher("/users/42/posts/123");
  expect(match).toMatchObject({
    matched: true,
    params: { userId: "42", postId: "123" }
  });
});

// Query parsing tests
test("parses query strings", () => {
  const query = parseQuery("foo=bar&baz=qux");

  expect(query).toEqual({
    foo: "bar",
    baz: "qux"
  });
});

test("parses array query parameters", () => {
  const query = parseQuery("tags=a&tags=b&tags=c");

  expect(query).toEqual({
    tags: ["a", "b", "c"]
  });
});

test("decodes URL-encoded query values", () => {
  const query = parseQuery("search=hello%20world");

  expect(query).toEqual({
    search: "hello world"
  });
});

test("handles empty query strings", () => {
  const query = parseQuery("");

  expect(query).toEqual({});
});

// Full URL matching tests
test("matches full URLs with query and hash", () => {
  const ast = parsePattern("/users/:id").ast;
  const match = matchURL(ast, "/users/123?tab=posts#comments");

  expect(match).toMatchObject({
    matched: true,
    params: { id: "123" },
    query: { tab: "posts" },
    hash: "comments"
  });
});
