/**
 * @file
 *
 *   E2E tests for middleware and guards.
 *
 *   Tests middleware pipeline execution, guard evaluation, and integration.
 *
 * @category E2E Testing
 */

import { test, expect } from "vitest";
import { executePipeline } from "../../src/middleware/pipeline";
import { executeGuards } from "../../src/guards/manager";
import { createAuthGuard } from "../../src/guards/builtin";
import type {
  MiddlewareContext,
  GuardContext,
  MiddlewareFunction,
  GuardFunction
} from "../../src/types";

// Helper to create test contexts
function createMiddlewareContext(): MiddlewareContext {
  return {
    route: {
      matched: true,
      params: {},
      query: {}
    },
    to: "/test",
    from: "/",
    direction: "push",
    state: null,
    runtime: "spa",
    abort: () => {},
    data: {}
  };
}

function createGuardContext(): GuardContext {
  let redirectUrl: string | null = null;
  return {
    route: {
      matched: true,
      params: {},
      query: {}
    },
    to: "/test",
    from: "/",
    direction: "push",
    state: null,
    runtime: "spa",
    redirect: (url: string) => {
      redirectUrl = url;
    }
  };
}

test("middleware - single middleware execution", async () => {
  const calls: string[] = [];

  const middleware: MiddlewareFunction = async (context, next) => {
    calls.push("before");
    await next();
    calls.push("after");
  };

  const context = createMiddlewareContext();
  const success = await executePipeline([middleware], context);

  expect(success).toBe(true);
  expect(calls).toEqual(["before", "after"]);
});

test("middleware - multiple middleware in order", async () => {
  const calls: string[] = [];

  const middleware1: MiddlewareFunction = async (context, next) => {
    calls.push("m1-before");
    await next();
    calls.push("m1-after");
  };

  const middleware2: MiddlewareFunction = async (context, next) => {
    calls.push("m2-before");
    await next();
    calls.push("m2-after");
  };

  const middleware3: MiddlewareFunction = async (context, next) => {
    calls.push("m3-before");
    await next();
    calls.push("m3-after");
  };

  const context = createMiddlewareContext();
  await executePipeline([middleware1, middleware2, middleware3], context);

  expect(calls).toEqual([
    "m1-before",
    "m2-before",
    "m3-before",
    "m3-after",
    "m2-after",
    "m1-after"
  ]);
});

test("middleware - context modification", async () => {
  const middleware: MiddlewareFunction = async (context, next) => {
    context.data.timestamp = Date.now();
    context.data.user = "john";
    await next();
  };

  const context = createMiddlewareContext();
  await executePipeline([middleware], context);

  expect(context.data.timestamp).toBeDefined();
  expect(context.data.user).toBe("john");
});

test("middleware - early abort", async () => {
  const calls: string[] = [];

  const middleware1: MiddlewareFunction = async (context, next) => {
    calls.push("m1");
    // Don't call next - abort pipeline
  };

  const middleware2: MiddlewareFunction = async (context, next) => {
    calls.push("m2");
    await next();
  };

  const context = createMiddlewareContext();
  await executePipeline([middleware1, middleware2], context);

  expect(calls).toEqual(["m1"]); // m2 never called
});

test("middleware - error handling", async () => {
  const middleware: MiddlewareFunction = async (context, next) => {
    throw new Error("Middleware error");
  };

  const context = createMiddlewareContext();
  const success = await executePipeline([middleware], context);

  expect(success).toBe(false);
});

test("middleware - async operations", async () => {
  const results: string[] = [];

  const middleware: MiddlewareFunction = async (context, next) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    results.push("async-done");
    await next();
  };

  const context = createMiddlewareContext();
  await executePipeline([middleware], context);

  expect(results).toEqual(["async-done"]);
});

test("guards - single guard passes", async () => {
  const guard: GuardFunction = async () => true;

  const context = createGuardContext();
  const result = await executeGuards([guard], context);

  expect(result).toBe(true);
});

test("guards - single guard blocks", async () => {
  const guard: GuardFunction = async () => false;

  const context = createGuardContext();
  const result = await executeGuards([guard], context);

  expect(result).toBe(false);
});

test("guards - multiple guards all pass", async () => {
  const guard1: GuardFunction = async () => true;
  const guard2: GuardFunction = async () => true;
  const guard3: GuardFunction = async () => true;

  const context = createGuardContext();
  const result = await executeGuards([guard1, guard2, guard3], context);

  expect(result).toBe(true);
});

test("guards - first guard blocks", async () => {
  const calls: string[] = [];

  const guard1: GuardFunction = async () => {
    calls.push("guard1");
    return false;
  };

  const guard2: GuardFunction = async () => {
    calls.push("guard2");
    return true;
  };

  const context = createGuardContext();
  const result = await executeGuards([guard1, guard2], context);

  expect(result).toBe(false);
  expect(calls).toEqual(["guard1"]); // guard2 not called
});

test("guards - middle guard blocks", async () => {
  const calls: string[] = [];

  const guard1: GuardFunction = async () => {
    calls.push("guard1");
    return true;
  };

  const guard2: GuardFunction = async () => {
    calls.push("guard2");
    return false;
  };

  const guard3: GuardFunction = async () => {
    calls.push("guard3");
    return true;
  };

  const context = createGuardContext();
  const result = await executeGuards([guard1, guard2, guard3], context);

  expect(result).toBe(false);
  expect(calls).toEqual(["guard1", "guard2"]); // guard3 not called
});

test("guards - auth guard with authentication", async () => {
  const isAuthenticated = () => true;
  const guard = createAuthGuard(isAuthenticated);

  const context = createGuardContext();
  const result = await guard(context);

  expect(result).toBe(true);
});

test("guards - auth guard without authentication", async () => {
  const isAuthenticated = () => false;
  const guard = createAuthGuard(isAuthenticated);

  const context = createGuardContext();
  const result = await guard(context);

  expect(result).toBe(false);
});

test("guards - async guard", async () => {
  const guard: GuardFunction = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return true;
  };

  const context = createGuardContext();
  const result = await executeGuards([guard], context);

  expect(result).toBe(true);
});

test("guards - error handling", async () => {
  const guard: GuardFunction = async () => {
    throw new Error("Guard error");
  };

  const context = createGuardContext();
  const result = await executeGuards([guard], context);

  expect(result).toBe(false); // Errors deny access
});

test("integration - middleware and guards together", async () => {
  const calls: string[] = [];

  const guard: GuardFunction = async () => {
    calls.push("guard");
    return true;
  };

  const middleware: MiddlewareFunction = async (context, next) => {
    calls.push("middleware-before");
    await next();
    calls.push("middleware-after");
  };

  // In real usage, guards run before middleware
  const guardContext = createGuardContext();
  const guardPassed = await executeGuards([guard], guardContext);

  if (guardPassed) {
    const middlewareContext = createMiddlewareContext();
    await executePipeline([middleware], middlewareContext);
  }

  expect(calls).toEqual(["guard", "middleware-before", "middleware-after"]);
});
