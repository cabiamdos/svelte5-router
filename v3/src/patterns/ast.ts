/**
 * @file
 *
 *   AST (Abstract Syntax Tree) node definitions for route pattern parsing.
 *
 *   This module defines the structure of the AST used to represent route patterns. Instead
 *   of using regular expressions (which are forbidden), we parse route patterns into a
 *   tree structure that can be efficiently compiled into matcher functions.
 *
 *   ## Why AST Over Regex?
 *
 *   1. **Performance**: AST matching is O(n) where n is the number of path segments, while
 *        regex can be O(n*m) in worst cases.
 *   2. **Type Safety**: AST nodes have explicit types that can be validated at compile time.
 *   3. **Debuggability**: AST structure is easy to inspect and understand.
 *   4. **Extensibility**: New node types can be added without breaking existing code.
 *
 *   ## AST Structure
 *
 *   A route pattern like `/users/:id/posts/*` becomes:
 *
 *   ```
 *   Root
 *   ├── Static('users')
 *   ├── Parameter('id')
 *   ├── Static('posts')
 *   └── Wildcard()
 * ```
 *
 * @example
 *
 * ```ts
 * // Simple static path
 * const ast1: RootNode = {
 *   type: 'root',
 *   segments: [
 *     { type: 'static', value: 'users' }
 *   ]
 * };
 *
 * // Path with parameter
 * const ast2: RootNode = {
 *   type: 'root',
 *   segments: [
 *     { type: 'static', value: 'users' },
 *     { type: 'parameter', name: 'id' }
 *   ]
 * };
 *
 * // Path with wildcard
 * const ast3: RootNode = {
 *   type: 'root',
 *   segments: [
 *     { type: 'static', value: 'api' },
 *     { type: 'wildcard', greedy: false }
 *   ]
 * };
 * ```
 *
 * @category Pattern Matching
 */

/**
 * Base AST node interface.
 *
 * All AST nodes extend this interface, providing a common type discriminator that enables
 * TypeScript's discriminated union narrowing.
 *
 * @category Pattern Matching
 */
export interface BaseNode {
  /**
   * Node type discriminator.
   */
  type: string;
}

/**
 * Static path segment node.
 *
 * Represents a literal string in the path that must match exactly. This is the most
 * common and performant node type since it uses simple string equality.
 *
 * @example
 *
 * ```ts
 * // Pattern: '/users'
 * const node: StaticNode = {
 *   type: 'static',
 *   value: 'users'
 * };
 * ```
 *
 * @category Pattern Matching
 */
export interface StaticNode extends BaseNode {
  type: "static";

  /**
   * Literal value that must match.
   *
   * Case-sensitive by default. The matcher compares this value directly with the URL
   * segment using strict equality.
   */
  value: string;

  /**
   * Whether matching should be case-insensitive.
   *
   * When true, 'Users' and 'users' are treated as equivalent. Defaults to false for
   * performance and security (case sensitivity is generally preferred).
   */
  caseInsensitive?: boolean;
}

/**
 * Parameter path segment node.
 *
 * Represents a named parameter in the path that captures a single segment. The captured
 * value is made available in the route params object.
 *
 * @example
 *
 * ```ts
 * // Pattern: '/users/:id'
 * const node: ParameterNode = {
 *   type: 'parameter',
 *   name: 'id',
 *   validate: (value) => /^\d+$/.test(value) // Only numbers
 * };
 * ```
 *
 * @category Pattern Matching
 */
export interface ParameterNode extends BaseNode {
  type: "parameter";

  /**
   * Parameter name used in the params object.
   *
   * Must be a valid JavaScript identifier. This name is used as the key in the route
   * params object passed to components and middleware.
   */
  name: string;

  /**
   * Optional validation function.
   *
   * Runs during matching to validate the captured value. Returning false causes the match
   * to fail and continue to the next route.
   *
   * @param value The captured URL segment.
   *
   * @returns Whether the value is valid.
   */
  validate?: (value: string) => boolean;

  /**
   * Optional type coercion for the parameter.
   *
   * Automatically converts the string value to the specified type. Useful for numeric IDs
   * or boolean flags.
   *
   * @category Type Coercion
   */
  coerce?: "string" | "number" | "boolean";

  /**
   * Optional parameter for routes like `/users/:id?`.
   *
   * When true, this segment can be omitted from the URL and the route will still match.
   */
  optional?: boolean;
}

/**
 * Wildcard path segment node.
 *
 * Represents a wildcard that matches one or more segments. Useful for catch-all routes or
 * nested routing scenarios.
 *
 * @example
 *
 * ```ts
 * // Pattern: '/files/*'
 * const node: WildcardNode = {
 *   type: 'wildcard',
 *   greedy: true,
 *   name: 'path'
 * };
 * ```
 *
 * @category Pattern Matching
 */
export interface WildcardNode extends BaseNode {
  type: "wildcard";

  /**
   * Whether to match multiple segments greedily.
   *
   * When true (default), matches all remaining segments. When false, matches only a
   * single segment (equivalent to a parameter with no validation).
   */
  greedy?: boolean;

  /**
   * Optional name for the captured segments.
   *
   * If provided, the matched segments are available in the params object under this name.
   * If omitted, the segments are not captured.
   */
  name?: string;
}

/**
 * Root AST node.
 *
 * The top-level node that contains all segments in the pattern. Every pattern AST starts
 * with a root node.
 *
 * @example
 *
 * ```ts
 * const ast: RootNode = {
 *   type: 'root',
 *   segments: [
 *     { type: 'static', value: 'users' },
 *     { type: 'parameter', name: 'id' },
 *     { type: 'static', value: 'posts' }
 *   ]
 * };
 * ```
 *
 * @category Pattern Matching
 */
export interface RootNode extends BaseNode {
  type: "root";

  /**
   * Ordered list of path segments.
   *
   * Segments are matched left-to-right against the URL path. The order is significant and
   * affects matching behavior.
   */
  segments: SegmentNode[];

  /**
   * Pattern string this AST was parsed from.
   *
   * Stored for debugging and error messages. Not used in matching.
   */
  original?: string;
}

/**
 * Union type of all segment node types.
 *
 * Used for discriminated unions and type narrowing. TypeScript can automatically narrow
 * the type based on the `type` property.
 *
 * @category Pattern Matching
 */
export type SegmentNode = StaticNode | ParameterNode | WildcardNode;

/**
 * Union type of all AST node types.
 *
 * Includes both the root node and all segment types. Useful for generic AST traversal and
 * transformation functions.
 *
 * @category Pattern Matching
 */
export type ASTNode = RootNode | SegmentNode;

/**
 * Pattern compilation options.
 *
 * Controls how patterns are parsed and compiled into matchers. These options affect both
 * parsing and matching behavior.
 *
 * @category Pattern Matching
 */
export interface PatternOptions {
  /**
   * Whether to match paths case-insensitively.
   *
   * Applies to all static segments in the pattern. Individual segments can override this
   * with their own caseInsensitive option.
   */
  caseInsensitive?: boolean;

  /**
   * Whether to match strict (require exact path).
   *
   * When true, '/users' does not match '/users/'. When false (default), both forms are
   * equivalent.
   */
  strict?: boolean;

  /**
   * Whether to match trailing slashes.
   *
   * When true, '/users/' matches '/users'. When false, they must match exactly.
   */
  trailingSlash?: boolean;

  /**
   * Base path to strip before matching.
   *
   * Useful when mounting the router at a sub-path. The base path is removed from URLs
   * before matching begins.
   */
  basePath?: string;
}

/**
 * Pattern parse result.
 *
 * Contains the parsed AST and any warnings or errors encountered during parsing. Warnings
 * don't prevent the pattern from being used but indicate potential issues.
 *
 * @category Pattern Matching
 */
export interface ParseResult {
  /**
   * Parsed AST root node.
   */
  ast: RootNode;

  /**
   * Warning messages from parsing.
   *
   * Warnings indicate potential issues like deprecated syntax or ambiguous patterns, but
   * don't prevent the pattern from working.
   */
  warnings: string[];

  /**
   * Error messages from parsing.
   *
   * If errors are present, the AST may be incomplete or invalid and should not be used
   * for matching.
   */
  errors: string[];
}
