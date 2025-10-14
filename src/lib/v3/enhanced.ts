/**
 * Enhanced router utilities - Level 2 API
 *
 * @module v3/enhanced
 * @category API Level 2
 */

import type { EnhancedRouteConfig, RouterConfig, NavigationOptions } from './types';
import EnhancedRouterComponent from './enhanced.svelte';

/**
 * Enhanced navigation function with more options
 */
export function navigate(path: string, options: NavigationOptions = {}): void {
  const { replace = false, state = null } = options;

  if (replace) {
    history.replaceState(state, '', path);
  } else {
    history.pushState(state, '', path);
  }

  // Dispatch custom navigation event
  window.dispatchEvent(new CustomEvent('router:navigate', {
    detail: { path, options }
  }));
}

/**
 * Go back in history
 */
export function goBack(): void {
  history.back();
}

/**
 * Go forward in history
 */
export function goForward(): void {
  history.forward();
}

/**
 * Replace current route
 */
export function replace(path: string, state?: any): void {
  navigate(path, { replace: true, state });
}

/**
 * Create a router instance with enhanced configuration
 */
export function createRouter(config: RouterConfig & { routes: EnhancedRouteConfig[] }) {
  return EnhancedRouterComponent;
}

/**
 * Enhanced router component export
 */
export { default as Router } from './enhanced.svelte';