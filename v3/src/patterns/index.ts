/**
 * @file
 *
 *   Pattern matching module exports.
 *
 *   This module provides AST-based pattern matching for route patterns. Instead of using
 *   regular expressions, patterns are parsed into an Abstract Syntax Tree and compiled
 *   into optimized matching functions.
 *
 * @example
 *
 * ```ts
 * import { parsePattern, compileMatcher, matchURL } from './patterns';
 *
 * // Parse and compile a pattern
 * const result = parsePattern('/users/:id');
 * const matcher = compileMatcher(result.ast);
 *
 * // Match a URL
 * const match = matcher('/users/123');
 * console.log(match.params); // { id: '123' }
 * ```
 *
 * @category Pattern Matching
 */

// Export AST types
export type {
  BaseNode,
  StaticNode,
  ParameterNode,
  WildcardNode,
  RootNode,
  SegmentNode,
  ASTNode,
  PatternOptions,
  ParseResult
} from "./ast";

// Export parser functions
export { parsePattern } from "./parser";

// Export matcher functions
export { compileMatcher, matchURL, parseQuery } from "./matcher";
