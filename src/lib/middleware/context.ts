/**
 * Middleware context management
 *
 * @module middleware/context
 * @category Core
 */

import type { RouteResult } from "../route.svelte";
import type { MiddlewareContext } from "./types";

/**
 * Create a new middleware context
 */
export function createContext(route: RouteResult, path: string, query: Record<string, string> = {}): MiddlewareContext {
  return {
    route,
    path,
    query,
    data: {},
    meta: {
      timestamp: Date.now(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      referer: typeof document !== "undefined" ? document.referrer : ""
    }
  };
}

/**
 * Clone a middleware context
 */
export function cloneContext(context: MiddlewareContext): MiddlewareContext {
  return {
    route: context.route,
    path: context.path,
    query: { ...context.query },
    data: { ...context.data },
    meta: { ...context.meta }
  };
}

/**
 * Merge additional data into context
 */
export function extendContext(context: MiddlewareContext, data: Record<string, any>): MiddlewareContext {
  return {
    ...context,
    data: { ...context.data, ...data }
  };
}
