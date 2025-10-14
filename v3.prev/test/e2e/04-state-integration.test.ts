/**
 * @file
 *
 *   E2E tests for state management and full integration scenarios.
 *
 *   Tests router state, navigation flows, and complete routing scenarios.
 *
 * @category E2E Testing
 */

import { test, expect } from "vitest";
import { RouterState } from "../../src/state/router-state.svelte";
import { createMemoryAdapter } from "../../src/runtime";
import { parsePattern } from "../../src/patterns/parser";
import { compileMatcher } from "../../src/patterns/matcher";

test("RouterState - initial state", () => {
  const state = new RouterState();

  expect(state.current).toBeUndefined();
  expect(state.previous).toBeUndefined();
  expect(state.state).toBe("idle");
  expect(state.error).toBeNull();
});

test("RouterState - set route", () => {
  const state = new RouterState();

  const route = {
    matched: true,
    params: { id: "123" },
    query: { tab: "posts" }
  };

  state.setRoute(route);

  expect(state.current).toEqual(route);
  expect(state.state).toBe("idle");
  expect(state.error).toBeNull();
});

test("RouterState - previous route tracking", () => {
  const state = new RouterState();

  const route1 = {
    matched: true,
    params: { id: "1" },
    query: {}
  };

  const route2 = {
    matched: true,
    params: { id: "2" },
    query: {}
  };

  state.setRoute(route1);
  state.setRoute(route2);

  expect(state.current).toEqual(route2);
  expect(state.previous).toEqual(route1);
});

test("RouterState - error handling", () => {
  const state = new RouterState();

  const error = new Error("Navigation failed");
  state.setError(error);

  expect(state.error).toBe(error);
  expect(state.state).toBe("error");
});

test("RouterState - state transitions", () => {
  const state = new RouterState();

  state.setState("navigating");
  expect(state.state).toBe("navigating");

  state.setState("loading");
  expect(state.state).toBe("loading");

  state.setState("idle");
  expect(state.state).toBe("idle");
});

test("RouterState - reset", () => {
  const state = new RouterState();

  state.setState("error");
  state.setError(new Error("Test error"));

  state.reset();

  expect(state.state).toBe("idle");
  expect(state.error).toBeNull();
});

test("Integration - complete navigation flow", async () => {
  const adapter = createMemoryAdapter("/");
  const state = new RouterState();

  // Set up routes
  const routes = [
    { path: "/", pattern: parsePattern("/").ast },
    { path: "/users/:id", pattern: parsePattern("/users/:id").ast },
    { path: "/about", pattern: parsePattern("/about").ast }
  ];

  // Compile matchers
  const matchers = routes.map((r) => ({
    route: r,
    matcher: compileMatcher(r.pattern)
  }));

  // Navigate to /users/123
  adapter.push("/users/123");
  const url = adapter.getURL();

  // Find matching route
  for (const { route, matcher } of matchers) {
    const match = matcher(url);
    if (match) {
      state.setRoute({ ...match, route });
      break;
    }
  }

  expect(state.current?.params).toEqual({ id: "123" });

  // Navigate back
  adapter.back();
  const newUrl = adapter.getURL();

  for (const { route, matcher } of matchers) {
    const match = matcher(newUrl);
    if (match) {
      state.setRoute({ ...match, route });
      break;
    }
  }

  expect(state.current?.params).toEqual({});
  expect(state.previous?.params).toEqual({ id: "123" });
});

test("Integration - nested routing", () => {
  const parentPattern = parsePattern("/users/:userId").ast;
  const childPattern = parsePattern("/posts/:postId").ast;

  const parentMatcher = compileMatcher(parentPattern);
  const childMatcher = compileMatcher(childPattern);

  const fullPath = "/users/42/posts/123";

  // Match parent first
  const parentMatch = parentMatcher("/users/42");
  expect(parentMatch?.params).toEqual({ userId: "42" });

  // Then match child with remaining path
  const childMatch = childMatcher("/posts/123");
  expect(childMatch?.params).toEqual({ postId: "123" });

  // Combined params
  const combinedParams = {
    ...parentMatch?.params,
    ...childMatch?.params
  };

  expect(combinedParams).toEqual({
    userId: "42",
    postId: "123"
  });
});

test("Integration - query parameters throughout navigation", () => {
  const adapter = createMemoryAdapter("/");
  const pattern = parsePattern("/search").ast;
  const matcher = compileMatcher(pattern);

  // Navigate with query params
  adapter.push("/search?q=typescript&sort=date&page=2");

  const url = adapter.getURL();
  const match = matcher(url.split("?")[0]);

  expect(match?.matched).toBe(true);

  // Parse query from URL
  const queryString = url.split("?")[1];
  const query = new URLSearchParams(queryString);

  expect(query.get("q")).toBe("typescript");
  expect(query.get("sort")).toBe("date");
  expect(query.get("page")).toBe("2");
});

test("Integration - navigation history with state", () => {
  const adapter = createMemoryAdapter("/");

  const page1State = { page: 1, data: "test1" };
  const page2State = { page: 2, data: "test2" };

  adapter.push("/page1", page1State);
  expect(adapter.getState()).toEqual(page1State);

  adapter.push("/page2", page2State);
  expect(adapter.getState()).toEqual(page2State);

  adapter.back();
  expect(adapter.getState()).toEqual(page1State);

  adapter.forward();
  expect(adapter.getState()).toEqual(page2State);
});

test("Integration - error recovery flow", () => {
  const state = new RouterState();

  // Start navigation
  state.setState("navigating");

  // Error occurs
  const error = new Error("404 Not Found");
  state.setError(error);

  expect(state.state).toBe("error");
  expect(state.error).toBe(error);

  // Recover and navigate successfully
  const successRoute = {
    matched: true,
    params: {},
    query: {}
  };

  state.setRoute(successRoute);

  expect(state.state).toBe("idle");
  expect(state.error).toBeNull();
  expect(state.current).toEqual(successRoute);
});

test("Integration - complex multi-step navigation", () => {
  const adapter = createMemoryAdapter("/");
  const patterns = {
    home: parsePattern("/").ast,
    users: parsePattern("/users").ast,
    userDetail: parsePattern("/users/:id").ast,
    userPosts: parsePattern("/users/:userId/posts").ast,
    postDetail: parsePattern("/users/:userId/posts/:postId").ast
  };

  const matchers = Object.entries(patterns).map(([name, pattern]) => ({
    name,
    matcher: compileMatcher(pattern)
  }));

  function matchPath(path: string) {
    for (const { name, matcher } of matchers) {
      const match = matcher(path);
      if (match) {
        return { name, ...match };
      }
    }
    return null;
  }

  // User journey
  adapter.push("/");
  expect(matchPath(adapter.getURL())?.name).toBe("home");

  adapter.push("/users");
  expect(matchPath(adapter.getURL())?.name).toBe("users");

  adapter.push("/users/42");
  expect(matchPath(adapter.getURL())?.name).toBe("userDetail");
  expect(matchPath(adapter.getURL())?.params).toEqual({ id: "42" });

  adapter.push("/users/42/posts");
  expect(matchPath(adapter.getURL())?.name).toBe("userPosts");
  expect(matchPath(adapter.getURL())?.params).toEqual({ userId: "42" });

  adapter.push("/users/42/posts/123");
  expect(matchPath(adapter.getURL())?.name).toBe("postDetail");
  expect(matchPath(adapter.getURL())?.params).toEqual({ userId: "42", postId: "123" });

  // Navigate back through history
  adapter.back(); // Back to /users/42/posts
  expect(matchPath(adapter.getURL())?.name).toBe("userPosts");

  adapter.back(); // Back to /users/42
  expect(matchPath(adapter.getURL())?.name).toBe("userDetail");

  adapter.back(); // Back to /users
  expect(matchPath(adapter.getURL())?.name).toBe("users");

  adapter.back(); // Back to /
  expect(matchPath(adapter.getURL())?.name).toBe("home");
});

test("Integration - replace vs push behavior", () => {
  const adapter = createMemoryAdapter("/");

  adapter.push("/page1");
  adapter.push("/page2");
  adapter.replace("/page2-updated");

  // Current should be the replaced page
  expect(adapter.getURL()).toBe("/page2-updated");

  // Back should go to page1, not page2
  adapter.back();
  expect(adapter.getURL()).toBe("/page1");

  // Forward should go to replaced page
  adapter.forward();
  expect(adapter.getURL()).toBe("/page2-updated");
});
