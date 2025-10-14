/**
 * @file
 *
 *   Memory runtime adapter for testing and non-browser environments.
 *
 *   This adapter implements a complete history stack in memory without relying on browser
 *   APIs. Useful for testing, SSR with client-side transitions, or embedding in
 *   non-browser environments.
 *
 * @category Runtime
 */

import type { RuntimeAdapter, HistoryState } from "../types";

/**
 * Memory history entry.
 *
 * Represents a single entry in the in-memory history stack.
 *
 * @category Runtime
 */
interface HistoryEntry {
  url: string;
  state: HistoryState;
}

/**
 * Create a memory runtime adapter.
 *
 * Creates an adapter with an in-memory history stack. Supports all navigation operations
 * without browser APIs, making it ideal for testing.
 *
 * @param initialURL Optional initial URL (defaults to '/').
 * @param initialState Optional initial state.
 *
 * @returns Memory runtime adapter instance.
 *
 * @category Runtime
 */
export function createMemoryAdapter(
  initialURL = "/",
  initialState: HistoryState = null
): RuntimeAdapter {
  const history: HistoryEntry[] = [{ url: initialURL, state: initialState }];
  let currentIndex = 0;
  let listeners: Array<(url: string) => void> = [];

  const notifyListeners = (): void => {
    const url = history[currentIndex]?.url || "/";
    listeners.forEach((listener) => listener(url));
  };

  return {
    mode: "memory",

    getURL: (): string => history[currentIndex]?.url || "/",

    push: (url: string, state?: HistoryState): void => {
      // Remove any entries after current index
      history.splice(currentIndex + 1);
      // Add new entry
      history.push({ url, state: state || null });
      currentIndex++;
      notifyListeners();
    },

    replace: (url: string, state?: HistoryState): void => {
      history[currentIndex] = { url, state: state || null };
      notifyListeners();
    },

    back: (): void => {
      if (currentIndex > 0) {
        currentIndex--;
        notifyListeners();
      }
    },

    forward: (): void => {
      if (currentIndex < history.length - 1) {
        currentIndex++;
        notifyListeners();
      }
    },

    go: (delta: number): void => {
      const newIndex = currentIndex + delta;
      if (newIndex >= 0 && newIndex < history.length) {
        currentIndex = newIndex;
        notifyListeners();
      }
    },

    listen: (callback: (url: string) => void): (() => void) => {
      listeners.push(callback);
      return (): void => {
        listeners = listeners.filter((l) => l !== callback);
      };
    },

    getState: (): HistoryState => history[currentIndex]?.state || null,

    isAvailable: (): boolean => true
  };
}
