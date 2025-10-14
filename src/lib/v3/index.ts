/**
 * Svelte5 Router v3 - Progressive Disclosure API
 *
 * This module provides a layered API design that enables users to start simple
 * and progressively discover advanced features as their needs grow.
 *
 * @module v3
 * @category Core
 */

// Level 1: Simple API - Just the basics
export { SimpleRouter, route } from './simple';

// Level 2: Enhanced API - More control and features
export { Router, createRouter } from './enhanced';

// Level 3: Advanced API - Full power and customization
export { AdvancedRouter, createAdvancedRouter } from './advanced';

// Core types and utilities
export * from './types';
export * from '../patterns';
export * from '../middleware';
export * from '../guards';