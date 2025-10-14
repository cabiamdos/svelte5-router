/**
 * Core type definitions for v3 router architecture
 *
 * @module v3/types
 * @category Core
 */

import type { Component, Snippet } from 'svelte';
import type { PatternAST } from '../patterns';
import type { MiddlewareFunction } from '../middleware';
import type { GuardFunction } from '../guards';

/**
 * Simple route configuration for basic use cases
 */
export interface SimpleRouteConfig {
  /** Route path pattern */
  path?: string;
  /** Component to render */
  component?: Component<any> | (() => Promise<Component<any>>);
  /** Svelte snippet to render */
  snippet?: Snippet;
}

/**
 * Enhanced route configuration with more options
 */
export interface EnhancedRouteConfig extends SimpleRouteConfig {
  /** Route name for identification */
  name?: string;
  /** Props to pass to component */
  props?: Record<string, any>;
  /** Nested child routes */
  children?: EnhancedRouteConfig[];
  /** Route-specific middleware */
  middleware?: MiddlewareFunction[];
  /** Route guards */
  guards?: GuardFunction[];
}

/**
 * Advanced route configuration with full customization
 */
export interface AdvancedRouteConfig extends EnhancedRouteConfig {
  /** Compiled pattern AST for performance */
  compiledPattern?: PatternAST;
  /** Custom route matcher */
  matcher?: (path: string) => boolean;
  /** Route metadata */
  meta?: Record<string, any>;
  /** Lazy loading configuration */
  lazy?: {
    preload?: boolean;
    timeout?: number;
    retry?: number;
  };
  /** Animation configuration */
  animation?: {
    enter?: string;
    exit?: string;
    duration?: number;
  };
}

/**
 * Router configuration options
 */
export interface RouterConfig {
  /** Base path for all routes */
  basePath?: string;
  /** Router instance ID */
  id?: string;
  /** Global middleware */
  middleware?: MiddlewareFunction[];
  /** Global guards */
  guards?: GuardFunction[];
  /** Hash routing mode */
  hash?: boolean;
  /** History mode configuration */
  history?: {
    mode: 'browser' | 'memory';
    base?: string;
  };
}

/**
 * Navigation options
 */
export interface NavigationOptions {
  /** Replace current history entry instead of pushing */
  replace?: boolean;
  /** Additional state to store with navigation */
  state?: any;
  /** Skip guards for this navigation */
  skipGuards?: boolean;
  /** Skip middleware for this navigation */
  skipMiddleware?: boolean;
}

/**
 * Route match result
 */
export interface RouteMatch {
  /** Whether the route matched */
  matched: boolean;
  /** Extracted parameters */
  params: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** Matched route configuration */
  route?: AdvancedRouteConfig;
  /** Remaining unmatched path */
  remaining?: string;
}