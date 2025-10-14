/**
 * AST-based pattern matcher
 * Efficiently matches URLs against compiled pattern ASTs
 *
 * @module patterns/matcher
 * @category Core
 */

import type { PatternAST, PatternMatch, PatternSegment } from './types';

/**
 * Match a path against a compiled pattern AST
 */
export function matchPattern(ast: PatternAST, path: string): PatternMatch {
  // Normalize path
  const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');

  if (normalizedPath === '/' && ast.segments.length === 1 && ast.segments[0]?.value === '/') {
    return {
      matched: true,
      params: {},
      exact: true
    };
  }

  const pathSegments = normalizedPath === '/' ? [] : normalizedPath.split('/').filter(Boolean);
  const params: Record<string, string> = {};

  let pathIndex = 0;
  let segmentIndex = 0;

  while (segmentIndex < ast.segments.length && pathIndex <= pathSegments.length) {
    const segment = ast.segments[segmentIndex];
    const pathSegment = pathSegments[pathIndex];

    if (!segment) break;

    const result = matchSegment(segment, pathSegment, pathSegments.slice(pathIndex));

    if (!result.matched) {
      if (segment.optional) {
        // Skip optional segment and continue
        segmentIndex++;
        continue;
      } else {
        // Required segment didn't match
        return {
          matched: false,
          params: {},
          exact: false
        };
      }
    }

    if (result.param) {
      params[result.param.name] = result.param.value;
    }

    pathIndex += result.consumed;
    segmentIndex++;

    // Handle greedy wildcards
    if (segment.type === 'wildcard' && segment.greedy) {
      // Consume all remaining path segments
      const remaining = pathSegments.slice(pathIndex).join('/');
      if (segment.name) {
        params[segment.name] = remaining;
      }
      pathIndex = pathSegments.length;
      break;
    }
  }

  // Check if we matched the entire path
  const exactMatch = pathIndex === pathSegments.length && segmentIndex === ast.segments.length;

  // Handle trailing optional segments
  if (!exactMatch && segmentIndex < ast.segments.length) {
    const remainingSegments = ast.segments.slice(segmentIndex);
    const allOptional = remainingSegments.every(seg => seg.optional);

    if (allOptional) {
      return {
        matched: true,
        params,
        exact: pathIndex === pathSegments.length
      };
    }
  }

  const matched = exactMatch || (pathIndex === pathSegments.length && ast.hasWildcard);

  return {
    matched,
    params,
    exact: exactMatch,
    remaining: pathIndex < pathSegments.length ? pathSegments.slice(pathIndex).join('/') : undefined
  };
}

/**
 * Match a single segment
 */
function matchSegment(
  segment: PatternSegment,
  pathSegment: string | undefined,
  remainingPath: string[]
): { matched: boolean; consumed: number; param?: { name: string; value: string } } {
  switch (segment.type) {
    case 'literal':
      if (pathSegment === segment.value) {
        return { matched: true, consumed: 1 };
      }
      return { matched: false, consumed: 0 };

    case 'parameter':
      if (pathSegment === undefined) {
        return { matched: false, consumed: 0 };
      }

      // Check constraint if present
      if (segment.constraint && !matchConstraint(pathSegment, segment.constraint)) {
        return { matched: false, consumed: 0 };
      }

      return {
        matched: true,
        consumed: 1,
        param: segment.name ? { name: segment.name, value: pathSegment } : undefined
      };

    case 'wildcard':
      if (segment.greedy) {
        // Match all remaining segments
        return {
          matched: true,
          consumed: remainingPath.length,
          param: segment.name ? { name: segment.name, value: remainingPath.join('/') } : undefined
        };
      } else {
        // Match single segment
        if (pathSegment !== undefined) {
          return {
            matched: true,
            consumed: 1,
            param: segment.name ? { name: segment.name, value: pathSegment } : undefined
          };
        }
        return { matched: false, consumed: 0 };
      }

    case 'group':
      if (pathSegment === undefined) {
        return { matched: false, consumed: 0 };
      }

      const alternatives = segment.value.split('|');
      for (const alt of alternatives) {
        if (pathSegment === alt) {
          return { matched: true, consumed: 1 };
        }
      }
      return { matched: false, consumed: 0 };

    default:
      return { matched: false, consumed: 0 };
  }
}

/**
 * Check if a value matches a constraint pattern
 */
function matchConstraint(value: string, constraint: string): boolean {
  // Simple constraint patterns
  switch (constraint) {
    case '\\d+':
      return /^\d+$/.test(value);
    case '\\w+':
      return /^\w+$/.test(value);
    case '[a-z]+':
      return /^[a-z]+$/.test(value);
    case '[A-Z]+':
      return /^[A-Z]+$/.test(value);
    default:
      // For more complex constraints, we could expand this
      return true;
  }
}