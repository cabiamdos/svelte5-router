/**
 * @file
 *
 *   Core type definitions for the v3 router architecture.
 *
 *   This module defines all fundamental types used throughout the router system, providing
 *   a single source of truth for type contracts across all layers. These types support
 *   the progressive disclosure pattern by defining interfaces for Simple, Enhanced, and
 *   Advanced API layers while maintaining strict type safety.
 *
 *   ## Core Concepts
 *
 *   1. **Runtime Types:** Define the contract between the router and different runtime
 *        environments (SPA, SSR, SSG).
 *   2. **Route Types:** Define route configurations at different complexity levels.
 *   3. **Navigation Types:** Define how navigation operations work across all modes.
 *   4. **Context Types:** Define the execution context for middleware, guards, and hooks.
 *
 *   ## Design Philosophy
 *
 *   All types follow these principles:
 *
 *   - **No `any` types:** Complete type safety with strict mode compliance.
 *   - **Composable:** Types build upon each other through extension.
 *   - **Generic:** Support for type parameters where appropriate.
 *   - **Documented:** Every type includes comprehensive documentation.
 *
 * @example
 *
 * ```ts
 * // Simple route configuration
 * const simpleRoute: SimpleRouteConfig = {
 *   path: '/home',
 *   component: HomePage
 * };
 *
 * // Enhanced route with middleware
 * const enhancedRoute: EnhancedRouteConfig = {
 *   path: '/dashboard',
 *   component: Dashboard,
 *   middleware: [authMiddleware]
 * };
 *
 * // Advanced route with full customization
 * const advancedRoute: AdvancedRouteConfig = {
 *   path: '/users/:id',
 *   component: UserProfile,
 *   middleware: [authMiddleware, loggingMiddleware],
 *   guards: [adminGuard],
 *   meta: { requiresAuth: true },
 *   animation: { enter: 'fade', exit: 'slide' }
 * };
 * ```
 *
 * @category Core
 */

import type { Component, Snippet } from "svelte";

/**
 * Runtime environment mode.
 *
 * Determines how the router operates and which features are available. Each mode has
 * different characteristics and use cases.
 *
 * @category Runtime
 */
export type RuntimeMode = "spa" | "ssr" | "ssg" | "memory";

/**
 * Navigation direction for history management.
 *
 * Tracks whether navigation is moving forward (push), backward (pop), or replacing the
 * current entry. This information is useful for animations and lifecycle hooks.
 *
 * @category Navigation
 */
export type NavigationDirection = "push" | "pop" | "replace";

/**
 * Navigation state during routing operations.
 *
 * Tracks the current phase of navigation to enable proper lifecycle management and
 * prevent race conditions during async operations.
 *
 * @category Navigation
 */
export type NavigationState = "idle" | "navigating" | "loading" | "error";

/**
 * Parameter value types supported by the router.
 *
 * Route parameters and query strings can contain these primitive types, which are
 * automatically parsed and validated during route matching.
 *
 * @category Parameters
 */
export type ParamValue = string | number | boolean;

/**
 * Record of route parameters extracted from the URL.
 *
 * Parameters are extracted during pattern matching and made available to components,
 * middleware, and guards. All values are validated and typed.
 *
 * @category Parameters
 */
export type RouteParams = Record<string, ParamValue>;

/**
 * Record of query string parameters from the URL.
 *
 * Query parameters follow the same type system as route parameters but are optional and
 * can have multiple values.
 *
 * @category Parameters
 */
export type QueryParams = Record<string, ParamValue | ParamValue[]>;

/**
 * Route metadata for custom properties.
 *
 * Metadata provides a type-safe way to attach arbitrary data to routes, which can be used
 * by middleware, guards, or application code. Common uses include permissions, layout
 * information, or analytics tags.
 *
 * @category Configuration
 */
export type RouteMeta = Record<string, unknown>;

/**
 * History state data attached to navigation entries.
 *
 * State data is preserved across navigation and page reloads (when using browser
 * storage). This enables complex navigation patterns like form wizards or multi-step
 * processes.
 *
 * @category Navigation
 */
export type HistoryState = Record<string, unknown> | null;

/**
 * Base route configuration shared by all API layers.
 *
 * Every route configuration includes these fundamental properties, which define the path
 * pattern and what should be rendered when the route matches.
 *
 * @category Configuration
 */
export interface BaseRouteConfig {
  /**
   * Route path pattern.
   *
   * Supports static paths, named parameters, and wildcards. Patterns are parsed into an
   * AST for efficient matching without regular expressions.
   *
   * @example
   *
   * ```ts
   * '/users'              // Static path
   * '/users/:id'          // Named parameter
   * '/users/:id/posts/*'  // With wildcard
   * ```
   */
  path?: string;

  /**
   * Component to render when route matches.
   *
   * Can be a synchronous component reference or an async function that returns a
   * component. Async functions enable code splitting and lazy loading.
   *
   * @example
   *
   * ```ts
   * component: HomePage
   * component: () => import('./Dashboard.svelte')
   * ```
   */
  component?: Component<any> | (() => Promise<Component<any> | { default: Component<any> }>);

  /**
   * Svelte 5 snippet to render when route matches.
   *
   * Snippets provide a lightweight alternative to full components for simple content.
   * They're ideal for small, inline route handlers.
   *
   * @example
   *
   * ```ts
   * snippet: () => {
   *   // Snippet implementation
   * }
   * ```
   */
  snippet?: Snippet;

  /**
   * Route name for identification and programmatic navigation.
   *
   * Named routes enable type-safe navigation without hardcoding paths. Names must be
   * unique within a router instance.
   *
   * @example
   *
   * ```ts
   * name: 'user-profile'
   * ```
   */
  name?: string;

  /**
   * Nested child routes.
   *
   * Child routes inherit the parent's path as a prefix and can define their own
   * middleware, guards, and configuration. Enables hierarchical routing patterns.
   *
   * @example
   *
   * ```ts
   * children: [
   *   { path: 'posts', component: UserPosts },
   *   { path: 'settings', component: UserSettings }
   * ]
   * ```
   */
  children?: BaseRouteConfig[];
}

/**
 * Simple route configuration for basic use cases.
 *
 * The simplest form of route configuration, ideal for straightforward SPAs without
 * complex middleware or guard requirements. Provides just the essentials to get routing
 * working quickly.
 *
 * @example
 *
 * ```ts
 * const routes: SimpleRouteConfig[] = [
 *   { path: '/', component: Home },
 *   { path: '/about', component: About },
 *   { path: '/contact', component: Contact }
 * ];
 * ```
 *
 * @category API Level 1
 */
export interface SimpleRouteConfig extends BaseRouteConfig {
  /**
   * Optional props to pass to the component.
   *
   * These props are static and don't change based on route parameters. For dynamic props,
   * use the Enhanced or Advanced API.
   */
  props?: Record<string, unknown>;
}

/**
 * Enhanced route configuration with middleware and guards.
 *
 * Extends the simple configuration with support for middleware, guards, and lifecycle
 * hooks. Suitable for applications that need authentication, logging, or other
 * cross-cutting concerns.
 *
 * @example
 *
 * ```ts
 * const route: EnhancedRouteConfig = {
 *   path: '/dashboard',
 *   component: Dashboard,
 *   middleware: [authMiddleware],
 *   guards: [loginGuard],
 *   meta: { requiresAuth: true }
 * };
 * ```
 *
 * @category API Level 2
 */
export interface EnhancedRouteConfig extends SimpleRouteConfig {
  /**
   * Middleware functions to execute before rendering.
   *
   * Middleware executes in order and can modify the navigation context, perform side
   * effects, or cancel navigation. Each middleware must call `next()` to continue the
   * pipeline.
   */
  middleware?: MiddlewareFunction[];

  /**
   * Guard functions to control route access.
   *
   * Guards execute before middleware and determine if navigation should proceed.
   * Returning `false` or redirecting cancels the current navigation.
   */
  guards?: GuardFunction[];

  /**
   * Route metadata for custom use.
   *
   * Metadata is accessible in middleware, guards, and components. Use it to store
   * route-specific configuration like permissions, page titles, or analytics data.
   */
  meta?: RouteMeta;

  /**
   * Lifecycle hooks for this specific route.
   *
   * Hooks run at specific points in the navigation lifecycle and enable custom logic like
   * data fetching, analytics, or cleanup.
   */
  hooks?: {
    /**
     * Runs before entering the route.
     *
     * Use for data fetching, permission checks, or preparing the route. Returning `false`
     * cancels navigation.
     */
    beforeEnter?: HookFunction | HookFunction[];

    /**
     * Runs after entering the route.
     *
     * Use for analytics tracking, scroll restoration, or post-navigation setup.
     */
    afterEnter?: HookFunction | HookFunction[];

    /**
     * Runs before leaving the route.
     *
     * Use for unsaved changes warnings, cleanup, or data persistence. Returning `false`
     * cancels navigation.
     */
    beforeLeave?: HookFunction | HookFunction[];

    /**
     * Runs after leaving the route.
     *
     * Use for cleanup operations that should run after the new route renders.
     */
    afterLeave?: HookFunction | HookFunction[];
  };
}

/**
 * Advanced route configuration with full customization.
 *
 * Provides complete control over route behavior with support for custom matchers,
 * animations, lazy loading configuration, and SSR/SSG-specific options.
 *
 * @example
 *
 * ```ts
 * const route: AdvancedRouteConfig = {
 *   path: '/users/:id',
 *   component: () => import('./UserProfile.svelte'),
 *   middleware: [authMiddleware, loggingMiddleware],
 *   guards: [adminGuard],
 *   matcher: customMatcher,
 *   lazy: { preload: true, timeout: 5000 },
 *   animation: { enter: 'fade-in', exit: 'fade-out', duration: 300 },
 *   ssr: { prerender: true, hydrate: true }
 * };
 * ```
 *
 * @category API Level 3
 */
export interface AdvancedRouteConfig extends EnhancedRouteConfig {
  /**
   * Custom matcher function to override pattern-based matching.
   *
   * Provides complete control over route matching logic. Useful for complex matching
   * scenarios that can't be expressed with patterns.
   *
   * @param path The URL path to match against.
   *
   * @returns Match result with extracted parameters, or null if no match.
   */
  matcher?: (path: string) => RouteMatch | null;

  /**
   * Lazy loading configuration for async components.
   *
   * Controls how and when components are loaded, with support for preloading, timeouts,
   * and retry logic.
   */
  lazy?: {
    /**
     * Whether to preload the component on hover.
     *
     * Preloading improves perceived performance by loading components before navigation
     * begins.
     */
    preload?: boolean;

    /**
     * Maximum time to wait for component load (in milliseconds).
     *
     * If the component doesn't load within this time, navigation fails with a timeout
     * error.
     */
    timeout?: number;

    /**
     * Number of retry attempts for failed loads.
     *
     * Useful for handling network issues or temporary server problems.
     */
    retry?: number;
  };

  /**
   * Animation configuration for route transitions.
   *
   * Defines enter and exit animations with timing control. Animations can be CSS classes,
   * View Transitions API, or custom animation functions.
   */
  animation?: {
    /**
     * Animation to play when entering the route.
     */
    enter?: string;

    /**
     * Animation to play when exiting the route.
     */
    exit?: string;

    /**
     * Animation duration in milliseconds.
     */
    duration?: number;
  };

  /**
   * SSR/SSG-specific configuration.
   *
   * Controls server-side rendering and static generation behavior for this route.
   */
  ssr?: {
    /**
     * Whether to prerender this route during SSG builds.
     */
    prerender?: boolean;

    /**
     * Whether to hydrate this route on the client.
     *
     * Setting to `false` creates a fully static route without client-side interactivity.
     */
    hydrate?: boolean;

    /**
     * Cache configuration for SSR responses.
     */
    cache?: {
      /**
       * Cache duration in seconds.
       */
      maxAge?: number;

      /**
       * Whether to serve stale content while revalidating.
       */
      staleWhileRevalidate?: boolean;
    };
  };
}

/**
 * Route match result from pattern matching.
 *
 * Contains information about whether a route matched, extracted parameters, and any
 * remaining unmatched path segments (for nested routing).
 *
 * @category Pattern Matching
 */
export interface RouteMatch {
  /**
   * Whether the route pattern matched the URL.
   */
  matched: boolean;

  /**
   * Extracted route parameters.
   *
   * Parameters are parsed from the URL based on the route pattern and validated according
   * to their type constraints.
   */
  params: RouteParams;

  /**
   * Query string parameters.
   *
   * Parsed from the URL query string with support for array values and type coercion.
   */
  query: QueryParams;

  /**
   * Matched route configuration.
   *
   * The full route configuration that matched this URL, useful for accessing route
   * metadata or other configuration.
   */
  route?: AdvancedRouteConfig;

  /**
   * Remaining unmatched path.
   *
   * For nested routing, this contains the path segments that weren't matched by this
   * route, allowing child routers to handle them.
   */
  remaining?: string;

  /**
   * Hash fragment from the URL.
   *
   * The portion after the # character, useful for scroll-to-anchor behavior.
   */
  hash?: string;
}

/**
 * Middleware execution context.
 *
 * Provides middleware functions with access to navigation state, route information, and
 * utilities for controlling the navigation flow.
 *
 * @category Middleware
 */
export interface MiddlewareContext {
  /**
   * Matched route information.
   */
  route: RouteMatch;

  /**
   * URL being navigated to.
   */
  to: string;

  /**
   * URL being navigated from (if applicable).
   */
  from?: string;

  /**
   * Navigation direction.
   */
  direction: NavigationDirection;

  /**
   * History state data.
   */
  state: HistoryState;

  /**
   * Runtime mode.
   */
  runtime: RuntimeMode;

  /**
   * Abort navigation and optionally redirect.
   *
   * @param redirect Optional URL to redirect to instead.
   */
  abort: (redirect?: string) => void;

  /**
   * Shared context data between middleware.
   *
   * Middleware can store data here to pass information to subsequent middleware in the
   * pipeline.
   */
  data: Record<string, unknown>;
}

/**
 * Middleware function type.
 *
 * Middleware executes in sequence during navigation and can modify context, perform side
 * effects, or cancel navigation. Must call `next()` to continue.
 *
 * @param context The middleware execution context.
 * @param next Function to call to proceed to the next middleware.
 *
 * @category Middleware
 */
export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<void>
) => Promise<void> | void;

/**
 * Guard execution context.
 *
 * Provides guard functions with route information and utilities for controlling access to
 * routes.
 *
 * @category Guards
 */
export interface GuardContext {
  /**
   * Matched route information.
   */
  route: RouteMatch;

  /**
   * URL being navigated to.
   */
  to: string;

  /**
   * URL being navigated from (if applicable).
   */
  from?: string;

  /**
   * Navigation direction.
   */
  direction: NavigationDirection;

  /**
   * History state data.
   */
  state: HistoryState;

  /**
   * Runtime mode.
   */
  runtime: RuntimeMode;

  /**
   * Redirect to a different route.
   *
   * @param url URL to redirect to.
   */
  redirect: (url: string) => void;
}

/**
 * Guard function type.
 *
 * Guards control access to routes by returning true (allow) or false (deny). They can
 * also redirect to a different route using the context.
 *
 * @param context The guard execution context.
 *
 * @returns Whether to allow navigation to the route.
 *
 * @category Guards
 */
export type GuardFunction = (context: GuardContext) => boolean | Promise<boolean>;

/**
 * Hook execution context.
 *
 * Provides hook functions with route information and navigation state.
 *
 * @category Hooks
 */
export interface HookContext {
  /**
   * Matched route information.
   */
  route: RouteMatch;

  /**
   * URL being navigated to.
   */
  to: string;

  /**
   * URL being navigated from (if applicable).
   */
  from?: string;

  /**
   * Navigation direction.
   */
  direction: NavigationDirection;

  /**
   * History state data.
   */
  state: HistoryState;

  /**
   * Runtime mode.
   */
  runtime: RuntimeMode;
}

/**
 * Hook function type.
 *
 * Hooks run at specific points in the navigation lifecycle and can perform side effects
 * or cancel navigation by returning false.
 *
 * @param context The hook execution context.
 *
 * @returns Whether to continue with navigation.
 *
 * @category Hooks
 */
export type HookFunction = (
  context: HookContext
) => boolean | Promise<boolean> | void | Promise<void>;

/**
 * Router configuration options.
 *
 * Configures router behavior including base path, history mode, middleware, guards, and
 * runtime options.
 *
 * @category Configuration
 */
export interface RouterConfig {
  /**
   * Base path prefix for all routes.
   *
   * Useful for mounting the router at a sub-path like `/app` or for micro-frontend
   * scenarios.
   *
   * @example
   *
   * ```ts
   * basePath: '/app'
   * ```
   */
  basePath?: string;

  /**
   * Router instance ID for identification.
   *
   * Useful when running multiple router instances on the same page. If not provided, a
   * random ID is generated.
   */
  id?: string;

  /**
   * Global middleware to run for all routes.
   *
   * Global middleware executes before route-specific middleware and is useful for
   * cross-cutting concerns like authentication or logging.
   */
  middleware?: MiddlewareFunction[];

  /**
   * Global guards to check for all routes.
   *
   * Global guards execute before route-specific guards and can enforce application-wide
   * access control.
   */
  guards?: GuardFunction[];

  /**
   * Global lifecycle hooks.
   *
   * Hooks run for all navigation events and are useful for analytics, logging, or global
   * state updates.
   */
  hooks?: {
    beforeEnter?: HookFunction | HookFunction[];
    afterEnter?: HookFunction | HookFunction[];
    beforeLeave?: HookFunction | HookFunction[];
    afterLeave?: HookFunction | HookFunction[];
  };

  /**
   * History mode configuration.
   *
   * Controls whether to use browser History API, hash-based routing, or in-memory history
   * for testing.
   */
  history?: {
    /**
     * History mode type.
     */
    mode: "browser" | "hash" | "memory";

    /**
     * Base path for history operations.
     *
     * Typically matches the basePath but can be different for advanced scenarios.
     */
    base?: string;
  };

  /**
   * Runtime mode.
   *
   * Determines which features are available and how the router operates. Auto-detected by
   * default but can be explicitly set for testing or edge cases.
   */
  runtime?: RuntimeMode;

  /**
   * Hash routing mode (legacy).
   *
   * Whether to use hash-based routing (#/path). Prefer the history.mode option instead.
   *
   * @deprecated Use history.mode = 'hash' instead.
   */
  hash?: boolean;
}

/**
 * Navigation options for programmatic navigation.
 *
 * Controls how navigation is performed when using the `goto()`, `replace()`, or other
 * navigation functions.
 *
 * @category Navigation
 */
export interface NavigationOptions {
  /**
   * Replace current history entry instead of pushing.
   *
   * Useful for redirects or updating the URL without creating a new history entry.
   */
  replace?: boolean;

  /**
   * State data to attach to the history entry.
   *
   * This data is preserved across navigation and page reloads (with storage enabled).
   */
  state?: HistoryState;

  /**
   * Skip guard evaluation for this navigation.
   *
   * Useful for programmatic navigation that should bypass access control.
   */
  skipGuards?: boolean;

  /**
   * Skip middleware execution for this navigation.
   *
   * Useful for emergency redirects or error handling that should bypass normal middleware
   * processing.
   */
  skipMiddleware?: boolean;

  /**
   * Skip hooks for this navigation.
   *
   * Useful for silent navigation that shouldn't trigger lifecycle events.
   */
  skipHooks?: boolean;
}

/**
 * Runtime adapter interface.
 *
 * Adapters provide the router with environment-specific functionality for history
 * management, URL parsing, and navigation.
 *
 * @category Runtime
 */
export interface RuntimeAdapter {
  /**
   * Adapter mode identifier.
   */
  mode: RuntimeMode;

  /**
   * Get current URL.
   */
  getURL: () => string;

  /**
   * Push a new history entry.
   */
  push: (url: string, state?: HistoryState) => void;

  /**
   * Replace current history entry.
   */
  replace: (url: string, state?: HistoryState) => void;

  /**
   * Go back in history.
   */
  back: () => void;

  /**
   * Go forward in history.
   */
  forward: () => void;

  /**
   * Go to specific history entry.
   */
  go: (delta: number) => void;

  /**
   * Listen for navigation events.
   */
  listen: (callback: (url: string) => void) => () => void;

  /**
   * Get current history state.
   */
  getState: () => HistoryState;

  /**
   * Check if adapter is available in current environment.
   */
  isAvailable: () => boolean;
}
