/**
 * @file
 *
 *   Router state management using Svelte 5 runes.
 *
 *   This module provides reactive state management for the router using Svelte 5's $state,
 *   $derived, and $effect runes. All state is reactive and automatically updates
 *   components when navigation occurs.
 *
 * @category State Management
 */

import type {
  RouteMatch,
  NavigationState,
  AdvancedRouteConfig,
  RouteParams,
  QueryParams,
} from "../types";

/**
 * Router state manager.
 *
 * Manages all reactive state for the router including current route, navigation state,
 * and history. Uses Svelte 5 reactivity through class fields that become reactive
 * when used in Svelte components.
 *
 * @example
 *
 * ```ts
 * const state = new RouterState();
 *
 * // Set current route
 * state.setRoute(matchResult);
 *
 * // Access reactive state
 * console.log(state.params);  // Current params
 * console.log(state.navigating);  // Navigation status
 * ```
 *
 * @category State Management
 */
export class RouterState {
  /**
   * Current matched route.
   *
   * Note: This becomes reactive when instantiated in a Svelte component
   * context due to the .svelte.ts extension.
   */
  current: RouteMatch | undefined = undefined;

  /**
   * Previous route (for transitions and animations).
   *
   * Note: This becomes reactive when instantiated in a Svelte component
   * context due to the .svelte.ts extension.
   */
  previous: RouteMatch | undefined = undefined;

  /**
   * Navigation state.
   *
   * Note: This becomes reactive when instantiated in a Svelte component
   * context due to the .svelte.ts extension.
   */
  state: NavigationState = "idle";

  /**
   * Navigation error if any.
   *
   * Note: This becomes reactive when instantiated in a Svelte component
   * context due to the .svelte.ts extension.
   */
  error: Error | null = null;

  /**
   * Current route parameters (derived from current route).
   */
  get params(): RouteParams {
    return this.current?.params ?? {};
  }

  /**
   * Current query parameters (derived from current route).
   */
  get query(): QueryParams {
    return this.current?.query ?? {};
  }

  /**
   * Current path (derived from current route).
   */
  get path(): string {
    if (!this.current?.route?.path) {
      return "/";
    }
    return this.reconstructPath(this.current.route.path, this.current.params);
  }

  /**
   * Whether currently navigating (derived from state).
   */
  get navigating(): boolean {
    return this.state === "navigating" || this.state === "loading";
  }

  /**
   * Current route configuration (derived).
   */
  get route(): AdvancedRouteConfig | undefined {
    return this.current?.route as AdvancedRouteConfig | undefined;
  }

  /**
   * Update current route.
   *
   * Sets the new current route and updates previous route for transitions. Resets
   * navigation state and errors.
   *
   * @param route The new route match.
   *
   * @category State Management
   */
  setRoute(route: RouteMatch): void {
    this.previous = this.current;
    this.current = route;
    this.state = "idle";
    this.error = null;
  }

  /**
   * Set navigation state.
   *
   * Updates the current navigation state to track the navigation lifecycle.
   *
   * @param state The new navigation state.
   *
   * @category State Management
   */
  setState(state: NavigationState): void {
    this.state = state;
  }

  /**
   * Set navigation error.
   *
   * Records an error that occurred during navigation and sets state to error.
   *
   * @param error The navigation error.
   *
   * @category State Management
   */
  setError(error: Error): void {
    this.error = error;
    this.state = "error";
  }

  /**
   * Clear navigation state.
   *
   * Resets navigation state and clears any errors.
   *
   * @category State Management
   */
  reset(): void {
    this.state = "idle";
    this.error = null;
  }

  /**
   * Reconstruct path from pattern and params.
   *
   * Replaces parameter placeholders in the pattern with actual values from the params
   * object.
   *
   * @param pattern The route pattern.
   * @param params The route parameters.
   *
   * @returns Reconstructed path.
   *
   * @category State Management
   */
  private reconstructPath(
    pattern: string,
    params: Record<string, string | number | boolean>
  ): string {
    let path = pattern;

    // Replace parameters
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, String(value));
      path = path.replace(`:${key}?`, String(value));
    }

    // Remove remaining optional parameters
    path = path.replace(/\/:[^/]+\?/g, "");

    return path;
  }
}
