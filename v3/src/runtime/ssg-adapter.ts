/**
 * @file
 *
 *   SSG runtime adapter for static site generation.
 *
 *   This adapter provides routing for static site generation builds. Like the SSR adapter,
 *   it uses a fixed URL but is optimized for the build-time generation of static pages.
 *
 * @category Runtime
 */

import type { RuntimeAdapter, HistoryState } from "../types";

/**
 * Create an SSG runtime adapter.
 *
 * Creates an adapter for static site generation with a fixed URL. Used during build time
 * to generate static HTML files for each route.
 *
 * @param initialURL The route URL to generate.
 * @param initialState Optional initial state.
 *
 * @returns SSG runtime adapter instance.
 *
 * @category Runtime
 */
export function createSSGAdapter(initialURL: string, initialState?: HistoryState): RuntimeAdapter {
  const currentURL = initialURL;
  const currentState = initialState || null;

  return {
    mode: "ssg",
    getURL: (): string => currentURL,
    push: (): void => {}, // No-op in SSG
    replace: (): void => {}, // No-op in SSG
    back: (): void => {}, // No-op in SSG
    forward: (): void => {}, // No-op in SSG
    go: (): void => {}, // No-op in SSG
    listen: (): (() => void) => () => {}, // No-op in SSG
    getState: (): HistoryState => currentState,
    isAvailable: (): boolean => typeof window === "undefined"
  };
}
