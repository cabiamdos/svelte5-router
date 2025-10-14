# V3 Architecture Overview

**Date**: October 13, 2025 **Version**: v3.0.0 **Status**: Architecture Design

## Executive Summary

The v3 router architecture represents a complete reimagining of the
svelte5-router with a focus on **progressive disclosure**, **runtime
flexibility**, and **production-grade performance**. The architecture uses a
layered design that enables developers to start simple and progressively adopt
advanced features as their needs evolve.

## Core Design Principles

### 1. Progressive Disclosure

The API is structured in three distinct layers, each building upon the previous:

- **Simple Layer**: For basic SPA routing with minimal configuration
- **Enhanced Layer**: Adds middleware, guards, and lifecycle hooks
- **Advanced Layer**: Full control with custom matchers, SSR/SSG adapters, and
  performance optimizations

### 2. Runtime Agnostic

The router supports multiple runtime environments through an adapter pattern:

- **SPA Mode**: Client-side routing with browser History API
- **SSR Mode**: Server-side rendering with hydration support
- **SSG Mode**: Static site generation with optional rehydration

### 3. Type-Safe by Default

Every layer provides complete TypeScript support with:

- Strict mode compliance (no `any` types)
- Generic type parameters for route params
- Compile-time route validation where possible
- Runtime type guards for dynamic scenarios

### 4. Zero Dependencies

The entire router is built with pure TypeScript and Svelte 5:

- No third-party runtime dependencies
- AST-based pattern matching (no regex libraries)
- Native browser APIs only
- Minimal bundle size (<50KB minified)

## Architecture Layers

### Layer 1: Core Runtime

The foundation layer provides runtime adapters and primitive operations:

```
v3/src/runtime/
├── adapter.ts          # Base adapter interface
├── spa-adapter.ts      # Browser History API adapter
├── ssr-adapter.ts      # Server-side rendering adapter
├── ssg-adapter.ts      # Static generation adapter
└── memory-adapter.ts   # In-memory adapter for testing
```

**Responsibilities**:

- Environment detection and initialization
- History management and navigation
- URL parsing and manipulation
- Event system for navigation lifecycle

### Layer 2: Pattern Matching

AST-based pattern matching without regular expressions:

```
v3/src/patterns/
├── ast.ts              # AST node definitions
├── parser.ts           # Pattern string → AST parser
├── matcher.ts          # AST → URL matcher
├── compiler.ts         # AST → optimized matcher
└── params.ts           # Parameter extraction and validation
```

**Responsibilities**:

- Parse route patterns into AST nodes
- Compile AST into optimized matchers
- Extract and validate route parameters
- Support named params and wildcards

### Layer 3: State Management

Reactive state using Svelte 5 runes:

```
v3/src/state/
├── router-state.svelte.ts    # Core router state ($state)
├── navigation.svelte.ts      # Navigation state machine
├── history.svelte.ts         # History tracking
└── context.svelte.ts         # Routing context
```

**Responsibilities**:

- Manage current route state with $state
- Track navigation history
- Provide reactive route context
- Handle state persistence

### Layer 4: Middleware & Guards

Extensible middleware pipeline and route guards:

```
v3/src/middleware/
├── pipeline.ts         # Middleware execution pipeline
├── context.ts          # Middleware context
├── builtin.ts          # Built-in middleware
└── types.ts            # Middleware type definitions

v3/src/guards/
├── manager.ts          # Guard execution manager
├── builtin.ts          # Built-in guards
└── types.ts            # Guard type definitions
```

**Responsibilities**:

- Execute middleware in sequence
- Evaluate route guards
- Provide request/response context
- Handle async operations

### Layer 5: API Layers

Three progressively powerful API layers:

```
v3/src/api/
├── simple/
│   ├── router.svelte       # Simple router component
│   ├── types.ts            # Simple API types
│   └── utilities.ts        # Helper functions
├── enhanced/
│   ├── router.svelte       # Enhanced router component
│   ├── types.ts            # Enhanced API types
│   └── utilities.ts        # Helper functions
└── advanced/
    ├── router.svelte       # Advanced router component
    ├── types.ts            # Advanced API types
    └── utilities.ts        # Helper functions
```

**Responsibilities**:

- Expose appropriate API surface for each layer
- Maintain backwards compatibility
- Provide clear upgrade paths
- Balance simplicity with power

## Data Flow Architecture

### SPA Navigation Flow

```
User Action (click/programmatic)
  ↓
Browser History API
  ↓
History Event Listener
  ↓
Router State Update ($state)
  ↓
Middleware Pipeline Execution
  ↓
Route Guard Evaluation
  ↓
Pattern Matching (AST)
  ↓
Component Resolution
  ↓
Pre-navigation Hooks
  ↓
Component Render
  ↓
Post-navigation Hooks
```

### SSR Rendering Flow

```
Server Request
  ↓
SSR Adapter Initialization
  ↓
Route Resolution (synchronous)
  ↓
Middleware Pipeline (SSR context)
  ↓
Guard Evaluation (SSR context)
  ↓
Component Resolution
  ↓
Server-Side Render
  ↓
HTML + Hydration Data
  ↓
Client Hydration
  ↓
SPA Mode Activation
```

### SSG Build Flow

```
Build Process Start
  ↓
SSG Adapter Initialization
  ↓
Route Discovery/Manifest
  ↓
For Each Route:
  ├─ Resolve Route Pattern
  ├─ Generate Route Params
  ├─ Execute Middleware
  ├─ Render Component
  └─ Write Static HTML
  ↓
Generate Hydration Bundles
  ↓
Output Static Files
```

## State Management Strategy

### Reactive State with Runes

All state management uses Svelte 5 runes exclusively:

```typescript
// Core router state
class RouterState {
  // Current route (reactive)
  current = $state<Route | undefined>(undefined);

  // Navigation state
  navigating = $state<boolean>(false);

  // Derived route information
  params = $derived(() => this.current?.params ?? {});
  query = $derived(() => this.current?.query ?? {});

  // Navigation effects
  navigationEffect = $effect(() => {
    if (this.navigating) {
      // Handle navigation lifecycle
    }
  });
}
```

### State Persistence

Optional state persistence through adapters:

- **Local Storage**: Persist route state across sessions
- **Session Storage**: Persist within current session
- **Memory**: No persistence (default)

## Pattern Matching Architecture

### AST-Based Parsing

Route patterns are parsed into an Abstract Syntax Tree instead of using regular
expressions:

```typescript
// Pattern: "/users/:id/posts/:postId"
// AST:
{
  type: "Root",
  segments: [
    { type: "Static", value: "users" },
    { type: "Parameter", name: "id" },
    { type: "Static", value: "posts" },
    { type: "Parameter", name: "postId" }
  ]
}

// Pattern: "/api/*/data"
// AST:
{
  type: "Root",
  segments: [
    { type: "Static", value: "api" },
    { type: "Wildcard" },
    { type: "Static", value: "data" }
  ]
}
```

### Matcher Compilation

AST nodes compile into optimized matcher functions:

```typescript
// Compiled matcher for "/users/:id"
const matcher = (path: string): MatchResult => {
  const segments = path.split("/").filter(Boolean);

  if (segments.length !== 2) return null;
  if (segments[0] !== "users") return null;

  return {
    matched: true,
    params: { id: segments[1] }
  };
};
```

### Performance Characteristics

- **Pattern Parsing**: O(n) where n = pattern length
- **Matcher Compilation**: O(n) where n = pattern segments
- **Route Matching**: O(m) where m = URL segments
- **Overall Complexity**: O(n + m) vs O(n \* m) for regex

## Middleware System

### Pipeline Architecture

Middleware executes in a predictable, linear pipeline:

```typescript
type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<void>
) => Promise<void>;

// Execution flow
async function executePipeline(
  middleware: MiddlewareFunction[],
  context: MiddlewareContext
): Promise<void> {
  let index = 0;

  const next = async () => {
    if (index < middleware.length) {
      const fn = middleware[index++];
      await fn(context, next);
    }
  };

  await next();
}
```

### Built-in Middleware

- **Logger**: Log navigation events
- **Timing**: Track navigation performance
- **Auth**: Authentication checks
- **Cache**: Route-level caching

## Route Guards

### Guard System

Guards provide route-level access control:

```typescript
type GuardFunction = (context: GuardContext) => boolean | Promise<boolean>;

// Example guard
const authGuard: GuardFunction = (context) => {
  return context.user?.isAuthenticated ?? false;
};
```

### Guard Execution

Guards execute before route resolution:

1. **Pre-navigation**: Check if navigation is allowed
2. **Async Support**: Guards can be async
3. **Short-circuit**: First failed guard stops navigation
4. **Redirect**: Guards can redirect to different routes

## Component Architecture

### Component Types

The router supports multiple component patterns:

1. **Regular Components**: Standard Svelte components
2. **Async Components**: Dynamic imports for code splitting
3. **Snippets**: Svelte 5 snippets for inline routes

```typescript
// Regular component
{ path: '/home', component: HomePage }

// Async component
{ path: '/dashboard', component: () => import('./Dashboard.svelte') }

// Snippet
{ path: '/about', snippet: aboutSnippet }
```

### Component Resolution

Component resolution follows this priority:

1. Check for explicit component
2. Check for snippet
3. Check for children (nested routes)
4. Fallback to default/404

## Testing Strategy

### Unit Tests

Each module has corresponding unit tests:

```
v3/test/unit/
├── runtime/
├── patterns/
├── state/
├── middleware/
├── guards/
└── api/
```

### Integration Tests

Full routing scenarios in SvelteKit environment:

```
v3/test/integration/
├── spa-routing.test.ts
├── ssr-routing.test.ts
├── ssg-routing.test.ts
├── nested-routing.test.ts
└── navigation.test.ts
```

### Test Requirements

- **Coverage**: >90% code coverage required
- **No Mocks**: Use real implementations, no mocking
- **Vitest**: All tests use Vitest
- **Table-Driven**: Use `test.each` for variations

## Performance Targets

### Bundle Size

- **Simple API**: <15KB minified
- **Enhanced API**: <30KB minified
- **Advanced API**: <50KB minified
- **Tree-shaking**: Unused features excluded

### Runtime Performance

- **Route Resolution**: <1ms typical, <10ms p99
- **Pattern Compilation**: <5ms per pattern
- **Navigation**: <16ms (1 frame) for transitions
- **Memory**: <5MB for 1000 routes

### Build Performance

- **SSG Generation**: <1s per 100 routes
- **Type Generation**: <5s for full manifest
- **Hot Reload**: <100ms for route changes

## Security Considerations

### Input Validation

All route parameters and queries are validated:

- **Type checking**: Ensure correct parameter types
- **Sanitization**: Remove malicious input
- **Encoding**: Proper URL encoding/decoding

### XSS Prevention

- **Parameter escaping**: All params escaped by default
- **Safe navigation**: URL validation before navigation
- **Component safety**: Secure dynamic imports

### CSRF Protection

- **Integration points**: Hooks for CSRF token injection
- **State validation**: Verify state tokens on navigation

## Migration Strategy

### From v2 to v3

Migration path from existing v2 router:

1. **Simple API**: Drop-in replacement for basic routes
2. **Enhanced API**: Map v2 hooks to v3 middleware
3. **Advanced API**: Manual migration for custom features

### Breaking Changes

- **Runes only**: No legacy reactive syntax
- **AST patterns**: Different pattern syntax
- **TypeScript**: Strict mode required

## Next Steps

### Phase 1: Core Implementation (Weeks 1-2)

- [ ] Implement runtime adapters
- [ ] Build AST pattern parser
- [ ] Create state management layer
- [ ] Write comprehensive unit tests

### Phase 2: Middleware & Guards (Week 3)

- [ ] Implement middleware pipeline
- [ ] Build guard system
- [ ] Create built-in middleware/guards
- [ ] Integration tests

### Phase 3: API Layers (Week 4)

- [ ] Build Simple API
- [ ] Build Enhanced API
- [ ] Build Advanced API
- [ ] Component integration

### Phase 4: SSR/SSG Support (Week 5)

- [ ] SSR adapter implementation
- [ ] SSG adapter implementation
- [ ] Hydration support
- [ ] Build tooling

### Phase 5: Documentation & Polish (Week 6)

- [ ] API documentation
- [ ] Migration guide
- [ ] Example applications
- [ ] Performance benchmarks

## Success Metrics

- **Type Safety**: 100% TypeScript strict mode
- **Test Coverage**: >90% code coverage
- **Performance**: Meet all performance targets
- **Bundle Size**: <50KB for full feature set
- **Developer Experience**: Positive community feedback
