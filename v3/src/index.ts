/**
 * @file
 *
 *   Svelte5 Router v3 - Main entry point.
 *
 *   This module provides the main exports for the v3 router with progressive disclosure.
 *   Choose the API level that matches your needs:
 *
 *   - **Simple API (Level 1)**: Basic routing without middleware or guards
 *   - **Enhanced API (Level 2)**: Adds middleware, guards, and lifecycle hooks
 *   - **Advanced API (Level 3)**: Full control with SSR/SSG support and custom matchers
 *
 * @example
 *
 * ```ts
 * // Simple API
 * import { SimpleRouter } from '@mateothegreat/svelte5-router/v3/simple';
 *
 * // Enhanced API
 * import { Router } from '@mateothegreat/svelte5-router/v3/enhanced';
 *
 * // Advanced API
 * import { AdvancedRouter } from '@mateothegreat/svelte5-router/v3/advanced';
 * ```
 *
 * @category Core
 */

// Re-export all API levels
export * from "./api/simple";
export * from "./api/enhanced";
export * from "./api/advanced";

// Re-export core types
export type {
  SimpleRouteConfig,
  EnhancedRouteConfig,
  AdvancedRouteConfig,
  RouterConfig,
  RouteMatch,
  RouteParams,
  QueryParams,
  NavigationOptions,
  RuntimeMode,
  NavigationDirection,
  NavigationState,
  MiddlewareFunction,
  MiddlewareContext,
  GuardFunction,
  GuardContext,
  HookFunction,
  HookContext,
  RuntimeAdapter,
  HistoryState
} from "./types";

// Re-export utilities
export { parsePattern, compileMatcher, matchURL, parseQuery } from "./patterns";
export { executePipeline, loggingMiddleware, timingMiddleware } from "./middleware";
export { executeGuards, createAuthGuard } from "./guards";
export { RouterState } from "./state";
export {
  createSPAAdapter,
  createSSRAdapter,
  createSSGAdapter,
  createMemoryAdapter
} from "./runtime";
