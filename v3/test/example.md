# V3 Router Usage Examples

## Simple API Example

```svelte
<script>
  import { SimpleRouter, goto } from "@mateothegreat/svelte5-router/v3/simple";
  import Home from "./routes/Home.svelte";
  import About from "./routes/About.svelte";
  import Contact from "./routes/Contact.svelte";

  const routes = [
    { path: "/", component: Home },
    { path: "/about", component: About },
    { path: "/contact", component: Contact }
  ];
</script>

<nav>
  <button onclick={() => goto("/")}>Home</button>
  <button onclick={() => goto("/about")}>About</button>
  <button onclick={() => goto("/contact")}>Contact</button>
</nav>

<SimpleRouter {routes} />
```

## Enhanced API Example

```svelte
<script>
  import {
    Router,
    goto,
    loggingMiddleware,
    createAuthGuard
  } from "@mateothegreat/svelte5-router/v3/enhanced";
  import Home from "./routes/Home.svelte";
  import Dashboard from "./routes/Dashboard.svelte";
  import Login from "./routes/Login.svelte";

  const isAuthenticated = () => localStorage.getItem("token") !== null;
  const authGuard = createAuthGuard(isAuthenticated);

  const routes = [
    {
      path: "/",
      component: Home
    },
    {
      path: "/dashboard",
      component: Dashboard,
      guards: [authGuard],
      middleware: [loggingMiddleware],
      meta: { requiresAuth: true },
      hooks: {
        beforeEnter: () => {
          console.log("Entering dashboard");
          return true;
        },
        afterEnter: () => {
          console.log("Dashboard loaded");
        }
      }
    },
    {
      path: "/login",
      component: Login
    }
  ];

  const globalMiddleware = [loggingMiddleware];
</script>

<Router {routes} middleware={globalMiddleware} />
```

## Advanced API Example

```svelte
<script>
  import {
    AdvancedRouter,
    parsePattern,
    compileMatcher,
    createAuthGuard,
    loggingMiddleware,
    timingMiddleware
  } from "@mateothegreat/svelte5-router/v3/advanced";

  const routes = [
    {
      path: "/users/:id",
      component: () => import("./routes/UserProfile.svelte"),
      guards: [createAuthGuard(() => true)],
      middleware: [loggingMiddleware, timingMiddleware],
      lazy: {
        preload: true,
        timeout: 5000,
        retry: 3
      },
      animation: {
        enter: "fade-in",
        exit: "fade-out",
        duration: 300
      },
      meta: {
        title: "User Profile",
        requiresAuth: true
      },
      hooks: {
        beforeEnter: async (context) => {
          console.log("Loading user:", context.route.params.id);
          return true;
        },
        afterEnter: (context) => {
          document.title = `User ${context.route.params.id}`;
        }
      }
    }
  ];
</script>

<AdvancedRouter {routes} />
```

## Testing Example

```typescript
import { test, expect } from "vitest";
import { createMemoryAdapter } from "@mateothegreat/svelte5-router/v3/advanced";
import {
  parsePattern,
  compileMatcher
} from "@mateothegreat/svelte5-router/v3/advanced";

test("navigation with memory adapter", async () => {
  const adapter = createMemoryAdapter("/");

  // Navigate to route
  adapter.push("/users/123");

  expect(adapter.getURL()).toBe("/users/123");

  // Navigate back
  adapter.back();

  expect(adapter.getURL()).toBe("/");
});

test("route matching", () => {
  const pattern = parsePattern("/users/:id");
  const matcher = compileMatcher(pattern.ast);

  const match = matcher("/users/42");

  expect(match).toMatchObject({
    matched: true,
    params: { id: "42" }
  });
});
```
