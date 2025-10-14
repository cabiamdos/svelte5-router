/**
 * @file
 *
 *   Runtime adapter module exports.
 *
 *   This module provides runtime adapters for different execution environments. Each
 *   adapter implements the same interface but provides environment-specific behavior.
 *
 * @category Runtime
 */

export { createSPAAdapter } from "./spa-adapter";
export { createSSRAdapter } from "./ssr-adapter";
export { createSSGAdapter } from "./ssg-adapter";
export { createMemoryAdapter } from "./memory-adapter";

export type { RuntimeAdapter } from "../types";
