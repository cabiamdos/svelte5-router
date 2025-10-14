/**
 * @file
 *
 *   Pattern matcher for compiling AST into efficient matching functions.
 *
 *   This module takes the parsed AST from the parser and compiles it into optimized matcher
 *   functions that can quickly determine if a URL matches a pattern and extract route
 *   parameters.
 *
 *   ## Compilation Strategy
 *
 *   The compiler generates a specialized matching function for each AST, optimizing based
 *   on the pattern structure:
 *
 *   1. **Static-only patterns**: Direct string comparison (fastest)
 *   2. **Parameter patterns**: Segment extraction with validation
 *   3. **Wildcard patterns**: Greedy or non-greedy capture
 *   4. **Mixed patterns**: Combined strategy with early exit
 *
 *   ## Performance Characteristics
 *
 *   - **Static segments**: O(1) equality check
 *   - **Parameters**: O(1) extraction + O(n) validation
 *   - **Wildcards**: O(m) where m is remaining segments
 *   - **Overall**: O(k) where k is number of URL segments
 *
 * @example
 *
 * ```ts
 * // Compile a pattern
 * const ast = parsePattern('/users/:id').ast;
 * const matcher = compileMatcher(ast);
 *
 * // Use the matcher
 * const match = matcher('/users/123');
 * if (match) {
 *   console.log(match.params); // { id: '123' }
 * }
 *
 * // Non-matching path
 * const noMatch = matcher('/posts/123');
 * console.log(noMatch); // null
 * ```
 *
 * @category Pattern Matching
 */

import type { RouteParams, RouteMatch, QueryParams } from "../types";
import type { RootNode, SegmentNode } from "./ast";

/**
 * Compile an AST into a matcher function.
 *
 * Creates an optimized function that matches URLs against the pattern represented by the
 * AST. The function returns a `RouteMatch` object with extracted parameters on success,
 * or `null` if the URL doesn't match.
 *
 * @param ast The parsed pattern AST.
 *
 * @returns Compiled matcher function.
 *
 * @example
 *
 * ```ts
 * const ast = parsePattern('/users/:id/posts/:postId').ast;
 * const matcher = compileMatcher(ast);
 *
 * const result = matcher('/users/42/posts/123');
 * // result = {
 * //   matched: true,
 * //   params: { id: '42', postId: '123' },
 * //   query: {}
 * // }
 * ```
 *
 * @category Pattern Matching
 */
export function compileMatcher(ast: RootNode): (path: string) => RouteMatch | null {
  // Handle empty pattern (root path)
  if (ast.segments.length === 0) {
    return (path: string): RouteMatch | null => {
      const normalized = normalizePath(path);
      if (normalized === "" || normalized === "/") {
        return {
          matched: true,
          params: {},
          query: {}
        };
      }
      return null;
    };
  }

  // Optimize for common patterns
  if (isStaticOnly(ast)) {
    return compileStaticMatcher(ast);
  }

  // General case: mixed pattern
  return compileGeneralMatcher(ast);
}

/**
 * Check if AST contains only static segments.
 *
 * Static-only patterns can use a faster matching strategy with direct string comparison
 * instead of segment-by-segment matching.
 *
 * @param ast The pattern AST.
 *
 * @returns Whether the pattern is static-only.
 *
 * @category Pattern Matching
 */
function isStaticOnly(ast: RootNode): boolean {
  return ast.segments.every((seg: SegmentNode) => seg.type === "static");
}

/**
 * Compile a static-only matcher.
 *
 * Optimized for patterns with no parameters or wildcards. Uses direct string comparison
 * which is significantly faster than segment-by-segment matching.
 *
 * @param ast The pattern AST (must be static-only).
 *
 * @returns Compiled static matcher.
 *
 * @category Pattern Matching
 */
function compileStaticMatcher(ast: RootNode): (path: string) => RouteMatch | null {
  // Pre-compute the expected path
  const segments = ast.segments.filter((seg: SegmentNode) => seg.type === "static");
  const expectedPath = "/" + segments.map((seg: SegmentNode) => seg.type === "static" ? seg.value : "").join("/");

  // Check if case-insensitive matching is needed
  const caseInsensitive = segments.some((seg: SegmentNode) => seg.type === "static" && seg.caseInsensitive);

  if (caseInsensitive) {
    const expectedLower = expectedPath.toLowerCase();
    return (path: string): RouteMatch | null => {
      const normalized = normalizePath(path);
      if (normalized.toLowerCase() === expectedLower) {
        return {
          matched: true,
          params: {},
          query: {}
        };
      }
      return null;
    };
  }

  // Case-sensitive static matcher (fastest path)
  return (path: string): RouteMatch | null => {
    const normalized = normalizePath(path);
    if (normalized === expectedPath) {
      return {
        matched: true,
        params: {},
        query: {}
      };
    }
    return null;
  };
}

/**
 * Compile a general matcher for mixed patterns.
 *
 * Handles patterns with any combination of static segments, parameters, and wildcards.
 * Uses segment-by-segment matching with early exit on mismatch.
 *
 * @param ast The pattern AST.
 *
 * @returns Compiled general matcher.
 *
 * @category Pattern Matching
 */
function compileGeneralMatcher(ast: RootNode): (path: string) => RouteMatch | null {
  return (path: string): RouteMatch | null => {
    const normalized = normalizePath(path);
    // Filter out empty segments from consecutive slashes
    const urlSegments = normalized.split("/").filter((seg: string) => seg !== "");
    const params: RouteParams = {};
    let segmentIndex = 0;

    for (let i = 0; i < ast.segments.length; i++) {
      const node = ast.segments[i];
      if (!node) {
        continue; // Skip undefined nodes
      }

      // Handle static segments
      if (node.type === "static") {
        if (segmentIndex >= urlSegments.length) {
          return null; // Not enough URL segments
        }

        const urlSegment = urlSegments[segmentIndex];
        if (!urlSegment) {
          return null; // Missing URL segment
        }

        const matches = node.caseInsensitive
          ? urlSegment.toLowerCase() === node.value.toLowerCase()
          : urlSegment === node.value;

        if (!matches) {
          return null; // Static segment doesn't match
        }

        segmentIndex++;
        continue;
      }

      // Handle parameter segments
      if (node.type === "parameter") {
        if (segmentIndex >= urlSegments.length) {
          if (node.optional) {
            continue; // Optional parameter can be omitted
          }
          return null; // Required parameter missing
        }

        const value = urlSegments[segmentIndex];
        if (!value) {
          return null; // Missing URL segment
        }

        // Run validation if provided
        if (node.validate && !node.validate(value)) {
          return null; // Validation failed
        }

        // Coerce type if specified
        const coercedValue = coerceValue(value, node.coerce);
        if (coercedValue === null) {
          return null; // Coercion failed
        }

        params[node.name] = coercedValue;
        segmentIndex++;
        continue;
      }

      // Handle wildcard segments
      if (node.type === "wildcard") {
        if (node.greedy) {
          // Greedy wildcard captures all remaining segments
          const remaining = urlSegments.slice(segmentIndex);
          if (node.name) {
            params[node.name] = remaining.join("/");
          }
          segmentIndex = urlSegments.length;
        } else {
          // Non-greedy wildcard captures single segment
          if (segmentIndex >= urlSegments.length) {
            return null; // No segment to capture
          }
          const segment = urlSegments[segmentIndex];
          if (!segment) {
            return null; // Missing URL segment
          }
          if (node.name) {
            params[node.name] = segment;
          }
          segmentIndex++;
        }
        continue;
      }
    }

    // Check if all URL segments were matched
    if (segmentIndex !== urlSegments.length) {
      return null; // Extra segments not matched by pattern
    }

    return {
      matched: true,
      params,
      query: {} // Query parsing happens separately
    };
  };
}

/**
 * Normalize a URL path for matching.
 *
 * Removes leading and trailing slashes to ensure consistent matching behavior. Preserves
 * the path structure for proper segment splitting.
 *
 * @param path The URL path to normalize.
 *
 * @returns Normalized path string.
 *
 * @category Pattern Matching
 */
function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "";
  }

  // Remove leading slash
  let normalized = path.startsWith("/") ? path.slice(1) : path;

  // Remove all trailing slashes
  while (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  // Add leading slash back for consistency
  return "/" + normalized;
}

/**
 * Coerce a string value to the specified type.
 *
 * Attempts to convert the string parameter value to a number or boolean based on the
 * coercion type. Returns null if coercion fails.
 *
 * @param value The string value to coerce.
 * @param type The target type ('string', 'number', or 'boolean').
 *
 * @returns Coerced value or null if coercion failed.
 *
 * @example
 *
 * ```ts
 * coerceValue('42', 'number');     // 42
 * coerceValue('true', 'boolean');  // true
 * coerceValue('hello', 'string');  // 'hello'
 * coerceValue('abc', 'number');    // null (failed)
 * ```
 *
 * @category Pattern Matching
 */
function coerceValue(
  value: string,
  type?: "string" | "number" | "boolean"
): string | number | boolean | null {
  if (!type || type === "string") {
    return value;
  }

  if (type === "number") {
    const num = Number(value);
    if (isNaN(num)) {
      return null; // Coercion failed
    }
    return num;
  }

  if (type === "boolean") {
    if (value === "true") return true;
    if (value === "false") return false;
    return null; // Coercion failed - must be explicit 'true' or 'false'
  }

  return null;
}

/**
 * Parse query string into params object.
 *
 * Extracts query parameters from a URL query string and returns them as a typed params
 * object. Handles array values (repeated params) and URL decoding.
 *
 * @param queryString The URL query string (without leading '?').
 *
 * @returns Parsed query parameters.
 *
 * @example
 *
 * ```ts
 * parseQuery('foo=bar&baz=qux');
 * // { foo: 'bar', baz: 'qux' }
 *
 * parseQuery('tags=a&tags=b&tags=c');
 * // { tags: ['a', 'b', 'c'] }
 *
 * parseQuery('search=hello%20world');
 * // { search: 'hello world' }
 * ```
 *
 * @category Pattern Matching
 */
export function parseQuery(queryString: string): QueryParams {
  const params: QueryParams = {};

  if (!queryString || queryString.length === 0) {
    return params;
  }

  // Remove leading '?' if present
  const normalized = queryString.startsWith("?") ? queryString.slice(1) : queryString;

  // Split into key-value pairs
  const pairs = normalized.split("&");

  for (const pair of pairs) {
    if (!pair) continue;

    const [key, value = ""] = pair.split("=");
    if (!key) continue;

    // Try to decode URI components, but handle malformed URIs gracefully
    let decodedKey: string;
    let decodedValue: string;

    try {
      decodedKey = decodeURIComponent(key);
    } catch (e) {
      // If decoding fails, use the raw key
      decodedKey = key;
    }

    try {
      decodedValue = decodeURIComponent(value);
    } catch (e) {
      // If decoding fails, use the raw value
      decodedValue = value;
    }

    // Handle array values (repeated params)
    if (decodedKey in params) {
      const existing = params[decodedKey];
      if (Array.isArray(existing)) {
        existing.push(decodedValue);
      } else {
        params[decodedKey] = [existing as string, decodedValue];
      }
    } else {
      params[decodedKey] = decodedValue;
    }
  }

  return params;
}

/**
 * Match a full URL against a pattern.
 *
 * Convenience function that combines path and query matching. Parses the URL, matches the
 * path against the pattern, and extracts query parameters.
 *
 * @param ast The pattern AST.
 * @param url The full URL to match.
 *
 * @returns Route match result or null.
 *
 * @example
 *
 * ```ts
 * const ast = parsePattern('/users/:id').ast;
 * const result = matchURL(ast, '/users/123?tab=posts');
 * // result = {
 * //   matched: true,
 * //   params: { id: '123' },
 * //   query: { tab: 'posts' }
 * // }
 * ```
 *
 * @category Pattern Matching
 */
export function matchURL(ast: RootNode, url: string): RouteMatch | null {
  // Parse URL to separate path and query
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");

  let path = url;
  let queryString = "";
  let hash = "";

  if (queryIndex !== -1) {
    path = url.slice(0, queryIndex);
    const afterQuery = url.slice(queryIndex + 1);
    const hashInQuery = afterQuery.indexOf("#");
    if (hashInQuery !== -1) {
      queryString = afterQuery.slice(0, hashInQuery);
      hash = afterQuery.slice(hashInQuery + 1);
    } else {
      queryString = afterQuery;
    }
  } else if (hashIndex !== -1) {
    path = url.slice(0, hashIndex);
    hash = url.slice(hashIndex + 1);
  }

  // Match the path
  const matcher = compileMatcher(ast);
  const pathMatch = matcher(path);

  if (!pathMatch) {
    return null;
  }

  // Parse query string
  const query = parseQuery(queryString);

  // Return the match with hash only if it exists
  if (hash) {
    return {
      ...pathMatch,
      query,
      hash
    };
  }

  return {
    ...pathMatch,
    query
  };
}
