/**
 * Tests for v3 router implementation
 */
import { describe, expect, test } from "vitest";
import { GuardManager } from "../guards";
import { MiddlewarePipeline } from "../middleware";
import { matchPattern, parsePattern } from "../patterns";
import type { RouteResult } from "../route.svelte";

describe("v3 router implementation", () => {
  describe("AST Pattern Matching", () => {
    test("should parse simple pattern", () => {
      const pattern = parsePattern("/users/:id");
      expect(pattern.paramNames).toEqual(["id"]);
      expect(pattern.hasWildcard).toBe(false);
      expect(pattern.segments).toHaveLength(2);
    });

    test("should match pattern correctly", () => {
      const pattern = parsePattern("/users/:id");
      const match = matchPattern(pattern, "/users/123");
      expect(match.matched).toBe(true);
      expect(match.params.id).toBe("123");
    });

    test("should handle wildcard patterns", () => {
      const pattern = parsePattern("/api/**");
      expect(pattern.hasWildcard).toBe(true);

      const match = matchPattern(pattern, "/api/v1/users");
      expect(match.matched).toBe(true);
    });
  });

  describe("Middleware Pipeline", () => {
    test("should execute middleware in order", async () => {
      const pipeline = new MiddlewarePipeline();
      const execution: string[] = [];

      pipeline.use(async (ctx, next) => {
        execution.push("first");
        await next();
      });

      pipeline.use(async (ctx, next) => {
        execution.push("second");
        await next();
      });

      const context = {
        route: {} as RouteResult,
        path: "/test",
        query: {},
        data: {},
        meta: { timestamp: Date.now() }
      };

      await pipeline.execute(context);
      expect(execution).toEqual(["first", "second"]);
    });
  });

  describe("Guard Manager", () => {
    test("should execute guards and allow navigation", async () => {
      const manager = new GuardManager();

      manager.register(() => Promise.resolve(true), { global: true });

      const context = {
        to: {} as RouteResult,
        from: {} as RouteResult,
        data: {},
        meta: { timestamp: Date.now(), trigger: "user" as const }
      };

      const result = await manager.execute(context);
      expect(result.allowed).toBe(true);
    });

    test("should block navigation when guard returns false", async () => {
      const manager = new GuardManager();

      manager.register(() => Promise.resolve(false), { global: true });

      const context = {
        to: {} as RouteResult,
        from: {} as RouteResult,
        data: {},
        meta: { timestamp: Date.now(), trigger: "user" as const }
      };

      const result = await manager.execute(context);
      expect(result.allowed).toBe(false);
    });
  });
});
