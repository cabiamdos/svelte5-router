/**
 * @file
 *
 *   E2E tests for pattern matching functionality.
 *
 *   Tests all pattern types: static paths, parameters, optional parameters, wildcards, and
 *   complex nested patterns.
 *
 * @category E2E Testing
 */

import { test, expect } from "vitest";
import { parsePattern } from "../../src/patterns/parser";
import { compileMatcher, matchURL, parseQuery } from "../../src/patterns/matcher";

test("static path matching", () => {
  const result = parsePattern("/users");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/users")).toMatchObject({
    matched: true,
    params: {}
  });

  expect(matcher("/posts")).toBeNull();
  expect(matcher("/users/123")).toBeNull();
});

test("parameter extraction", () => {
  const result = parsePattern("/users/:id");
  const matcher = compileMatcher(result.ast);

  const match = matcher("/users/123");
  expect(match).toMatchObject({
    matched: true,
    params: { id: "123" }
  });

  expect(matcher("/users")).toBeNull();
});

test("multiple parameters", () => {
  const result = parsePattern("/users/:userId/posts/:postId");
  const matcher = compileMatcher(result.ast);

  const match = matcher("/users/42/posts/123");
  expect(match).toMatchObject({
    matched: true,
    params: {
      userId: "42",
      postId: "123"
    }
  });
});

test("optional parameters - with value", () => {
  const result = parsePattern("/users/:id?");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/users/123")).toMatchObject({
    matched: true,
    params: { id: "123" }
  });
});

test("optional parameters - without value", () => {
  const result = parsePattern("/users/:id?");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/users")).toMatchObject({
    matched: true,
    params: {}
  });
});

test("wildcard - single segment", () => {
  const result = parsePattern("/files/*");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/files/document.pdf")).toMatchObject({
    matched: true,
    params: {}
  });

  expect(matcher("/files")).toBeNull();
});

test("wildcard - named capture", () => {
  const result = parsePattern("/files/*path");
  const matcher = compileMatcher(result.ast);

  const match = matcher("/files/document.pdf");
  expect(match).toMatchObject({
    matched: true,
    params: { path: "document.pdf" }
  });
});

test("greedy wildcard", () => {
  const result = parsePattern("/files/**path");
  const matcher = compileMatcher(result.ast);

  const match = matcher("/files/docs/2024/report.pdf");
  expect(match).toMatchObject({
    matched: true,
    params: { path: "docs/2024/report.pdf" }
  });
});

test("case-insensitive matching", () => {
  const result = parsePattern("/Users", { caseInsensitive: true });
  const matcher = compileMatcher(result.ast);

  expect(matcher("/users")).toMatchObject({ matched: true });
  expect(matcher("/USERS")).toMatchObject({ matched: true });
  expect(matcher("/Users")).toMatchObject({ matched: true });
});

test("query string parsing", () => {
  const query = parseQuery("foo=bar&baz=qux&count=42");

  expect(query).toEqual({
    foo: "bar",
    baz: "qux",
    count: "42"
  });
});

test("query string - array values", () => {
  const query = parseQuery("tags=javascript&tags=typescript&tags=svelte");

  expect(query).toEqual({
    tags: ["javascript", "typescript", "svelte"]
  });
});

test("query string - URL decoding", () => {
  const query = parseQuery("search=hello%20world&name=John%20Doe");

  expect(query).toEqual({
    search: "hello world",
    name: "John Doe"
  });
});

test("full URL matching with query and hash", () => {
  const result = parsePattern("/users/:id");
  const match = matchURL(result.ast, "/users/123?tab=posts&sort=date#comments");

  expect(match).toMatchObject({
    matched: true,
    params: { id: "123" },
    query: { tab: "posts", sort: "date" },
    hash: "comments"
  });
});

test("complex nested pattern", () => {
  const result = parsePattern("/api/:version/users/:userId/posts/:postId/comments/:commentId");
  const matcher = compileMatcher(result.ast);

  const match = matcher("/api/v1/users/42/posts/123/comments/456");
  expect(match).toMatchObject({
    matched: true,
    params: {
      version: "v1",
      userId: "42",
      postId: "123",
      commentId: "456"
    }
  });
});

test("trailing slash normalization", () => {
  const result = parsePattern("/users");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/users")).toMatchObject({ matched: true });
  expect(matcher("/users/")).toMatchObject({ matched: true });
});

test("empty pattern matches root", () => {
  const result = parsePattern("");
  const matcher = compileMatcher(result.ast);

  expect(matcher("/")).toMatchObject({ matched: true });
  expect(matcher("")).toMatchObject({ matched: true });
});

test("duplicate parameter names detected", () => {
  const result = parsePattern("/users/:id/posts/:id");

  expect(result.errors).toContain('Duplicate parameter name: "id"');
});

test("invalid parameter names detected", () => {
  const result = parsePattern("/users/:123invalid");

  expect(result.errors.length).toBeGreaterThan(0);
});
