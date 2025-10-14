/**
 * Advanced router utilities - Level 3 API
 * Full power and customization for complex applications
 *
 * @module v3/advanced
 * @category API Level 3
 */

import { GuardManager } from "../guards";
import { MiddlewarePipeline } from "../middleware";
import { compilePattern, matchPattern } from "../patterns";
import type { AdvancedRouteConfig, NavigationOptions, RouteMatch, RouterConfig } from "./types";

/**
 * Advanced router class with full feature set
 */
export class AdvancedRouter {
  private routes: AdvancedRouteConfig[] = [];
  private middleware = new MiddlewarePipeline();
  private guards = new GuardManager();
  private config: RouterConfig;
  private currentRoute = $state<RouteMatch | null>(null);
  private isNavigating = $state(false);

  constructor(config: RouterConfig = {}) {
    this.config = config;
    this.initializeEventListeners();
  }

  /**
   * Add routes to the router
   */
  addRoutes(routes: AdvancedRouteConfig[]): void {
    this.routes.push(...routes);
  }

  /**
   * Remove routes by pattern
   */
  removeRoutes(pattern: string): void {
    this.routes = this.routes.filter((route) => route.path !== pattern);
  }

  /**
   * Register global middleware
   */
  useMiddleware(middleware: any, options?: any): string {
    return this.middleware.use(middleware, options);
  }

  /**
   * Register global guard
   */
  useGuard(guard: any, options?: any): string {
    return this.guards.register(guard, options);
  }

  /**
   * Navigate with full options
   */
  async navigate(path: string, options: NavigationOptions = {}): Promise<void> {
    this.isNavigating = true;

    try {
      const match = this.findRoute(path);

      if (!match.matched) {
        throw new Error(`No route found for: ${path}`);
      }

      // Execute guards unless skipped
      if (!options.skipGuards) {
        const guardResult = await this.guards.execute({
          to: match as any,
          from: this.currentRoute as any,
          data: {},
          meta: {
            timestamp: Date.now(),
            trigger: "programmatic"
          }
        });

        if (!guardResult.allowed) {
          if (guardResult.redirect) {
            return this.navigate(guardResult.redirect, { replace: guardResult.replace ?? false });
          }
          throw new Error("Navigation blocked by guard");
        }
      }

      // Execute middleware unless skipped
      if (!options.skipMiddleware) {
        const context = {
          route: match as any,
          path,
          query: match.query,
          data: {},
          meta: {
            timestamp: Date.now()
          }
        };

        const result = await this.middleware.execute(context);
        if (!result.success) {
          throw result.error || new Error("Middleware execution failed");
        }
      }

      // Update browser history
      if (options.replace) {
        history.replaceState(options.state || null, "", path);
      } else {
        history.pushState(options.state || null, "", path);
      }

      this.currentRoute = match;
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Find route matching the given path
   */
  private findRoute(path: string): RouteMatch {
    const [pathname, search] = path.split("?");
    const query = search ? Object.fromEntries(new URLSearchParams(search)) : {};

    for (const route of this.routes) {
      if (route.matcher) {
        // Use custom matcher
        if (route.matcher(pathname || "/")) {
          return {
            matched: true,
            params: {},
            query,
            route
          };
        }
      } else if (route.path) {
        // Use pattern matching
        const pattern = route.compiledPattern || compilePattern(route.path);
        const match = matchPattern(pattern, pathname || "/");

        if (match.matched) {
          return {
            matched: true,
            params: match.params,
            query,
            route,
            remaining: match.remaining ?? ""
          };
        }
      }
    }

    return {
      matched: false,
      params: {},
      query
    };
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    window.addEventListener("popstate", () => {
      const path = location.pathname + location.search;
      this.navigate(path, { skipGuards: false, skipMiddleware: false });
    });
  }

  /**
   * Get current route
   */
  getCurrentRoute(): RouteMatch | null {
    return this.currentRoute;
  }

  /**
   * Check if currently navigating
   */
  isCurrentlyNavigating(): boolean {
    return this.isNavigating;
  }

  /**
   * Get router statistics
   */
  getStats() {
    return {
      routeCount: this.routes.length,
      middlewareInfo: this.middleware.getInfo(),
      guardInfo: this.guards.getInfo(),
      currentRoute: this.currentRoute
    };
  }
}

/**
 * Create advanced router instance
 */
export function createAdvancedRouter(config: RouterConfig = {}): AdvancedRouter {
  return new AdvancedRouter(config);
}

/**
 * Advanced preload utility
 */
export async function preloadRoute(route: AdvancedRouteConfig): Promise<void> {
  if (route.component && typeof route.component === "function") {
    try {
      await route.component();
    } catch (error) {
      console.warn("Failed to preload route:", error);
    }
  }
}
