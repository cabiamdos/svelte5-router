/**
 * AST-based pattern parser
 * Converts route patterns into abstract syntax trees for efficient matching
 *
 * @module patterns/parser
 * @category Core
 */

import type { PatternAST, PatternSegment, PatternOptions } from './types';

/**
 * Parse a route pattern into an AST
 */
export function parsePattern(pattern: string, options: PatternOptions = {}): PatternAST {
  if (!pattern || pattern === '/') {
    return {
      segments: [{ type: 'literal', value: '/' }],
      paramNames: [],
      hasWildcard: false,
      hasOptional: false,
      source: pattern || '/'
    };
  }

  // Normalize pattern to start with /
  const normalizedPattern = pattern.startsWith('/') ? pattern : `/${pattern}`;

  const segments: PatternSegment[] = [];
  const paramNames: string[] = [];
  let hasWildcard = false;
  let hasOptional = false;

  // Split by / and process each segment
  const parts = normalizedPattern.split('/').filter(Boolean);

  for (const part of parts) {
    const segment = parseSegment(part);
    segments.push(segment);

    if (segment.name) {
      paramNames.push(segment.name);
    }

    if (segment.type === 'wildcard') {
      hasWildcard = true;
    }

    if (segment.optional) {
      hasOptional = true;
    }
  }

  return {
    segments,
    paramNames,
    hasWildcard,
    hasOptional,
    source: normalizedPattern
  };
}

/**
 * Parse a single pattern segment
 */
function parseSegment(segment: string): PatternSegment {
  // Handle optional segments (ending with ?)
  const isOptional = segment.endsWith('?');
  const cleanSegment = isOptional ? segment.slice(0, -1) : segment;

  // Handle wildcards
  if (cleanSegment === '*') {
    return {
      type: 'wildcard',
      value: cleanSegment,
      optional: isOptional,
      greedy: false
    };
  }

  if (cleanSegment === '**') {
    return {
      type: 'wildcard',
      value: cleanSegment,
      optional: isOptional,
      greedy: true
    };
  }

  // Handle parameters (:name or :name(constraint))
  if (cleanSegment.startsWith(':')) {
    return parseParameter(cleanSegment, isOptional);
  }

  // Handle groups (alternative|patterns)
  if (cleanSegment.includes('|')) {
    return {
      type: 'group',
      value: cleanSegment,
      optional: isOptional
    };
  }

  // Default to literal segment
  return {
    type: 'literal',
    value: cleanSegment,
    optional: isOptional
  };
}

/**
 * Parse a parameter segment
 */
function parseParameter(segment: string, optional: boolean): PatternSegment {
  const withoutColon = segment.slice(1); // Remove :

  // Check for constraint: :id(\\d+)
  const constraintMatch = withoutColon.match(/^([^(]+)\((.+)\)$/);

  if (constraintMatch) {
    const [, name, constraint] = constraintMatch;
    return {
      type: 'parameter',
      value: segment,
      name,
      constraint,
      optional
    };
  }

  return {
    type: 'parameter',
    value: segment,
    name: withoutColon,
    optional
  };
}

/**
 * Compile a pattern string into a reusable matcher
 */
export function compilePattern(pattern: string, options: PatternOptions = {}): PatternAST {
  return parsePattern(pattern, options);
}