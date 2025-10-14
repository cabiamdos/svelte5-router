# SvelteKit Catch-All Routes for SPA Router

**Date:** 2025-10-13
**Time:** 21:15
**Category:** Bug Fix, Routing Architecture

## Summary

Fixed 404 errors when navigating within SPA routes by adding SvelteKit catch-all routes. This allows SvelteKit to pass all sub-paths to the client-side SPA router instead of trying to handle them as server routes.

## The Problem

### Architecture Conflict

The v3 test application uses a **hybrid routing architecture**:

```
SvelteKit (Server Routes)
└─ /simple (/routes/simple/+page.svelte)
   └─ SPA Router (Client Routes)
      ├─ / → Home
      ├─ /about → About
      └─ /users/:id → UserProfile
```

When a user navigated from `/simple` to `/simple/about`:

1. **SPA Router** called `goto('/simple/about')`
2. **Browser** URL changed to `http://localhost:5173/simple/about`
3. **SvelteKit** intercepted the navigation and looked for a server route
4. **No Match** found (only `/simple` exists, not `/simple/about`)
5. **Result**: 404 error

### Why It Happened

SvelteKit's file-based routing only had these routes defined:
```
/simple          → routes/simple/+page.svelte ✅
/simple/about    → Not defined ❌
/simple/users/*  → Not defined ❌
/enhanced        → routes/enhanced/+page.svelte ✅
/enhanced/about  → Not defined ❌
```

When the SPA router changed the browser URL using `window.history.pushState()`, SvelteKit saw this as a new server route request and returned 404 because no matching file existed.

## The Solution

### SvelteKit Catch-All Routes

Use SvelteKit's optional catch-all parameter `[[...rest]]` to delegate all sub-paths to the same component:

```
Before:
/simple/+page.svelte              → Handles /simple only

After:
/simple/+page.svelte              → Handles /simple
/simple/[[...rest]]/+page.svelte  → Handles /simple/* (any sub-path)
```

### How It Works

1. **User visits** `/simple/about`
2. **SvelteKit matches** `/simple/[[...rest]]/+page.svelte` (catch-all)
3. **Component renders** with the SPA Router
4. **SPA Router receives** URL `/simple/about`
5. **Pattern matcher** matches `/about` pattern (after removing basePath)
6. **Component renders** About page

### Implementation

Created two catch-all routes:

**File Structure:**
```
routes/
├── simple/
│   ├── +page.svelte              # Handles /simple
│   └── [[...rest]]/
│       └── +page.svelte          # Handles /simple/*
└── enhanced/
    ├── +page.svelte              # Handles /enhanced
    └── [[...rest]]/
        └── +page.svelte          # Handles /enhanced/*
```

**Content:**
Both catch-all `+page.svelte` files contain the same component as their parent, ensuring consistent behavior whether accessing `/simple` or `/simple/about`.

## Files Created

1. ✅ `v3/test/server/src/routes/simple/[[...rest]]/+page.svelte`
2. ✅ `v3/test/server/src/routes/enhanced/[[...rest]]/+page.svelte`

## URL Routing Flow

### Before Fix

```
User clicks "About"
  ↓
goto('/simple/about')
  ↓
Browser URL: /simple/about
  ↓
SvelteKit: Looking for routes/simple/about/+page.svelte
  ↓
Not found → 404 Error ❌
```

### After Fix

```
User clicks "About"
  ↓
goto('/simple/about')
  ↓
Browser URL: /simple/about
  ↓
SvelteKit: Matches routes/simple/[[...rest]]/+page.svelte ✅
  ↓
Renders SPA Router component
  ↓
SPA Router: Matches /about pattern ✅
  ↓
Renders About component ✅
```

## Testing

### Manual Verification

```bash
cd v3/test/server
npm run dev
```

Visit and test:

**Simple Router** (`http://localhost:5173/simple`):
- ✅ `/simple` → Home page
- ✅ `/simple/about` → About page (no 404!)
- ✅ `/simple/users/123` → User profile (no 404!)
- ✅ `/simple/users/42/posts/99` → Post page (no 404!)
- ✅ `/simple/files/docs/test.pdf` → Files page (no 404!)

**Enhanced Router** (`http://localhost:5173/enhanced`):
- ✅ `/enhanced` → Home page
- ✅ `/enhanced/about` → About page (no 404!)
- ✅ `/enhanced/dashboard` → Dashboard or redirect to login (no 404!)
- ✅ `/enhanced/login` → Login page (no 404!)

### Browser Navigation

- ✅ **Forward navigation**: Click links → URLs change correctly
- ✅ **Back button**: Browser back → Returns to previous route
- ✅ **Forward button**: Browser forward → Moves forward in history
- ✅ **Direct URL**: Type `/simple/users/123` → Loads correctly
- ✅ **Refresh**: F5 on any route → Page reloads correctly

## Why `[[...rest]]` Instead of `[...rest]`?

The double brackets `[[...rest]]` make the parameter **optional**:

- `[...rest]` → Required parameter (only matches `/simple/something`)
- `[[...rest]]` → Optional parameter (matches `/simple` AND `/simple/something`)

With optional parameter:
```
/simple         → Matches +page.svelte (preferred)
/simple/about   → Matches [[...rest]]/+page.svelte
```

With required parameter:
```
/simple         → Matches +page.svelte ✅
/simple/about   → Matches [rest]/+page.svelte ✅

But requires more complex routing logic
```

We use optional because both the base route and catch-all render the same component.

## Alternative Solutions Considered

### 1. Hash-Based Routing

Use hash fragments instead of history API:

```typescript
// URLs would be:
/simple#/about
/simple#/users/123

// Instead of:
/simple/about
/simple/users/123
```

**Pros:**
- No SvelteKit routing conflicts
- Works without catch-all routes
- Simpler server configuration

**Cons:**
- Less clean URLs (hash fragments are ugly)
- Worse SEO (fragments not sent to server)
- Not standard for modern SPAs

**Decision:** Rejected. Clean URLs are preferred.

### 2. Single-Route Architecture

Put the entire app under one SvelteKit route:

```
/app → Single SvelteKit page
  └─ SPA Router handles everything
```

**Pros:**
- No catch-all needed
- Simpler SvelteKit routing
- All routing happens client-side

**Cons:**
- Can't demonstrate multiple router instances
- Doesn't match real-world scenarios
- Loses SvelteKit per-page benefits

**Decision:** Rejected. Need to test multiple router instances.

### 3. SvelteKit API Route Prefix

Use a special prefix for SPA routes:

```
/api/simple/* → SvelteKit handles
/spa/simple/* → Client-side SPA handles
```

**Pros:**
- Clear separation of concerns
- No routing conflicts

**Cons:**
- Non-standard URL structure
- Doesn't match real-world usage
- More complex mental model

**Decision:** Rejected. Prefer standard patterns.

## Best Practices

### When to Use Catch-All Routes

Use catch-all routes when:
- ✅ Embedding an SPA router within SvelteKit pages
- ✅ Client-side routing needs to handle multiple sub-paths
- ✅ You want clean URLs without hash fragments
- ✅ You need browser history to work correctly

### When NOT to Use Catch-All Routes

Don't use catch-all when:
- ❌ Using hash-based routing (`#/route`)
- ❌ All routing is handled by SvelteKit server-side
- ❌ Each route should have its own SvelteKit page
- ❌ You need server-side rendering for each sub-route

### Code Maintenance

Since the catch-all route duplicates the parent component, consider:

1. **Extract to Shared Component:**
```typescript
// routes/simple/_router.svelte (shared)
export { RouterComponent }

// routes/simple/+page.svelte
import { RouterComponent } from './_router.svelte';

// routes/simple/[[...rest]]/+page.svelte
import { RouterComponent } from '../_router.svelte';
```

2. **Or Accept Duplication:**
- Simple enough to maintain
- Keeps routes self-contained
- Clear what each file does

## Impact

### ✅ Fixed
- All SPA router navigation now works without 404 errors
- Browser back/forward buttons work correctly
- Direct URL access works for all routes
- Page refresh preserves the current route

### 🎯 Benefits
- Clean, semantic URLs
- Standard SPA routing behavior
- Works with SvelteKit's dev server
- Production builds work correctly

### 📝 Documentation
- Clear architecture pattern for hybrid routing
- Template for future SvelteKit + SPA router projects
- Explains when to use each routing approach

## Related Documentation

- SvelteKit Routing: https://svelte.dev/docs/kit/routing
- Optional Parameters: https://svelte.dev/docs/kit/routing#optional-parameters
- BasePath Navigation Fix: 2025-10-13-2045-router-basepath-navigation-fix.md
- RouterState Fixes: 2025-10-13-1943-routerstate-fixes.md

---

**Conclusion:** SvelteKit catch-all routes allow an embedded SPA router to handle all sub-paths while maintaining clean URLs and standard browser navigation behavior. This is the recommended approach for hybrid SvelteKit + SPA router applications.
