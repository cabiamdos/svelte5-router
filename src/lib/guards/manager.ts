/**
 * Route guards manager
 *
 * @module guards/manager
 * @category Core
 */

import { withTimeout } from "../utilities.svelte";
import type {
  GuardContext,
  GuardExecutionResult,
  GuardFunction,
  GuardOptions,
  GuardResult,
  RegisteredGuard
} from "./types";

/**
 * Route guards manager
 */
export class GuardManager {
  private guards: RegisteredGuard[] = [];
  private idCounter = 0;

  /**
   * Register a route guard
   */
  register(fn: GuardFunction, options: GuardOptions = {}): string {
    const id = `guard_${++this.idCounter}`;
    const registered: RegisteredGuard = {
      fn,
      options: {
        priority: 0,
        global: false,
        timeout: 5000,
        ...options
      },
      id
    };

    this.guards.push(registered);
    this.sortGuards();

    return id;
  }

  /**
   * Remove a guard by ID
   */
  remove(id: string): boolean {
    const index = this.guards.findIndex((g) => g.id === id);
    if (index !== -1) {
      this.guards.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Execute guards for a navigation
   */
  async execute(context: GuardContext): Promise<GuardExecutionResult> {
    const startTime = Date.now();
    const executedGuards: string[] = [];
    const applicableGuards = this.getApplicableGuards(context);

    for (const guard of applicableGuards) {
      executedGuards.push(guard.id);

      try {
        const result = await this.executeGuard(guard, context);

        if (result === false) {
          return {
            allowed: false,
            executedGuards,
            duration: Date.now() - startTime
          };
        }

        if (typeof result === "string") {
          return {
            allowed: false,
            redirect: result,
            executedGuards,
            duration: Date.now() - startTime
          };
        }

        if (typeof result === "object" && result.redirect) {
          return {
            allowed: false,
            redirect: result.redirect,
            replace: "replace" in result ? result.replace : false,
            executedGuards,
            duration: Date.now() - startTime
          };
        }
      } catch (error) {
        return {
          allowed: false,
          error: error as Error,
          executedGuards,
          duration: Date.now() - startTime
        };
      }
    }

    return {
      allowed: true,
      executedGuards,
      duration: Date.now() - startTime
    };
  }

  /**
   * Execute a single guard with timeout
   */
  private async executeGuard(guard: RegisteredGuard, context: GuardContext): Promise<GuardResult> {
    return withTimeout(guard.fn(context), guard.options.timeout ?? 5000, `Guard ${guard.id}`);
  }

  /**
   * Get guards applicable to the current navigation
   */
  private getApplicableGuards(context: GuardContext): RegisteredGuard[] {
    return this.guards.filter((guard) => {
      // Global guards always apply
      if (guard.options.global) return true;

      // Check if guard applies to specific routes
      if (guard.options.routes) {
        const routePath = context.to.result.path.original;
        return guard.options.routes.some((pattern) => routePath === pattern || routePath.startsWith(pattern));
      }

      return false;
    });
  }

  /**
   * Sort guards by priority (higher priority first)
   */
  private sortGuards(): void {
    this.guards.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));
  }

  /**
   * Clear all guards
   */
  clear(): void {
    this.guards = [];
  }

  /**
   * Get information about registered guards
   */
  getInfo(): Array<{ id: string; name?: string | undefined; priority: number; global: boolean }> {
    return this.guards.map((g) => ({
      id: g.id,
      name: g.options.name,
      priority: g.options.priority || 0,
      global: g.options.global || false
    }));
  }
}
