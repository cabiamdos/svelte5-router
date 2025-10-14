// ============================================================================
// Svelte5 Router v3 - Progressive Disclosure API
// ============================================================================

// Level 1: Simple API - Just the basics
export { SimpleRouter, route } from "./v3/simple";

// Level 2: Enhanced API - More control and features
export { Router as EnhancedRouter, createRouter, navigate, goBack, goForward, replace } from "./v3/enhanced";

// Level 3: Advanced API - Full power and customization
export { AdvancedRouter, createAdvancedRouter, preloadRoute } from "./v3/advanced";

// Core v3 types and systems
export type * from "./v3/types";
export * from "./patterns";
export * from "./middleware";
export * from "./guards";

// ============================================================================
// Core Utilities (v3 Compatible)
// ============================================================================

// Essential utilities for v3 router
export { goto } from "./helpers/goto";
export { pop } from "./helpers/pop";
export { replace as replaceHelper } from "./helpers/replace";
export { identify, type Identities, type Identity } from "./helpers/identify";
export { logging } from "./helpers/logging";
export { marshal, type Marshalled } from "./helpers/marshal";
export { normalize } from "./helpers/normalize";
export { query } from "./helpers/query";
export { runtime } from "./helpers/runtime";
export { Span, Trace } from "./helpers/tracing.svelte";
export type { ReturnParam as Param } from "./helpers/urls";

// Core types for compatibility
export type { Condition, Evaluation, EvaluationResult } from "./helpers/evaluators";
export { StatusCode, getStatusByValue, type Statuses } from "./statuses";

// Actions system
export { active } from "./actions/active.svelte";
export { route as legacyRoute } from "./actions/route.svelte";
export { RouteOptions } from "./actions/options";

// ============================================================================
// Default Export - Progressive Disclosure Entry Point
// ============================================================================

/**
 * Default export provides progressive disclosure starting point
 * Users can import the simple router and progressively enhance
 */
export { SimpleRouter as default } from "./v3/simple";
