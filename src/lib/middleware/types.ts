/**
 * Type definitions for middleware pipeline system
 *
 * @module middleware/types
 * @category Core
 */

import type { RouteResult } from '../route.svelte';

/**
 * Middleware execution context
 */
export interface MiddlewareContext {
  /** The current route result being processed */
  route: RouteResult;
  /** The original path that initiated the navigation */
  path: string;
  /** Query parameters from the URL */
  query: Record<string, string>;
  /** Custom data that can be passed between middleware */
  data: Record<string, any>;
  /** Request-specific metadata */
  meta: {
    timestamp: number;
    userAgent?: string;
    referer?: string;
  };
}

/**
 * Middleware function signature
 */
export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<void>
) => Promise<void> | void;

/**
 * Middleware configuration options
 */
export interface MiddlewareOptions {
  /** Optional name for debugging */
  name?: string;
  /** Priority order (higher numbers run first) */
  priority?: number;
  /** Whether this middleware should run only once per route */
  once?: boolean;
  /** Conditions under which this middleware should run */
  conditions?: {
    paths?: string[];
    methods?: string[];
    userAgent?: string[];
  };
}

/**
 * Registered middleware with metadata
 */
export interface RegisteredMiddleware {
  fn: MiddlewareFunction;
  options: MiddlewareOptions;
  id: string;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  success: boolean;
  error?: Error;
  context: MiddlewareContext;
  executedMiddleware: string[];
  duration: number;
}