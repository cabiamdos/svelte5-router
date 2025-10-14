/**
 * Type definitions for route guards system
 *
 * @module guards/types
 * @category Core
 */

import type { RouteResult } from "../route.svelte";

/**
 * Guard execution context
 */
export interface GuardContext {
  /** The route being navigated to */
  to: RouteResult;
  /** The route being navigated from (if any) */
  from?: RouteResult;
  /** Additional context data */
  data: Record<string, any>;
  /** Navigation metadata */
  meta: {
    timestamp: number;
    trigger: "programmatic" | "user" | "browser";
  };
}

/**
 * Guard execution result
 */
export type GuardResult =
  | boolean // Simple allow/deny
  | string // Redirect to path
  | { redirect: string } // Redirect with metadata
  | { redirect: string; replace?: boolean } // Redirect with options
  | Promise<GuardResult>; // Async guard

/**
 * Route guard function signature
 */
export type GuardFunction = (context: GuardContext) => Promise<GuardResult>;

/**
 * Guard configuration options
 */
export interface GuardOptions {
  /** Optional name for debugging */
  name?: string;
  /** Priority order (higher numbers run first) */
  priority?: number;
  /** Whether guard applies to specific routes */
  routes?: string[];
  /** Whether guard applies globally */
  global?: boolean;
  /** Timeout for async guards (ms) */
  timeout?: number;
}

/**
 * Registered guard with metadata
 */
export interface RegisteredGuard {
  fn: GuardFunction;
  options: GuardOptions;
  id: string;
}

/**
 * Guard execution result with metadata
 */
export interface GuardExecutionResult {
  allowed: boolean;
  redirect?: string;
  replace?: boolean;
  error?: Error;
  executedGuards: string[];
  duration: number;
}
