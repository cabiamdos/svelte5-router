/**
 * @file
 *
 *   SSR runtime adapter for server-side rendering.
 *
 *   This adapter provides synchronous routing for server-side rendering environments where
 *   the URL is fixed and navigation doesn't occur. The URL and state are provided during
 *   initialization and remain constant throughout the render.
 *
 * @category Runtime
 */

import type { RuntimeAdapter, HistoryState } from "../types";

/**
 * Create an SSR runtime adapter.
 *
 * Creates an adapter for server-side rendering with a fixed URL and state. Navigation
 * operations are no-ops since the server doesn't navigate - it renders a single
 * response.
 *
 * @param initialURL The request URL to render.
 * @param initialState Optional initial state.
 *
 * @returns SSR runtime adapter instance.
 *
 * @category Runtime
 */
export function createSSRAdapter(initialURL: string, initialState?: HistoryState): RuntimeAdapter {
  const currentURL = initialURL;
  const currentState = initialState || null;

  return {
    mode: "ssr",
    getURL: (): string => currentURL,
    push: (): void => {}, // No-op in SSR
    replace: (): void => {}, // No-op in SSR
    back: (): void => {}, // No-op in SSR
    forward: (): void => {}, // No-op in SSR
    go: (): void => {}, // No-op in SSR
    listen: (): (() => void) => () => {}, // No-op in SSR
    getState: (): HistoryState => currentState,
    isAvailable: (): boolean => typeof window === "undefined"
  };
}
