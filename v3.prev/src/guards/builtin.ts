/**
 * @file
 *
 *   Built-in guard functions.
 *
 * @category Guards
 */

import type { GuardFunction } from "../types";

/**
 * Authentication guard factory.
 *
 * Creates a guard that checks if a user is authenticated.
 *
 * @param isAuthenticated Function that returns whether user is authenticated.
 *
 * @returns Guard function.
 *
 * @example
 *
 * ```ts
 * const authGuard = createAuthGuard(() => {
 *   return localStorage.getItem('token') !== null;
 * });
 * ```
 *
 * @category Guards
 */
export function createAuthGuard(isAuthenticated: () => boolean | Promise<boolean>): GuardFunction {
  return async (context) => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      context.redirect("/login?redirect=" + encodeURIComponent(context.to));
      return false;
    }
    return true;
  };
}
