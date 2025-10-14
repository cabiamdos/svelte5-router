# Router BasePath Navigation Fix

**Date:** 2025-10-13
**Time:** 20:45
**Category:** Bug Fix, Navigation

## Summary

Fixed 404 errors in the Simple and Enhanced API test pages by correcting navigation calls to include the router's `basePath` prefix. The issue occurred because the SPA router was being used within SvelteKit pages at specific routes (`/simple`, `/enhanced`), but navigation calls weren't accounting for this context.

## Problem Description

### Root Cause

The v3 router test application uses a mixed architecture:
- **SvelteKit File-Based Routing**: Top-level pages at `/simple`, `/enhanced`, `/advanced`
- **SPA Router**: Client-side routing WITHIN each SvelteKit page

When navigation buttons called `goto('/users/123')`, the router attempted to navigate to the absolute path `/users/123`, which doesn't exist as a SvelteKit route. The correct path should have been `/simple/users/123` to stay within the SvelteKit page context.

### Symptoms

1. Clicking navigation links like "User 123" or "Post 99" resulted in 404 errors
2. Browser URL changed to paths like `/users/123` instead of `/simple/users/123`
3. SvelteKit returned "404 - Page Not Found" because no route matched
4. Router worked for initial page load but broke on navigation

### Technical Details

**Architecture Context:**
```
http://localhost:5174/simple       <- SvelteKit route
  └─ SimpleRouter (basePath="/simple")
       ├─ / -> Home               <- Maps to /simple/
       ├─ /about -> About         <- Maps to /simple/about
       └─ /users/:id -> Profile   <- Maps to /simple/users/:id
```

**What Was Happening:**
```typescript
// User clicks "User 123" button
goto('/users/123');

// Browser URL changes to:
http://localhost:5174/users/123  ❌ (404 - Not a SvelteKit route)

// Should change to:
http://localhost:5174/simple/users/123  ✅ (Router handles within /simple page)
```

## Solution

Updated all `goto()` calls in the test pages to include the `basePath` prefix.

### Files Changed

1. **v3/test/server/src/routes/simple/+page.svelte**
2. **v3/test/server/src/routes/enhanced/+page.svelte**

### Changes Made

#### Simple Router Test Page

**Before:**
```typescript
<button onclick={() => goto('/')}>Home</button>
<button onclick={() => goto('/about')}>About</button>
<button onclick={() => goto('/users/123')}>User 123</button>
<button onclick={() => goto('/users/42/posts/99')}>Post 99</button>
<button onclick={() => goto('/files/docs/test.pdf')}>Files</button>
```

**After:**
```typescript
<button onclick={() => goto('/simple/')}>Home</button>
<button onclick={() => goto('/simple/about')}>About</button>
<button onclick={() => goto('/simple/users/123')}>User 123</button>
<button onclick={() => goto('/simple/users/42/posts/99')}>Post 99</button>
<button onclick={() => goto('/simple/files/docs/test.pdf')}>Files</button>
```

#### Enhanced Router Test Page

**Before:**
```typescript
<button onclick={() => goto('/')}>Home</button>
<button onclick={() => goto('/about')}>About</button>
<button onclick={() => goto('/dashboard')}>Dashboard</button>
<button onclick={() => goto('/login')}>Login</button>

function logout() {
  // ...
  goto('/login');
}
```

**After:**
```typescript
<button onclick={() => goto('/enhanced/')}>Home</button>
<button onclick={() => goto('/enhanced/about')}>About</button>
<button onclick={() => goto('/enhanced/dashboard')}>Dashboard</button>
<button onclick={() => goto('/enhanced/login')}>Login</button>

function logout() {
  // ...
  goto('/enhanced/login');
}
```

## How It Works Now

### Navigation Flow

1. **User visits**: `http://localhost:5174/simple`
2. **SimpleRouter renders** with `basePath="/simple"`
3. **User clicks "User 123"**: Calls `goto('/simple/users/123')`
4. **SPA Adapter pushes**: `/simple/users/123` to browser history
5. **Router receives URL**: `/simple/users/123`
6. **Pattern matcher**:
   - Pattern: `/users/:id` (parsed with basePath="/simple")
   - URL: `/simple/users/123`
   - Match: ✅ Extracts `{ id: '123' }`
7. **Component renders**: UserProfile with `id="123"`

### URL Structure

```
SvelteKit Page       Router BasePath      Route Pattern      Full URL
─────────────────────────────────────────────────────────────────────────
/simple              /simple              /                  /simple/
/simple              /simple              /about             /simple/about
/simple              /simple              /users/:id         /simple/users/123
/enhanced            /enhanced            /                  /enhanced/
/enhanced            /enhanced            /dashboard         /enhanced/dashboard
```

## Testing

### Manual Verification

To verify the fixes:

```bash
cd v3/test/server
npm run dev
```

Then visit:
- http://localhost:5174/simple
  - ✅ Click "Home" → Stays at /simple/
  - ✅ Click "About" → Goes to /simple/about
  - ✅ Click "User 123" → Goes to /simple/users/123
  - ✅ Click "Post 99" → Goes to /simple/users/42/posts/99
  - ✅ Click "Files" → Goes to /simple/files/docs/test.pdf

- http://localhost:5174/enhanced
  - ✅ Click "Home" → Stays at /enhanced/
  - ✅ Click "About" → Goes to /enhanced/about
  - ✅ Click "Dashboard" → Goes to /enhanced/dashboard (or /enhanced/login if not authenticated)
  - ✅ Click "Login" → Goes to /enhanced/login

## Alternative Solutions Considered

### 1. Context-Aware goto() Function

Create a router context that provides a basePath-aware navigation function:

```typescript
// In router
import { setContext } from 'svelte';

const router = {
  basePath: '/simple',
  goto: (path) => goto(basePath + path)
};
setContext('router', router);

// In component
const { goto } = getContext('router');
goto('/users/123'); // Automatically becomes /simple/users/123
```

**Pros:**
- Clean API - developers don't need to remember basePath
- Automatically scopes all navigation to the router context
- Prevents navigation outside the router's scope

**Cons:**
- More complex implementation
- Requires Svelte context API
- May not work in all scenarios (e.g., programmatic navigation)

**Decision:** Not implemented for v3 test pages, but could be a good enhancement for the router API itself.

### 2. Relative Path Navigation

Use relative paths instead of absolute paths:

```typescript
goto('users/123'); // Relative path (no leading slash)
```

**Pros:**
- More intuitive for nested routing
- Common pattern in traditional web routing

**Cons:**
- Requires different URL resolution logic
- More complex to implement correctly
- Doesn't match SPA router conventions

**Decision:** Not implemented. Absolute paths with basePath are clearer.

### 3. Automatic BasePath Detection

Have the router automatically detect its basePath from the current URL:

```typescript
// Router detects it's at /simple and auto-prepends
goto('/users/123'); // Router converts to /simple/users/123
```

**Pros:**
- Most developer-friendly
- No manual basePath management

**Cons:**
- Complex implementation
- Fragile (what if router is moved?)
- Unexpected behavior in edge cases

**Decision:** Not implemented. Explicit is better than implicit.

## Future Enhancements

### Router Context API (Recommended)

Add a context-based navigation API to the router:

```typescript
// v3/src/api/simple/index.ts
export function useRouter() {
  const router = getContext<RouterContext>('svelte5-router');
  if (!router) {
    throw new Error('useRouter must be called within a Router component');
  }

  return {
    goto: (path: string) => goto(router.basePath + path),
    back: () => back(),
    forward: () => forward(),
    params: router.state.params,
    query: router.state.query
  };
}
```

**Usage:**
```svelte
<script>
  import { useRouter } from '@v3/api/simple';

  const { goto, params } = useRouter();
</script>

<button onclick={() => goto('/users/123')}>
  User 123
</button>
```

### Link Component

Create a `<Link>` component that automatically handles basePath:

```svelte
<Link to="/users/123">User 123</Link>

<!-- Renders as: -->
<a href="/simple/users/123" onclick={handleClick}>User 123</a>
```

## Impact

### ✅ Fixed
- Simple router navigation now works correctly for all routes
- Enhanced router navigation now works correctly for all routes
- Users can navigate between routes without 404 errors

### ⚠️ Known Limitations
- Developers must manually include basePath in goto() calls
- No automatic validation that paths are within router scope
- Easy to make mistakes when adding new navigation

### 📝 Documentation Needed
- Add usage examples showing correct basePath usage
- Document the mixed SvelteKit + SPA router architecture
- Provide migration guide for apps using basePath

## Related Issues

- RouterState compatibility fix (2025-10-13-1943)
- Pattern matching with basePath (implemented in parser.ts)
- SPA adapter URL handling (spa-adapter.ts)

---

**Conclusion:** The 404 errors were caused by navigation calls not including the router's basePath. By updating all `goto()` calls to include the correct prefix, navigation now works correctly within the SvelteKit page context.
