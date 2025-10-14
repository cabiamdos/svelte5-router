/**
 * @file
 *
 *   E2E tests for runtime adapters.
 *
 *   Tests all runtime adapters: SPA, SSR, SSG, and Memory.
 *
 * @category E2E Testing
 */

import { test, expect, beforeEach, afterEach } from "vitest";
import {
  createSPAAdapter,
  createSSRAdapter,
  createSSGAdapter,
  createMemoryAdapter
} from "../../src/runtime";

// Mock window for SPA adapter tests
const mockWindow = {
  location: {
    href: "http://localhost/",
    pathname: "/"
  },
  history: {
    pushState: () => {},
    replaceState: () => {},
    back: () => {},
    forward: () => {},
    go: () => {},
    state: null
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};

test("Memory adapter - push navigation", () => {
  const adapter = createMemoryAdapter("/");

  adapter.push("/users/123");
  expect(adapter.getURL()).toBe("/users/123");

  adapter.push("/about");
  expect(adapter.getURL()).toBe("/about");
});

test("Memory adapter - replace navigation", () => {
  const adapter = createMemoryAdapter("/");

  adapter.push("/users/123");
  adapter.replace("/users/456");

  expect(adapter.getURL()).toBe("/users/456");

  adapter.back();
  expect(adapter.getURL()).toBe("/");
});

test("Memory adapter - back navigation", () => {
  const adapter = createMemoryAdapter("/");

  adapter.push("/page1");
  adapter.push("/page2");
  adapter.push("/page3");

  expect(adapter.getURL()).toBe("/page3");

  adapter.back();
  expect(adapter.getURL()).toBe("/page2");

  adapter.back();
  expect(adapter.getURL()).toBe("/page1");

  adapter.back();
  expect(adapter.getURL()).toBe("/");
});

test("Memory adapter - forward navigation", () => {
  const adapter = createMemoryAdapter("/");

  adapter.push("/page1");
  adapter.push("/page2");
  adapter.back();

  expect(adapter.getURL()).toBe("/page1");

  adapter.forward();
  expect(adapter.getURL()).toBe("/page2");
});

test("Memory adapter - go with delta", () => {
  const adapter = createMemoryAdapter("/");

  adapter.push("/page1");
  adapter.push("/page2");
  adapter.push("/page3");

  adapter.go(-2);
  expect(adapter.getURL()).toBe("/page1");

  adapter.go(2);
  expect(adapter.getURL()).toBe("/page3");
});

test("Memory adapter - state management", () => {
  const adapter = createMemoryAdapter("/");

  const state = { user: "john", id: 123 };
  adapter.push("/profile", state);

  expect(adapter.getState()).toEqual(state);
});

test("Memory adapter - listeners", () => {
  const adapter = createMemoryAdapter("/");
  const urls: string[] = [];

  const unlisten = adapter.listen((url) => {
    urls.push(url);
  });

  adapter.push("/page1");
  adapter.push("/page2");
  adapter.back();

  expect(urls).toEqual(["/page1", "/page2", "/page1"]);

  unlisten();

  adapter.push("/page3");
  expect(urls).toEqual(["/page1", "/page2", "/page1"]); // No change after unlisten
});

test("Memory adapter - history boundaries", () => {
  const adapter = createMemoryAdapter("/");

  adapter.push("/page1");
  adapter.back();

  // Should be at start of history
  adapter.back(); // Should do nothing
  expect(adapter.getURL()).toBe("/");

  adapter.push("/page1");
  adapter.push("/page2");

  // Should be at end of history
  adapter.forward(); // Should do nothing
  expect(adapter.getURL()).toBe("/page2");
});

test("SSR adapter - fixed URL", () => {
  const adapter = createSSRAdapter("/users/123");

  expect(adapter.getURL()).toBe("/users/123");
  expect(adapter.mode).toBe("ssr");
});

test("SSR adapter - with state", () => {
  const state = { user: "john" };
  const adapter = createSSRAdapter("/profile", state);

  expect(adapter.getState()).toEqual(state);
});

test("SSR adapter - navigation is no-op", () => {
  const adapter = createSSRAdapter("/initial");

  adapter.push("/new");
  expect(adapter.getURL()).toBe("/initial"); // URL doesn't change

  adapter.replace("/other");
  expect(adapter.getURL()).toBe("/initial"); // URL doesn't change
});

test("SSR adapter - availability check", () => {
  const adapter = createSSRAdapter("/");

  // Should be available when window is undefined
  expect(adapter.isAvailable()).toBe(true);
});

test("SSG adapter - fixed URL", () => {
  const adapter = createSSGAdapter("/blog/post-1");

  expect(adapter.getURL()).toBe("/blog/post-1");
  expect(adapter.mode).toBe("ssg");
});

test("SSG adapter - navigation is no-op", () => {
  const adapter = createSSGAdapter("/initial");

  adapter.push("/new");
  expect(adapter.getURL()).toBe("/initial");

  adapter.back();
  expect(adapter.getURL()).toBe("/initial");
});

test("Memory adapter - complex navigation scenario", () => {
  const adapter = createMemoryAdapter("/");

  // Simulate user navigation
  adapter.push("/home");
  adapter.push("/products");
  adapter.push("/products/123");
  adapter.back(); // Back to /products
  adapter.push("/products/456"); // Navigate to different product
  adapter.back(); // Back to /products
  adapter.back(); // Back to /home
  adapter.forward(); // Forward to /products
  adapter.push("/cart"); // Navigate to cart

  expect(adapter.getURL()).toBe("/cart");

  adapter.back();
  expect(adapter.getURL()).toBe("/products");

  adapter.back();
  expect(adapter.getURL()).toBe("/home");
});

test("Memory adapter - replace in middle of history", () => {
  const adapter = createMemoryAdapter("/");

  adapter.push("/page1");
  adapter.push("/page2");
  adapter.push("/page3");
  adapter.back();
  adapter.back();

  // Currently at /page1
  expect(adapter.getURL()).toBe("/page1");

  // Replace current entry
  adapter.replace("/page1-updated");
  expect(adapter.getURL()).toBe("/page1-updated");

  // Forward should still work to next entry
  adapter.forward();
  expect(adapter.getURL()).toBe("/page2");
});
