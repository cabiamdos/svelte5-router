/**
 * @file
 *
 *   Middleware pipeline execution engine.
 *
 *   This module implements the middleware execution pipeline that runs middleware functions
 *   in sequence during navigation. Each middleware can modify context, perform side
 *   effects, or abort navigation.
 *
 * @category Middleware
 */

import type { MiddlewareContext, MiddlewareFunction } from "../types";

/**
 * Execute middleware pipeline.
 *
 * Runs middleware functions in order with proper error handling and abort support. Each
 * middleware must call `next()` to continue the pipeline.
 *
 * @param middleware Array of middleware functions to execute.
 * @param context The middleware execution context.
 *
 * @returns Whether the pipeline completed successfully (true) or was aborted (false).
 *
 * @example
 *
 * ```ts
 * const success = await executePipeline([
 *   loggingMiddleware,
 *   authMiddleware
 * ], context);
 * ```
 *
 * @category Middleware
 */
export async function executePipeline(
  middleware: MiddlewareFunction[],
  context: MiddlewareContext
): Promise<boolean> {
  let index = 0;
  let aborted = false;

  const next = async (): Promise<void> => {
    if (aborted || index >= middleware.length) {
      return;
    }

    const fn = middleware[index++];

    if (!fn) {
      return;
    }

    try {
      await fn(context, next);
    } catch (error) {
      aborted = true;
      throw error;
    }
  };

  try {
    await next();
    return !aborted;
  } catch (error) {
    console.error("[Middleware Pipeline] Error:", error);
    return false;
  }
}

/**
 * Logging middleware.
 *
 * Logs navigation events with timing information.
 *
 * @category Middleware
 */
export const loggingMiddleware: MiddlewareFunction = async (context, next) => {
  const start = performance.now();
  console.log("[Router] Navigating to:", context.to);

  await next();

  const duration = performance.now() - start;
  console.log("[Router] Navigation complete:", duration.toFixed(2), "ms");
};

/**
 * Timing middleware.
 *
 * Tracks navigation performance and stores timing in context.
 *
 * @category Middleware
 */
export const timingMiddleware: MiddlewareFunction = async (context, next) => {
  const start = performance.now();

  await next();

  context.data.navigationTime = performance.now() - start;
};
