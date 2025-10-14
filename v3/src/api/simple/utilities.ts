/**
 * @file
 *
 *   Simple API utilities.
 *
 * @category API Level 1
 */

import { createSPAAdapter } from "../../runtime/spa-adapter";
import type { NavigationOptions } from "../../types";

const adapter = createSPAAdapter();

/**
 * Navigate to a path.
 *
 * Simple navigation function for the Simple API.
 *
 * @param path The path to navigate to.
 * @param options Optional navigation options.
 *
 * @category API Level 1
 */
// NOTE: Use SvelteKit navigation utils to avoid router conflicts
// Import these conditionally within the function for SSR safety (as per SvelteKit requirements)
export function goto(path: string, options?: Pick<NavigationOptions, "replace" | "state">): void {
  console.log("goto", path, options);
  if (typeof window !== "undefined" && "__SVELTEKIT_DEV__" in window) {
    // SvelteKit environment: use its navigation
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { pushState, replaceState } = require("$app/navigation");
    console.error("SvelteKit environment: using navigation utils");
    if (options?.replace) {
      replaceState(path, options?.state);
    } else {
      pushState(path, options?.state);
    }
  } else {
    console.error(options);
    // Fallback to our SPA adapter for non-SvelteKit usage
    if (options?.replace) {
      adapter.replace(path, options?.state);
    } else {
      adapter.push(path, options?.state);
    }
  }
}

/**
 * Navigate back in history.
 *
 * @category API Level 1
 */
export function back(): void {
  adapter.back();
}

/**
 * Navigate forward in history.
 *
 * @category API Level 1
 */
export function forward(): void {
  adapter.forward();
}
