/**
 * @file
 *
 *   Pattern parser for converting route pattern strings into AST.
 *
 *   This module implements a single-pass parser that tokenizes route patterns and
 *   constructs an Abstract Syntax Tree without using regular expressions. The parser
 *   handles static segments, named parameters, optional parameters, and wildcards.
 *
 *   ## Parsing Algorithm
 *
 *   The parser uses a linear scan approach:
 *
 *   1. **Normalize**: Remove leading/trailing slashes and handle special cases
 *   2. **Tokenize**: Split pattern into segments by '/' delimiter
 *   3. **Classify**: Determine segment type based on first character
 *   4. **Validate**: Check for syntax errors and ambiguous patterns
 *   5. **Construct**: Build AST nodes with appropriate metadata
 *
 *   ## Time Complexity
 *
 *   - **Best Case**: O(n) where n is pattern length
 *   - **Average Case**: O(n)
 *   - **Worst Case**: O(n)
 *
 *   The parser is linear because each character is visited exactly once.
 *
 * @example
 *
 * ```ts
 * // Parse a simple static path
 * const result1 = parsePattern('/users');
 * // result1.ast.segments = [{ type: 'static', value: 'users' }]
 *
 * // Parse a path with parameters
 * const result2 = parsePattern('/users/:id/posts/:postId');
 * // result2.ast.segments = [
 * //   { type: 'static', value: 'users' },
 * //   { type: 'parameter', name: 'id' },
 * //   { type: 'static', value: 'posts' },
 * //   { type: 'parameter', name: 'postId' }
 * // ]
 *
 * // Parse a wildcard path
 * const result3 = parsePattern('/files/**');
 * // result3.ast.segments = [
 * //   { type: 'static', value: 'files' },
 * //   { type: 'wildcard', greedy: true }
 * // ]
 * ```
 *
 * @category Pattern Matching
 */

import type {
  RootNode,
  SegmentNode,
  StaticNode,
  ParameterNode,
  WildcardNode,
  PatternOptions,
  ParseResult
} from "./ast";

/**
 * Parse a route pattern string into an AST.
 *
 * Converts a pattern string like `/users/:id` into a structured AST that can be
 * efficiently compiled into a matcher function. The parser handles various pattern types
 * including static paths, parameters, optional parameters, and wildcards.
 *
 * @param pattern The pattern string to parse (e.g., '/users/:id').
 * @param options Optional parsing configuration.
 *
 * @returns Parse result containing the AST, warnings, and errors.
 *
 * @example
 *
 * ```ts
 * const result = parsePattern('/users/:id');
 * if (result.errors.length === 0) {
 *   // Use result.ast
 * }
 * ```
 *
 * @category Pattern Matching
 */
export function parsePattern(pattern: string, options?: PatternOptions): ParseResult {
  const segments: SegmentNode[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Handle empty pattern
  if (!pattern || pattern.length === 0) {
    warnings.push('Empty pattern defaults to root path "/"');
    return {
      ast: {
        type: "root",
        segments: [],
        original: pattern
      },
      warnings,
      errors
    };
  }

  // Normalize pattern by removing leading/trailing slashes
  let normalized = pattern.trim();

  // Remove leading slash
  if (normalized.startsWith("/")) {
    normalized = normalized.slice(1);
  }

  // Remove trailing slash unless strict mode
  if (!options?.strict && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  // Handle root path
  if (normalized === "" || normalized === "/") {
    return {
      ast: {
        type: "root",
        segments: [],
        original: pattern
      },
      warnings,
      errors
    };
  }

  // Split into segments
  const parts = normalized.split("/");

  // Parse each segment
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Skip undefined or empty segments (from consecutive slashes)
    if (!part || part === "") {
      warnings.push(`Empty segment at position ${i}, skipping`);
      continue;
    }

    // Parse parameter segment (starts with ':')
    if (part.startsWith(":")) {
      const param = parseParameter(part, i, warnings, errors);
      if (param) {
        segments.push(param);
      }
      continue;
    }

    // Parse wildcard segment ('*' or '**')
    if (part === "*" || part === "**") {
      const wildcard = parseWildcard(part, i, segments, warnings);
      segments.push(wildcard);

      // Wildcards should be last segment
      if (i < parts.length - 1) {
        warnings.push(
          `Wildcard at position ${i} is not the last segment. ` +
            `This may cause unexpected matching behavior.`
        );
      }
      continue;
    }

    // Parse named wildcard ('*name' or '**name')
    if (part.startsWith("*")) {
      const wildcard = parseNamedWildcard(part, i, segments, warnings);
      segments.push(wildcard);

      // Wildcards should be last segment
      if (i < parts.length - 1) {
        warnings.push(
          `Wildcard at position ${i} is not the last segment. ` +
            `This may cause unexpected matching behavior.`
        );
      }
      continue;
    }

    // Parse static segment
    const static_ = parseStatic(part, i, options);
    segments.push(static_);
  }

  // Validate the final AST
  validateAST(segments, warnings, errors);

  return {
    ast: {
      type: "root",
      segments,
      original: pattern
    },
    warnings,
    errors
  };
}

/**
 * Parse a parameter segment.
 *
 * Extracts the parameter name and checks for optional flag ('?'). Validates that the
 * parameter name is a valid JavaScript identifier.
 *
 * @param part The segment string (e.g., ':id' or ':id?').
 * @param position Position in the pattern for error reporting.
 * @param warnings Array to collect warnings.
 * @param errors Array to collect errors.
 *
 * @returns Parameter node or null if invalid.
 *
 * @category Pattern Matching
 */
function parseParameter(
  part: string,
  position: number,
  warnings: string[],
  errors: string[]
): ParameterNode | null {
  // Remove leading ':'
  let name = part.slice(1);

  // Check for optional flag
  const optional = name.endsWith("?");
  if (optional) {
    name = name.slice(0, -1);
  }

  // Validate parameter name
  if (name.length === 0) {
    errors.push(`Parameter at position ${position} has no name`);
    return null;
  }

  // Check if name is a valid identifier
  if (!isValidIdentifier(name)) {
    errors.push(`Parameter name "${name}" at position ${position} is not a valid identifier`);
    return null;
  }

  return {
    type: "parameter",
    name,
    optional
  };
}

/**
 * Parse a wildcard segment.
 *
 * Determines if the wildcard is greedy ('**') or non-greedy ('*').
 *
 * @param part The segment string ('*' or '**').
 * @param position Position in the pattern for error reporting.
 * @param segments Previously parsed segments.
 * @param warnings Array to collect warnings.
 *
 * @returns Wildcard node.
 *
 * @category Pattern Matching
 */
function parseWildcard(
  part: string,
  position: number,
  segments: SegmentNode[],
  warnings: string[]
): WildcardNode {
  const greedy = part === "**";

  // Check if there's already a wildcard
  const hasWildcard = segments.some((seg) => seg.type === "wildcard");
  if (hasWildcard) {
    warnings.push(
      `Multiple wildcards detected. Pattern has wildcard at position ${position} ` +
        `but another wildcard already exists. This may cause ambiguous matching.`
    );
  }

  return {
    type: "wildcard",
    greedy
  };
}

/**
 * Parse a named wildcard segment.
 *
 * Extracts the name from patterns like '*path' or '**rest'. The captured segments will be
 * available under this name in the params object.
 *
 * @param part The segment string (e.g., '*path').
 * @param position Position in the pattern for error reporting.
 * @param segments Previously parsed segments.
 * @param warnings Array to collect warnings.
 *
 * @returns Wildcard node with name.
 *
 * @category Pattern Matching
 */
function parseNamedWildcard(
  part: string,
  position: number,
  segments: SegmentNode[],
  warnings: string[]
): WildcardNode {
  // Check for greedy wildcard
  const greedy = part.startsWith("**");
  const name = greedy ? part.slice(2) : part.slice(1);

  // Validate name
  if (name.length === 0) {
    warnings.push(`Wildcard at position ${position} has no name, using default capture`);
  } else if (!isValidIdentifier(name)) {
    warnings.push(`Wildcard name "${name}" at position ${position} is not a valid identifier`);
  }

  // Check for duplicate wildcards
  const hasWildcard = segments.some((seg) => seg.type === "wildcard");
  if (hasWildcard) {
    warnings.push(
      `Multiple wildcards detected. Pattern has wildcard at position ${position} ` +
        `but another wildcard already exists. This may cause ambiguous matching.`
    );
  }

  const result: WildcardNode = {
    type: "wildcard",
    greedy
  };

  if (name) {
    result.name = name;
  }

  return result;
}

/**
 * Parse a static segment.
 *
 * Static segments match literal strings in the URL. They can be configured for
 * case-insensitive matching.
 *
 * @param part The segment string.
 * @param position Position in the pattern for error reporting.
 * @param options Parsing options.
 *
 * @returns Static node.
 *
 * @category Pattern Matching
 */
function parseStatic(part: string, position: number, options?: PatternOptions): StaticNode {
  const result: StaticNode = {
    type: "static",
    value: part
  };

  if (options?.caseInsensitive !== undefined) {
    result.caseInsensitive = options.caseInsensitive;
  }

  return result;
}

/**
 * Validate the complete AST.
 *
 * Checks for common issues like duplicate parameter names, multiple wildcards, or
 * ambiguous patterns.
 *
 * @param segments The parsed segments.
 * @param warnings Array to collect warnings.
 * @param errors Array to collect errors.
 *
 * @category Pattern Matching
 */
function validateAST(segments: SegmentNode[], warnings: string[], errors: string[]): void {
  const paramNames = new Set<string>();

  for (const segment of segments) {
    if (segment.type === "parameter") {
      // Check for duplicate parameter names
      if (paramNames.has(segment.name)) {
        errors.push(`Duplicate parameter name: "${segment.name}"`);
      }
      paramNames.add(segment.name);
    }

    if (segment.type === "wildcard" && segment.name) {
      // Check for wildcard name conflicts with parameters
      if (paramNames.has(segment.name)) {
        errors.push(`Wildcard name "${segment.name}" conflicts with parameter name`);
      }
      paramNames.add(segment.name);
    }
  }

  // Check for patterns that might be ambiguous
  const hasOptional = segments.some((seg) => seg.type === "parameter" && seg.optional);
  const hasWildcard = segments.some((seg) => seg.type === "wildcard");

  if (hasOptional && hasWildcard) {
    warnings.push(
      "Pattern contains both optional parameters and wildcards. " +
        "This may cause ambiguous matching behavior."
    );
  }
}

/**
 * Check if a string is a valid JavaScript identifier.
 *
 * A valid identifier must start with a letter, underscore, or dollar sign, and can
 * contain letters, numbers, underscores, or dollar signs.
 *
 * @param name The string to validate.
 *
 * @returns Whether the string is a valid identifier.
 *
 * @category Pattern Matching
 */
function isValidIdentifier(name: string): boolean {
  if (name.length === 0) {
    return false;
  }

  // Check first character: must be letter, underscore, or dollar sign
  const first = name.charCodeAt(0);
  const isFirstValid =
    (first >= 65 && first <= 90) || // A-Z
    (first >= 97 && first <= 122) || // a-z
    first === 95 || // _
    first === 36; // $

  if (!isFirstValid) {
    return false;
  }

  // Check remaining characters: letters, numbers, underscore, or dollar sign
  for (let i = 1; i < name.length; i++) {
    const code = name.charCodeAt(i);
    const isValid =
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122) || // a-z
      (code >= 48 && code <= 57) || // 0-9
      code === 95 || // _
      code === 36; // $

    if (!isValid) {
      return false;
    }
  }

  return true;
}
