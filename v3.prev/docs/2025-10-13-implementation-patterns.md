# V3 Implementation Patterns & Guidelines

**Date**: October 13, 2025 **Version**: v3.0.0 **Status**: Implementation Guide

## Overview

This document provides implementation patterns and guidelines for building the
v3 router. It explains how to implement each layer following the architectural
principles while maintaining code quality, testability, and performance.

## Svelte 5 Runes Patterns

### State Management with $state

All reactive state must use Svelte 5 runes. Here are the patterns:

```typescript
// ✅ CORRECT: Using $state for reactive variables
class RouterState {
  current = $state<Route | undefined>(undefined);
  navigating = $state<boolean>(false);
  error = $state<Error | null>(null);
}

// ❌ INCORRECT: Using legacy reactive syntax
class RouterState {
  let current: Route | undefined;
  let navigating = false;
  $: isReady = !navigating;  // FORBIDDEN
}
```

### Derived State with $derived

Computed values must use $derived:

```typescript
// ✅ CORRECT: Using $derived for computed values
class RouterState {
  current = $state<Route | undefined>(undefined);

  params = $derived(() => {
    return this.current?.params ?? {};
  });

  query = $derived(() => {
    return this.current?.query ?? {};
  });

  path = $derived(() => {
    return this.current?.path ?? "/";
  });
}

// ❌ INCORRECT: Manual getters or computed properties
class RouterState {
  current = $state<Route | undefined>(undefined);

  get params() {
    // FORBIDDEN - use $derived
    return this.current?.params ?? {};
  }
}
```

### Side Effects with $effect

Lifecycle operations must use $effect:

```typescript
// ✅ CORRECT: Using $effect for side effects
class NavigationManager {
  navigating = $state<boolean>(false);

  constructor() {
    $effect(() => {
      if (this.navigating) {
        document.body.classList.add('navigating');
      } else {
        document.body.classList.remove('navigating');
      }
    });
  }
}

// ❌ INCORRECT: Using lifecycle hooks
class NavigationManager {
  navigating = $state<boolean>(false);

  onMount(() => {  // FORBIDDEN - use $effect
    // initialization
  });
}
```

## AST-Based Pattern Matching

### Parser Implementation

The pattern parser converts strings to AST without using regular expressions:

```typescript
/**
 * Parse a route pattern into an AST.
 *
 * This function implements a single-pass parser that tokenizes and constructs the AST in
 * O(n) time where n is the pattern length.
 */
export function parsePattern(
  pattern: string,
  options?: PatternOptions
): ParseResult {
  const segments: SegmentNode[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Remove leading/trailing slashes
  const normalized = pattern.replace(/^\/+|\/+$/g, "");

  // Split into segments by '/'
  const parts = normalized.split("/");

  for (const part of parts) {
    if (part === "") {
      continue;
    }

    // Check for parameter: starts with ':'
    if (part.startsWith(":")) {
      const name = part.slice(1);
      const optional = name.endsWith("?");
      const paramName = optional ? name.slice(0, -1) : name;

      segments.push({
        type: "parameter",
        name: paramName,
        optional
      });
      continue;
    }

    // Check for wildcard: '*' or '**'
    if (part === "*" || part === "**") {
      segments.push({
        type: "wildcard",
        greedy: part === "**"
      });
      continue;
    }

    // Otherwise, it's a static segment
    segments.push({
      type: "static",
      value: part,
      caseInsensitive: options?.caseInsensitive
    });
  }

  return {
    ast: {
      type: "root",
      segments,
      original: pattern
    },
    warnings,
    errors
  };
}
```

### Matcher Implementation

The matcher compiles AST into efficient matching functions:

```typescript
/**
 * Compile AST into a matcher function.
 *
 * Returns a function that matches URLs against the pattern in O(m) time where m is the
 * number of URL segments.
 */
export function compileMatcher(
  ast: RootNode
): (path: string) => RouteMatch | null {
  return (path: string): RouteMatch | null => {
    const segments = path.split("/").filter(Boolean);
    const params: RouteParams = {};
    let segmentIndex = 0;

    for (const node of ast.segments) {
      // Handle static segments
      if (node.type === "static") {
        if (segmentIndex >= segments.length) {
          return null; // Not enough segments
        }

        const urlSegment = segments[segmentIndex];
        const matches = node.caseInsensitive
          ? urlSegment.toLowerCase() === node.value.toLowerCase()
          : urlSegment === node.value;

        if (!matches) {
          return null; // Static segment doesn't match
        }

        segmentIndex++;
        continue;
      }

      // Handle parameter segments
      if (node.type === "parameter") {
        if (segmentIndex >= segments.length) {
          if (node.optional) {
            continue; // Optional parameter can be omitted
          }
          return null; // Required parameter missing
        }

        const value = segments[segmentIndex];

        // Validate if validator is provided
        if (node.validate && !node.validate(value)) {
          return null; // Validation failed
        }

        // Coerce type if specified
        let coercedValue: ParamValue = value;
        if (node.coerce === "number") {
          coercedValue = Number(value);
          if (isNaN(coercedValue as number)) {
            return null; // Coercion failed
          }
        } else if (node.coerce === "boolean") {
          coercedValue = value === "true";
        }

        params[node.name] = coercedValue;
        segmentIndex++;
        continue;
      }

      // Handle wildcard segments
      if (node.type === "wildcard") {
        if (node.greedy) {
          // Greedy wildcard matches all remaining segments
          if (node.name) {
            params[node.name] = segments.slice(segmentIndex).join("/");
          }
          segmentIndex = segments.length;
        } else {
          // Non-greedy wildcard matches single segment
          if (segmentIndex >= segments.length) {
            return null;
          }
          if (node.name) {
            params[node.name] = segments[segmentIndex];
          }
          segmentIndex++;
        }
        continue;
      }
    }

    // Check if all segments were matched
    if (segmentIndex !== segments.length) {
      return null; // Extra segments not matched
    }

    return {
      matched: true,
      params,
      query: {} // Query parsing happens separately
    };
  };
}
```

## Runtime Adapter Pattern

### Adapter Interface

All adapters implement the same interface:

```typescript
export interface RuntimeAdapter {
  mode: RuntimeMode;
  getURL: () => string;
  push: (url: string, state?: HistoryState) => void;
  replace: (url: string, state?: HistoryState) => void;
  back: () => void;
  forward: () => void;
  go: (delta: number) => void;
  listen: (callback: (url: string) => void) => () => void;
  getState: () => HistoryState;
  isAvailable: () => boolean;
}
```

### SPA Adapter Implementation

Browser-based adapter using History API:

```typescript
/**
 * SPA runtime adapter using browser History API.
 *
 * Provides client-side routing with proper history management and state persistence. This
 * is the default adapter for client-side applications.
 */
export function createSPAAdapter(): RuntimeAdapter {
  let listeners: Array<(url: string) => void> = [];

  const notifyListeners = () => {
    const url = window.location.href;
    listeners.forEach((listener) => listener(url));
  };

  // Listen for browser navigation
  window.addEventListener("popstate", notifyListeners);

  return {
    mode: "spa",

    getURL: () => window.location.href,

    push: (url: string, state?: HistoryState) => {
      window.history.pushState(state, "", url);
      notifyListeners();
    },

    replace: (url: string, state?: HistoryState) => {
      window.history.replaceState(state, "", url);
      notifyListeners();
    },

    back: () => {
      window.history.back();
    },

    forward: () => {
      window.history.forward();
    },

    go: (delta: number) => {
      window.history.go(delta);
    },

    listen: (callback: (url: string) => void) => {
      listeners.push(callback);
      return () => {
        listeners = listeners.filter((l) => l !== callback);
      };
    },

    getState: () => {
      return window.history.state as HistoryState;
    },

    isAvailable: () => {
      return typeof window !== "undefined" && "history" in window;
    }
  };
}
```

### SSR Adapter Implementation

Server-side adapter for SSR environments:

```typescript
/**
 * SSR runtime adapter for server-side rendering.
 *
 * Provides synchronous routing without browser APIs. URL and state are provided during
 * initialization and don't change during rendering.
 */
export function createSSRAdapter(
  initialURL: string,
  initialState?: HistoryState
): RuntimeAdapter {
  let currentURL = initialURL;
  let currentState = initialState || null;

  return {
    mode: "ssr",

    getURL: () => currentURL,

    push: () => {
      // No-op in SSR - navigation happens via HTTP redirects
    },

    replace: () => {
      // No-op in SSR
    },

    back: () => {
      // No-op in SSR
    },

    forward: () => {
      // No-op in SSR
    },

    go: () => {
      // No-op in SSR
    },

    listen: () => {
      // No-op in SSR - no client-side navigation
      return () => {};
    },

    getState: () => currentState,

    isAvailable: () => {
      return typeof window === "undefined";
    }
  };
}
```

## Middleware Pipeline Pattern

### Pipeline Execution

Middleware executes in sequence with proper error handling:

```typescript
/**
 * Execute middleware pipeline.
 *
 * Runs middleware functions in order, allowing each to modify context or abort
 * navigation. Supports both sync and async middleware.
 */
export async function executePipeline(
  middleware: MiddlewareFunction[],
  context: MiddlewareContext
): Promise<boolean> {
  let index = 0;
  let aborted = false;

  const next = async (): Promise<void> => {
    if (aborted) {
      return; // Navigation was aborted
    }

    if (index >= middleware.length) {
      return; // All middleware executed
    }

    const fn = middleware[index++];

    try {
      await fn(context, next);
    } catch (error) {
      // Middleware error aborts navigation
      aborted = true;
      throw error;
    }
  };

  // Start pipeline execution
  await next();

  return !aborted;
}
```

### Built-in Middleware Examples

```typescript
/**
 * Logging middleware.
 *
 * Logs all navigation events with timing information. Useful for debugging and monitoring
 * navigation performance.
 */
export const loggingMiddleware: MiddlewareFunction = async (context, next) => {
  const start = performance.now();

  console.log("[Router] Navigating to:", context.to);

  await next();

  const duration = performance.now() - start;
  console.log("[Router] Navigation complete:", duration.toFixed(2), "ms");
};

/**
 * Authentication middleware.
 *
 * Checks if user is authenticated before allowing navigation. Redirects to login page if
 * not authenticated.
 */
export const authMiddleware: MiddlewareFunction = async (context, next) => {
  const requiresAuth = context.route.route?.meta?.requiresAuth;

  if (requiresAuth && !isAuthenticated()) {
    context.abort(`/login?redirect=${encodeURIComponent(context.to)}`);
    return;
  }

  await next();
};
```

## State Management Pattern

### Router State Class

Centralized state management with runes:

```typescript
/**
 * Router state manager.
 *
 * Manages all reactive state for the router including current route, navigation state,
 * and history. Uses Svelte 5 runes for optimal reactivity.
 */
export class RouterState {
  /**
   * Current matched route.
   */
  current = $state<RouteMatch | undefined>(undefined);

  /**
   * Previous route (for transitions).
   */
  previous = $state<RouteMatch | undefined>(undefined);

  /**
   * Navigation state.
   */
  state = $state<NavigationState>("idle");

  /**
   * Navigation error if any.
   */
  error = $state<Error | null>(null);

  /**
   * Current route parameters (derived).
   */
  params = $derived(() => {
    return this.current?.params ?? {};
  });

  /**
   * Current query parameters (derived).
   */
  query = $derived(() => {
    return this.current?.query ?? {};
  });

  /**
   * Current path (derived).
   */
  path = $derived(() => {
    if (!this.current?.route) {
      return "/";
    }
    // Reconstruct path from params
    return reconstructPath(this.current.route.path || "/", this.current.params);
  });

  /**
   * Whether currently navigating (derived).
   */
  navigating = $derived(() => {
    return this.state === "navigating" || this.state === "loading";
  });

  /**
   * Update current route.
   */
  setRoute(route: RouteMatch): void {
    this.previous = this.current;
    this.current = route;
    this.state = "idle";
    this.error = null;
  }

  /**
   * Set navigation state.
   */
  setState(state: NavigationState): void {
    this.state = state;
  }

  /**
   * Set navigation error.
   */
  setError(error: Error): void {
    this.error = error;
    this.state = "error";
  }

  /**
   * Clear navigation state.
   */
  reset(): void {
    this.state = "idle";
    this.error = null;
  }
}
```

## Component Integration Pattern

### Simple Router Component

The Simple API provides a drop-in router component:

```svelte
<!--
  Simple Router Component - Level 1 API

  Provides basic routing with minimal configuration. Ideal for simple SPAs
  without complex middleware or guard requirements.
-->
<script lang="ts">
  import type { SimpleRouteConfig } from "../types";
  import { RouterState } from "../state/router-state.svelte";
  import { parsePattern, compileMatcher } from "../patterns";
  import { createSPAAdapter } from "../runtime/spa-adapter";

  interface Props {
    routes: SimpleRouteConfig[];
    basePath?: string;
  }

  let { routes, basePath = "" }: Props = $props();

  // Create router state
  const state = new RouterState();

  // Create runtime adapter
  const adapter = createSPAAdapter();

  // Compile route patterns
  const matchers = routes.map((route) => {
    const pattern = route.path || "/";
    const result = parsePattern(pattern);
    return {
      route,
      matcher: compileMatcher(result.ast)
    };
  });

  // Handle navigation
  function handleNavigation(url: string): void {
    const path = new URL(url).pathname;

    // Try each matcher
    for (const { route, matcher } of matchers) {
      const match = matcher(path);
      if (match) {
        state.setRoute({ ...match, route });
        return;
      }
    }

    // No match found
    state.setError(new Error("Route not found"));
  }

  // Listen for navigation
  adapter.listen(handleNavigation);

  // Initial navigation
  handleNavigation(adapter.getURL());
</script>

{#if state.current}
  {@const { route } = state.current}

  {#if route.component}
    <svelte:component this={route.component} {...state.current.params} />
  {:else if route.snippet}
    {@render route.snippet(state.current.params)}
  {/if}
{:else if state.error}
  <div class="error">
    <h1>Error</h1>
    <p>{state.error.message}</p>
  </div>
{/if}
```

## Testing Patterns

### Unit Test Pattern

Every module must have comprehensive unit tests:

```typescript
import { test, expect } from "vitest";
import { parsePattern } from "./parser";

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
```

### Integration Test Pattern

Full routing scenarios in SvelteKit environment:

```typescript
import { test, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import SimpleRouter from "./simple.svelte";

test("renders home route", async () => {
  const routes = [
    { path: "/", component: Home },
    { path: "/about", component: About }
  ];

  render(SimpleRouter, { routes });

  expect(screen.getByText("Welcome Home")).toBeInTheDocument();
});

test("navigates between routes", async () => {
  const routes = [
    { path: "/", component: Home },
    { path: "/about", component: About }
  ];

  render(SimpleRouter, { routes });

  // Click navigation link
  const aboutLink = screen.getByText("About");
  await aboutLink.click();

  expect(screen.getByText("About Us")).toBeInTheDocument();
});
```

## Performance Optimization Patterns

### Matcher Compilation Caching

Cache compiled matchers to avoid recompilation:

```typescript
const matcherCache = new Map<string, (path: string) => RouteMatch | null>();

export function getOrCompileMatcher(
  pattern: string
): (path: string) => RouteMatch | null {
  // Check cache first
  if (matcherCache.has(pattern)) {
    return matcherCache.get(pattern)!;
  }

  // Parse and compile
  const result = parsePattern(pattern);
  const matcher = compileMatcher(result.ast);

  // Store in cache
  matcherCache.set(pattern, matcher);

  return matcher;
}
```

### Route Preloading

Preload components on hover for instant navigation:

```typescript
export function preloadRoute(route: AdvancedRouteConfig): void {
  if (route.lazy?.preload === false) {
    return; // Preloading disabled
  }

  if (typeof route.component === "function") {
    // Start loading the component
    route.component().catch(() => {
      // Ignore preload errors
    });
  }
}
```

## Summary

These implementation patterns provide:

1. **Type Safety**: Full TypeScript strict mode compliance
2. **Performance**: O(n) pattern matching with caching
3. **Testability**: Clear patterns for unit and integration tests
4. **Maintainability**: Consistent patterns across all layers
5. **Extensibility**: Clear extension points for custom behavior

Follow these patterns when implementing the v3 router to ensure consistency,
quality, and alignment with the architectural vision.
