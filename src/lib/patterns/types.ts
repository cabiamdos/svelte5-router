/**
 * Type definitions for AST-based pattern matching
 *
 * @module patterns/types
 * @category Core
 */

/**
 * The different types of pattern segments that can be parsed
 */
export type PatternSegmentType =
  | "literal" // Exact string match: "/users"
  | "parameter" // Named parameter: "/:id"
  | "wildcard" // Catch-all: "/*" or "/**"
  | "optional" // Optional segment: "/users?/:id?"
  | "group"; // Grouped segments: "/(users|posts)"

/**
 * A parsed pattern segment
 */
export interface PatternSegment {
  type: PatternSegmentType;
  value: string;
  name?: string;
  optional?: boolean;
  greedy?: boolean;
  constraint?: string;
}

/**
 * The compiled pattern AST
 */
export interface PatternAST {
  segments: PatternSegment[];
  paramNames: string[];
  hasWildcard: boolean;
  hasOptional: boolean;
  source: string;
}

/**
 * Result of pattern matching
 */
export interface PatternMatch {
  matched: boolean;
  params: Record<string, string>;
  remaining?: string;
  exact: boolean;
}

/**
 * Pattern compilation options
 */
export interface PatternOptions {
  caseSensitive?: boolean;
  strict?: boolean;
  end?: boolean;
}
