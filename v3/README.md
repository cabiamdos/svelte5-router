# Svelte5 Router v3 Architecture

**Version**: 3.0.0 **Status**: Architecture Complete **Date**: October 13, 2025

## Overview

Welcome to the v3 architecture for `@mateothegreat/svelte5-router`. This
represents a complete reimagining of the router with a focus on **progressive
disclosure**, **runtime flexibility**, and **production-grade performance**.

The v3 architecture is designed to support:

- **SPA (Single Page Applications)**: Client-side routing with browser History
  API
- **SSR (Server-Side Rendering)**: Server-rendered routes with client hydration
- **SSG (Static Site Generation)**: Pre-rendered static sites with optional
  rehydration

## Architecture Philosophy

### Progressive Disclosure

The API is structured in three layers, each building upon the previous:

```
Simple API (Level 1)
  ↓ add middleware & guards
Enhanced API (Level 2)
  ↓ add custom matchers & SSR/SSG
Advanced API (Level 3)
```

You start with the **Simple API** for basic routing, then progressively adopt
advanced features as your needs grow. This approach ensures a gentle learning
curve while providing power when needed.

### Type-Safe by Default

Every layer provides complete TypeScript support with strict mode compliance. No
`any` types, ever. The type system guides you through the API and catches errors
at compile time.

### Zero Dependencies

The entire router is built with pure TypeScript and Svelte 5. No third-party
runtime dependencies. This ensures:

- Minimal bundle size (<50KB for full feature set)
- No dependency conflicts
- Complete control over behavior
- Easy debugging and maintenance

### AST-Based Pattern Matching

Instead of regular expressions (which are explicitly forbidden), the router uses
Abstract Syntax Trees for pattern matching. This provides:

- **O(n) complexity**: Linear time matching vs O(n\*m) for regex
- **Type safety**: Pattern structure is validated at compile time
- **Debuggability**: AST structure is easy to inspect and understand
- **Extensibility**: New pattern types can be added without breaking changes

## Directory Structure

```
v3/
├── src/                      # Source code
│   ├── runtime/             # Runtime adapters (SPA/SSR/SSG)
│   ├── patterns/            # AST pattern matching
│   ├── state/               # Reactive state management
│   ├── middleware/          # Middleware pipeline
│   ├── guards/              # Route guards
│   ├── api/                 # Progressive API layers
│   │   ├── simple/         # Level 1: Simple API
│   │   ├── enhanced/       # Level 2: Enhanced API
│   │   └── advanced/       # Level 3: Advanced API
│   └── types.ts            # Core type definitions
├── test/                    # Test suites
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
└── docs/                    # Documentation
    ├── 2025-10-13-architecture-overview.md
    └── 2025-10-13-implementation-patterns.md
```

## Core Components

### 1. Type System (`src/types.ts`)

Comprehensive type definitions for all layers:

- **Route configurations**: `SimpleRouteConfig`, `EnhancedRouteConfig`,
  `AdvancedRouteConfig`
- **Navigation types**: `NavigationOptions`, `NavigationDirection`,
  `NavigationState`
- **Context types**: `MiddlewareContext`, `GuardContext`, `HookContext`
- **Runtime types**: `RuntimeAdapter`, `RuntimeMode`

### 2. Pattern Matching (`src/patterns/`)

AST-based pattern parsing and matching:

- **AST Types** (`ast.ts`): Node definitions for route patterns
- **Parser** (`parser.ts`): Convert pattern strings to AST
- **Matcher** (`matcher.ts`): Compile AST to efficient matchers
- **Compiler** (`compiler.ts`): Optimize matchers with caching

Pattern syntax examples:

```typescript
"/users"; // Static path
"/users/:id"; // Named parameter
"/users/:id?"; // Optional parameter
"/users/:id/posts/*"; // Wildcard
"/files/**"; // Greedy wildcard
```

### 3. Runtime Adapters (`src/runtime/`)

Environment-specific implementations:

- **SPA Adapter** (`spa-adapter.ts`): Browser History API
- **SSR Adapter** (`ssr-adapter.ts`): Server-side rendering
- **SSG Adapter** (`ssg-adapter.ts`): Static generation
- **Memory Adapter** (`memory-adapter.ts`): Testing

All adapters implement the same `RuntimeAdapter` interface, making the router
truly universal.

### 4. State Management (`src/state/`)

Reactive state using Svelte 5 runes:

- **Router State** (`router-state.svelte.ts`): Core state with `$state`
- **Navigation** (`navigation.svelte.ts`): Navigation state machine
- **History** (`history.svelte.ts`): History tracking
- **Context** (`context.svelte.ts`): Routing context

All state management uses Svelte 5 runes exclusively: `$state`, `$derived`, and
`$effect`.

### 5. Middleware & Guards (`src/middleware/`, `src/guards/`)

Extensible pipeline for route processing:

- **Middleware Pipeline**: Sequential async execution
- **Built-in Middleware**: Logging, timing, authentication
- **Route Guards**: Access control and authorization
- **Built-in Guards**: Authentication, permissions, validation

### 6. Progressive API Layers (`src/api/`)

Three levels of API complexity:

#### Level 1: Simple API

For basic SPAs without complex requirements:

```typescript
import { SimpleRouter } from "@mateothegreat/svelte5-router/v3";

const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
  { path: "/contact", component: Contact }
];
```

```svelte
<SimpleRouter {routes} />
```

#### Level 2: Enhanced API

Add middleware, guards, and lifecycle hooks:

```typescript
import { Router, createRouter } from "@mateothegreat/svelte5-router/v3";

const routes = [
  {
    path: "/dashboard",
    component: Dashboard,
    middleware: [authMiddleware],
    guards: [loginGuard],
    meta: { requiresAuth: true },
    hooks: {
      beforeEnter: () => console.log("Entering dashboard")
    }
  }
];
```

```svelte
<Router {routes} />
```

#### Level 3: Advanced API

Full customization with SSR/SSG support:

```typescript
import {
  AdvancedRouter,
  createAdvancedRouter
} from "@mateothegreat/svelte5-router/v3";

const routes = [
  {
    path: "/users/:id",
    component: () => import("./UserProfile.svelte"),
    middleware: [authMiddleware, loggingMiddleware],
    guards: [adminGuard],
    matcher: customMatcher,
    lazy: { preload: true, timeout: 5000 },
    animation: { enter: "fade-in", exit: "fade-out", duration: 300 },
    ssr: { prerender: true, hydrate: true }
  }
];
```

```svelte
<AdvancedRouter {routes} />
```

## Design Principles

### 1. Svelte 5 Runes Only

All reactive state uses Svelte 5 runes:

```typescript
// ✅ CORRECT
class RouterState {
  current = $state<Route | undefined>(undefined);
  params = $derived(() => this.current?.params ?? {});

  constructor() {
    $effect(() => {
      // Side effects here
    });
  }
}

// ❌ FORBIDDEN
let current: Route;
$: params = current?.params; // Legacy syntax
onMount(() => {
  /* ... */
}); // Legacy lifecycle
```

### 2. No Regular Expressions

Pattern matching uses AST instead:

```typescript
// ✅ CORRECT: AST-based parsing
const pattern = parsePattern("/users/:id");
const matcher = compileMatcher(pattern.ast);

// ❌ FORBIDDEN: Regular expressions
const regex = /\/users\/(\d+)/; // Don't use this
```

### 3. Type Safety

Strict TypeScript mode, no `any` types:

```typescript
// ✅ CORRECT
function navigate(path: string, options?: NavigationOptions): void {
  // Implementation
}

// ❌ FORBIDDEN
function navigate(path: any, options: any): any {
  // Don't use any
}
```

### 4. Progressive Enhancement

Start simple, add complexity as needed:

```typescript
// Start with Simple API
const routes = [{ path: "/", component: Home }];

// Upgrade to Enhanced API when needed
const routes = [
  {
    path: "/",
    component: Home,
    middleware: [authMiddleware]
  }
];

// Use Advanced API for full control
const routes = [
  {
    path: "/",
    component: Home,
    middleware: [authMiddleware],
    ssr: { prerender: true }
  }
];
```

## Getting Started

### For Implementation

1. **Read the Architecture**:
   - Start with
     [`docs/2025-10-13-architecture-overview.md`](./docs/2025-10-13-architecture-overview.md)
   - Review
     [`docs/2025-10-13-implementation-patterns.md`](./docs/2025-10-13-implementation-patterns.md)

2. **Understand the Type System**:
   - Review [`src/types.ts`](./src/types.ts) for core types
   - Review [`src/patterns/ast.ts`](./src/patterns/ast.ts) for pattern types

3. **Follow the Implementation Order**:

   ```
   Phase 1: Core Runtime
     ├── Runtime adapters
     ├── Pattern parsing
     └── Basic state management

   Phase 2: Middleware & Guards
     ├── Pipeline execution
     ├── Built-in middleware
     └── Guard system

   Phase 3: API Layers
     ├── Simple API
     ├── Enhanced API
     └── Advanced API

   Phase 4: SSR/SSG
     ├── SSR adapter
     ├── SSG adapter
     └── Hydration support
   ```

4. **Write Tests First**:
   - Every module must have >90% test coverage
   - No mocking allowed - use real implementations
   - Use Vitest with `@testing-library/svelte`

### For Users

Once implementation is complete, users will:

1. **Install the package**:

   ```bash
   npm install @mateothegreat/svelte5-router@3
   ```

2. **Choose their API level**:

   ```typescript
   // Level 1: Simple
   import { SimpleRouter } from "@mateothegreat/svelte5-router/v3/simple";

   // Level 2: Enhanced
   import { Router } from "@mateothegreat/svelte5-router/v3/enhanced";

   // Level 3: Advanced
   import { AdvancedRouter } from "@mateothegreat/svelte5-router/v3/advanced";
   ```

3. **Define routes**:

   ```typescript
   const routes = [
     { path: "/", component: Home },
     { path: "/about", component: About }
   ];
   ```

4. **Use the router component**:

   ```svelte
   <script>
     import { SimpleRouter } from "@mateothegreat/svelte5-router/v3/simple";
   </script>

   <SimpleRouter {routes} />
   ```

## Performance Targets

- **Bundle Size**: <50KB minified for full feature set
- **Route Resolution**: <1ms typical, <10ms p99
- **Pattern Compilation**: <5ms per pattern
- **Navigation**: <16ms (1 frame) for transitions
- **Memory**: <5MB for 1000 routes
- **SSG Generation**: <1s per 100 routes

## Testing Requirements

- **Coverage**: >90% code coverage required
- **No Mocks**: Use real implementations, no mocking
- **Vitest**: All tests use Vitest
- **Testing Library**: Use `@testing-library/svelte`
- **Table-Driven**: Use `test.each` for variations

## Documentation

### Architecture Documents

- [**Architecture Overview**](./docs/2025-10-13-architecture-overview.md):
  Complete system design
- [**Implementation Patterns**](./docs/2025-10-13-implementation-patterns.md):
  Code patterns and examples

### API Documentation

(To be generated with TypeDoc once implementation is complete)

- Type definitions with JSDoc comments
- Usage examples for each API level
- Migration guide from v2 to v3

## Next Steps

### Implementation Phases

1. **Phase 1: Core Runtime (Weeks 1-2)**
   - [ ] Implement runtime adapters (SPA, SSR, SSG, Memory)
   - [ ] Build AST pattern parser
   - [ ] Create pattern matcher/compiler
   - [ ] Implement state management with runes
   - [ ] Write comprehensive unit tests

2. **Phase 2: Middleware & Guards (Week 3)**
   - [ ] Implement middleware pipeline
   - [ ] Build guard system
   - [ ] Create built-in middleware (logging, auth, timing)
   - [ ] Create built-in guards (auth, permissions)
   - [ ] Integration tests

3. **Phase 3: API Layers (Week 4)**
   - [ ] Build Simple API
   - [ ] Build Enhanced API
   - [ ] Build Advanced API
   - [ ] Component integration
   - [ ] End-to-end tests

4. **Phase 4: SSR/SSG Support (Week 5)**
   - [ ] SSR adapter implementation
   - [ ] SSG adapter implementation
   - [ ] Hydration support
   - [ ] Build tooling integration

5. **Phase 5: Documentation & Polish (Week 6)**
   - [ ] Generate API documentation
   - [ ] Write migration guide
   - [ ] Create example applications
   - [ ] Performance benchmarks
   - [ ] Final testing and validation

### Success Criteria

- ✅ Type Safety: 100% TypeScript strict mode
- ✅ Test Coverage: >90% code coverage
- ✅ Performance: Meet all performance targets
- ✅ Bundle Size: <50KB for full feature set
- ✅ Developer Experience: Positive community feedback

## Contributing

When implementing v3, follow these guidelines:

1. **Read the architecture docs first**
2. **Follow the implementation patterns**
3. **Write tests before code (TDD)**
4. **Use Svelte 5 runes exclusively**
5. **No regular expressions**
6. **Maintain strict TypeScript**
7. **Document everything**
8. **Performance matters**

## License

MIT

## Questions?

Review the documentation in `./docs/` for detailed explanations of the
architecture and implementation patterns.

---

**Status**: Architecture phase complete. Implementation begins with Phase 1:
Core Runtime.
