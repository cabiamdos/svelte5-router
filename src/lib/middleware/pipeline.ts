/**
 * Middleware pipeline implementation
 *
 * @module middleware/pipeline
 * @category Core
 */

import type {
  MiddlewareContext,
  MiddlewareFunction,
  MiddlewareOptions,
  PipelineResult,
  RegisteredMiddleware
} from "./types";

/**
 * Middleware pipeline manager
 */
export class MiddlewarePipeline {
  private middleware: RegisteredMiddleware[] = [];
  private idCounter = 0;

  /**
   * Register a middleware function
   */
  use(fn: MiddlewareFunction, options: MiddlewareOptions = {}): string {
    const id = `middleware_${++this.idCounter}`;
    const registered: RegisteredMiddleware = {
      fn,
      options: {
        priority: 0,
        once: false,
        ...options
      },
      id
    };

    this.middleware.push(registered);
    this.sortMiddleware();

    return id;
  }

  /**
   * Remove middleware by ID
   */
  remove(id: string): boolean {
    const index = this.middleware.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.middleware.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Execute the middleware pipeline
   */
  async execute(context: MiddlewareContext): Promise<PipelineResult> {
    const startTime = Date.now();
    const executedMiddleware: string[] = [];
    const applicableMiddleware = this.getApplicableMiddleware(context);

    let currentIndex = 0;

    const next = async (): Promise<void> => {
      if (currentIndex >= applicableMiddleware.length) {
        return;
      }

      const middleware = applicableMiddleware[currentIndex++];
      if (!middleware) return;

      executedMiddleware.push(middleware.id);

      try {
        await middleware.fn(context, next);
      } catch (error) {
        throw error;
      }
    };

    try {
      await next();

      return {
        success: true,
        context,
        executedMiddleware,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        context,
        executedMiddleware,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Get middleware applicable to the current context
   */
  private getApplicableMiddleware(context: MiddlewareContext): RegisteredMiddleware[] {
    return this.middleware.filter((middleware) => {
      const { conditions } = middleware.options;

      if (!conditions) return true;

      // Check path conditions
      if (
        conditions.paths &&
        !conditions.paths.some((path) => context.path.startsWith(path) || context.path.match(new RegExp(path)))
      ) {
        return false;
      }

      // Check user agent conditions
      if (conditions.userAgent && context.meta.userAgent) {
        const userAgentMatches = conditions.userAgent.some((ua) => context.meta.userAgent?.includes(ua));
        if (!userAgentMatches) return false;
      }

      return true;
    });
  }

  /**
   * Sort middleware by priority (higher priority first)
   */
  private sortMiddleware(): void {
    this.middleware.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));
  }

  /**
   * Clear all middleware
   */
  clear(): void {
    this.middleware = [];
  }

  /**
   * Get information about registered middleware
   */
  getInfo(): Array<{ id: string; name?: string | undefined; priority: number }> {
    return this.middleware.map((m) => ({
      id: m.id,
      name: m.options.name,
      priority: m.options.priority || 0
    }));
  }
}
