/**
 * Simple router utilities - Level 1 API
 *
 * @module v3/simple
 * @category API Level 1
 */

import type { SimpleRouteConfig, NavigationOptions } from './types';

/**
 * Simple navigation function
 */
export function route(path: string, options?: Pick<NavigationOptions, 'replace'>): void {
  if (options?.replace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }

  // Dispatch navigation event
  window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
}

/**
 * Simple router component export
 */
export { default as SimpleRouter } from './simple.svelte';