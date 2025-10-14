<!--
  Simple Router - Level 1 API

  Provides basic routing with minimal configuration. Ideal for simple SPAs without
  complex middleware or guard requirements.

  @example
  ```svelte
  <SimpleRouter routes={[
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]} />
  ```
-->
<script lang="ts" generics="T">
  import type { Component, Snippet } from "svelte";
  import { compileMatcher } from "../../patterns/matcher";
  import { parsePattern } from "../../patterns/parser";
  import { createSPAAdapter } from "../../runtime/spa-adapter";
  import { RouterState } from "../../state";
  import type { SimpleRouteConfig } from "../../types";

  let {
    routes,
    basePath = "",
    currentUrl
  }: {
    routes: SimpleRouteConfig<T>[];
    basePath?: string;
    currentUrl?: string;
  } = $props();

  console.log("[SimpleRouter] Component instantiated with basePath:", basePath);
  console.log("[SimpleRouter] Routes:", routes);

  const routerState = new RouterState();
  const adapter = createSPAAdapter();

  console.log("[SimpleRouter] State and adapter created");

  const matchers = routes.map((route) => {
    const pattern = route.path || "/";
    const result = parsePattern(pattern, { basePath });
    return {
      route,
      matcher: compileMatcher(result.ast)
    };
  });

  function handleNavigation(url: string): void {
    routerState.setState("navigating");

    // Safe URL parsing that works on both server and client
    let urlObj: URL;
    try {
      if (typeof window !== "undefined") {
        urlObj = new URL(url, window.location.origin);
      } else {
        // On server side, we need to handle URL parsing differently
        urlObj = new URL(url, "http://localhost");
      }
    } catch (e) {
      // If URL parsing fails, treat it as a path
      urlObj = new URL(url.startsWith("/") ? url : "/" + url, "http://localhost");
    }

    let path = urlObj.pathname;

    // Normalize basePath by removing any trailing slash
    const normalizedBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

    if (normalizedBasePath && path.startsWith(normalizedBasePath)) {
      path = path.slice(normalizedBasePath.length);
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }
    }

    // If path is empty after stripping basePath, it's the root
    if (path === "") {
      path = "/";
    }

    console.log(`[SimpleRouter] Navigating. URL: ${url}, Path to match: ${path}`);
    console.log(
      `[SimpleRouter] Available routes:`,
      routes.map((r) => r.path)
    );
    console.log(`[SimpleRouter] basePath: ${basePath}, normalizedBasePath: ${normalizedBasePath}`);

    for (const { route, matcher } of matchers) {
      console.log(`[SimpleRouter] Testing route: ${route.path}`);
      const match = matcher(path);
      console.log(`[SimpleRouter] Match result for ${route.path}:`, match);
      if (match) {
        console.log(`[SimpleRouter] Matched route: ${route.path}`);
        console.log(`[SimpleRouter] Setting route with match:`, { ...match, route });
        routerState.setRoute({ ...match, route });
        return;
      }
    }

    console.error(`[SimpleRouter] No route found for path: ${path}`);
    routerState.setError(new Error("Route not found: " + path));
  }

  console.log("state", routerState);

  // Since lifecycle methods aren't working, let's try immediate navigation setup
  if (typeof window !== "undefined") {
    console.log("[SimpleRouter] Client-side: Setting up navigation immediately");
    // We're on the client side, set up navigation immediately
    const currentURL = window.location.href;
    console.log("[SimpleRouter] Client-side current URL:", currentURL);
    handleNavigation(currentURL);

    // Set up listener for future navigations
    if (adapter.isAvailable()) {
      console.log("[SimpleRouter] Setting up navigation listeners");
      adapter.listen(handleNavigation);
    }
  } else {
    console.log("[SimpleRouter] Server-side: Using fallback navigation");
    // For SSR, use the provided currentUrl or fallback to root
    const urlToUse = currentUrl || "/simple/";
    console.log("[SimpleRouter] Server-side: Using URL:", urlToUse);
    handleNavigation(urlToUse);
  }

  let RenderableComponent = $state<Component<any> | null>(null);
  let renderableSnippet = $state<Snippet<[T]> | null>(null);
  let loading = $state(false);

  $effect(() => {
    const run = async () => {
      const route = routerState.current?.route;
      if (!route) {
        RenderableComponent = null;
        renderableSnippet = null;
        return;
      }

      const comp = route.component;

      if (typeof comp === "function" && comp.length === 0) {
        loading = true;
        try {
          const module = await comp();
          RenderableComponent = module.default || module;
        } catch (err) {
          console.error("Lazy load failed", err);
        } finally {
          loading = false;
        }
      } else if (typeof comp === "function") {
        RenderableComponent = comp as Component<any>;
      } else if (route.snippet) {
        renderableSnippet = route.snippet;
      }
    };

    run();
  });
</script>

{#if routerState.current}
  {#if loading}
    <div class="router-loading">Loading…</div>
  {:else if RenderableComponent}
    <RenderableComponent {...routerState.current.route?.props} {...routerState.current.params} />
  {:else if renderableSnippet}
    {@render renderableSnippet(routerState.current.params)}
  {/if}
{:else if routerState.error}
  <div class="router-error">{routerState.error.message}</div>
{/if}

<style>
  .router-error {
    padding: 1rem;
    border: 1px solid #f00;
    background: #fee;
    color: #c00;
  }

  .router-loading {
    padding: 1rem;
    text-align: center;
    color: #666;
  }
</style>
