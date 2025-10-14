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
export function goto(path: string, options?: Pick<NavigationOptions, "replace" | "state">): void {
  if (options?.replace) {
    adapter.replace(path, options.state);
  } else {
    adapter.push(path, options?.state);
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
