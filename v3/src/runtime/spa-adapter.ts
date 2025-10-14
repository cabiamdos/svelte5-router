/**
 * @file
 *
 *   SPA runtime adapter using browser History API.
 *
 *   This module provides a runtime adapter for Single Page Applications that integrates
 *   with the browser's History API. It handles navigation, state management, and event
 *   listening in a browser environment.
 *
 *   ## Browser History API
 *
 *   The adapter wraps the native History API to provide:
 *
 *   1. **State Management**: Preserves navigation state across history entries
 *   2. **Event Listening**: Monitors popstate events for back/forward navigation
 *   3. **Push/Replace**: Programmatic navigation with state
 *   4. **URL Access**: Current URL and history state access
 *
 *   ## Event Flow
 *
 *   ```
 *   User Action (click/back/forward)
 *     ↓
 *   Browser History API
 *     ↓
 *   popstate Event
 *     ↓
 *   Adapter Listeners
 *     ↓
 *   Router Navigation
 * ```
 *
 * @example
 *
 * ```ts
 * import { createSPAAdapter } from './spa-adapter';
 *
 * const adapter = createSPAAdapter();
 *
 * // Check availability
 * if (adapter.isAvailable()) {
 *   // Listen for navigation
 *   const unlisten = adapter.listen((url) => {
 *     console.log('Navigated to:', url);
 *   });
 *
 *   // Navigate programmatically
 *   adapter.push('/users/123', { from: 'home' });
 *
 *   // Clean up
 *   unlisten();
 * }
 * ```
 *
 * @category Runtime
 */

import type { RuntimeAdapter, HistoryState } from "../types";

/**
 * Create an SPA runtime adapter.
 *
 * Creates an adapter that integrates with the browser History API for client-side
 * routing. The adapter manages navigation state and provides event listening for
 * back/forward navigation.
 *
 * @returns SPA runtime adapter instance.
 *
 * @example
 *
 * ```ts
 * const adapter = createSPAAdapter();
 *
 * // Listen for navigation events
 * adapter.listen((url) => {
 *   console.log('URL changed:', url);
 * });
 *
 * // Navigate to a new route
 * adapter.push('/about');
 * ```
 *
 * @category Runtime
 */
export function createSPAAdapter(): RuntimeAdapter {
  // Track registered listeners
  let listeners: Array<(url: string) => void> = [];

  /**
   * Notify all registered listeners of a navigation event.
   *
   * Calls each listener with the current URL, allowing them to react to navigation
   * changes.
   *
   * @category Runtime
   */
  const notifyListeners = (): void => {
    const url = window.location.href;
    listeners.forEach((listener) => {
      try {
        listener(url);
      } catch (error) {
        console.error("[SPA Adapter] Error in navigation listener:", error);
      }
    });
  };

  /**
   * Handle browser popstate events.
   *
   * Triggered when the user navigates using browser back/forward buttons. Notifies all
   * registered listeners of the navigation.
   *
   * @category Runtime
   */
  const handlePopState = (): void => {
    notifyListeners();
  };

  // Register popstate listener on creation
  if (typeof window !== "undefined") {
    window.addEventListener("popstate", handlePopState);
  }

  return {
    mode: "spa",

    /**
     * Get the current URL.
     *
     * Returns the full URL including protocol, host, path, query, and hash.
     *
     * @returns Current URL string.
     *
     * @category Runtime
     */
    getURL: (): string => {
      if (typeof window === "undefined") {
        return "";
      }
      return window.location.href;
    },

    /**
     * Push a new history entry.
     *
     * Adds a new entry to the browser history stack and navigates to the specified URL.
     * The state object is preserved and can be accessed later.
     *
     * @param url The URL to navigate to.
     * @param state Optional state object to attach to the history entry.
     *
     * @example
     *
     * ```ts
     * adapter.push('/users/123', { from: 'home' });
     * ```
     *
     * @category Runtime
     */
    push: (url: string, state?: HistoryState): void => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        window.history.pushState(state || null, "", url);
        notifyListeners();
      } catch (error) {
        console.error("[SPA Adapter] Error pushing history state:", error);
      }
    },

    /**
     * Replace the current history entry.
     *
     * Updates the current history entry without creating a new one. Useful for redirects
     * or updating the URL without affecting history navigation.
     *
     * @param url The URL to replace with.
     * @param state Optional state object to attach to the history entry.
     *
     * @example
     *
     * ```ts
     * adapter.replace('/login', { redirect: '/dashboard' });
     * ```
     *
     * @category Runtime
     */
    replace: (url: string, state?: HistoryState): void => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        window.history.replaceState(state || null, "", url);
        notifyListeners();
      } catch (error) {
        console.error("[SPA Adapter] Error replacing history state:", error);
      }
    },

    /**
     * Navigate back one entry in history.
     *
     * Equivalent to clicking the browser's back button. Triggers a popstate event when
     * the navigation completes.
     *
     * @category Runtime
     */
    back: (): void => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        window.history.back();
      } catch (error) {
        console.error("[SPA Adapter] Error navigating back:", error);
      }
    },

    /**
     * Navigate forward one entry in history.
     *
     * Equivalent to clicking the browser's forward button. Triggers a popstate event when
     * the navigation completes.
     *
     * @category Runtime
     */
    forward: (): void => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        window.history.forward();
      } catch (error) {
        console.error("[SPA Adapter] Error navigating forward:", error);
      }
    },

    /**
     * Navigate to a specific position in history.
     *
     * Moves the history pointer by the specified delta. Positive values go forward,
     * negative values go back.
     *
     * @param delta Number of entries to move (positive or negative).
     *
     * @example
     *
     * ```ts
     * adapter.go(-2);  // Go back 2 entries
     * adapter.go(1);   // Go forward 1 entry
     * ```
     *
     * @category Runtime
     */
    go: (delta: number): void => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        window.history.go(delta);
      } catch (error) {
        console.error("[SPA Adapter] Error navigating with go():", error);
      }
    },

    /**
     * Register a navigation listener.
     *
     * Adds a callback that will be invoked whenever navigation occurs, either through
     * programmatic navigation or browser back/forward buttons.
     *
     * @param callback Function to call on navigation events.
     *
     * @returns Function to unregister the listener.
     *
     * @example
     *
     * ```ts
     * const unlisten = adapter.listen((url) => {
     *   console.log('Navigated to:', url);
     * });
     *
     * // Later, stop listening
     * unlisten();
     * ```
     *
     * @category Runtime
     */
    listen: (callback: (url: string) => void): (() => void) => {
      listeners.push(callback);

      // Return unsubscribe function
      return (): void => {
        listeners = listeners.filter((l) => l !== callback);

        // Clean up popstate listener if no listeners remain
        if (listeners.length === 0 && typeof window !== "undefined") {
          window.removeEventListener("popstate", handlePopState);
        }
      };
    },

    /**
     * Get the current history state.
     *
     * Returns the state object attached to the current history entry, or null if no state
     * was set.
     *
     * @returns Current history state or null.
     *
     * @category Runtime
     */
    getState: (): HistoryState => {
      if (typeof window === "undefined") {
        return null;
      }
      return window.history.state as HistoryState;
    },

    /**
     * Check if the adapter is available in the current environment.
     *
     * Returns true if running in a browser with History API support. Returns false in
     * server-side rendering or other non-browser environments.
     *
     * @returns Whether the adapter can be used.
     *
     * @category Runtime
     */
    isAvailable: (): boolean => {
      return (
        typeof window !== "undefined" &&
        typeof window.history !== "undefined" &&
        typeof window.history.pushState === "function"
      );
    }
  };
}
