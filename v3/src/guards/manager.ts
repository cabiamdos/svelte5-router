/**
 * @file
 *
 *   Guard execution manager.
 *
 *   This module implements the guard execution system that evaluates route guards before
 *   navigation. Guards control access to routes based on custom logic.
 *
 * @category Guards
 */

import type { GuardFunction, GuardContext } from "../types";

/**
 * Execute guard functions.
 *
 * Runs guard functions in order and returns whether all guards passed. If any guard
 * returns false, navigation is denied.
 *
 * @param guards Array of guard functions to execute.
 * @param context The guard execution context.
 *
 * @returns Whether all guards passed.
 *
 * @example
 *
 * ```ts
 * const allowed = await executeGuards([
 *   authGuard,
 *   adminGuard
 * ], context);
 * ```
 *
 * @category Guards
 */
export async function executeGuards(
  guards: GuardFunction[],
  context: GuardContext
): Promise<boolean> {
  for (const guard of guards) {
    try {
      const result = await guard(context);
      if (!result) {
        return false; // Guard denied access
      }
    } catch (error) {
      console.error("[Guard] Error executing guard:", error);
      return false; // Error denies access
    }
  }

  return true; // All guards passed
}
