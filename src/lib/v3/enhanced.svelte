<!--
  Enhanced Router - Level 2 API
  For users who want more control and features
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { GuardManager } from "../guards";
  import { MiddlewarePipeline, createContext } from "../middleware";
  import { compilePattern, matchPattern } from "../patterns";
  import type { EnhancedRouteConfig, RouteMatch, RouterConfig } from "./types";

  interface Props extends RouterConfig {
    routes: EnhancedRouteConfig[];
  }

  let { routes, basePath = "", middleware = [], guards = [], hash = false, ...config }: Props = $props();

  // Reactive state using Svelte 5 runes
  let currentRoute = $state<RouteMatch | null>(null);
  let isNavigating = $state(false);
  let navigationError = $state<Error | null>(null);

  // Initialize middleware pipeline and guard manager
  const middlewarePipeline = new MiddlewarePipeline();
  const guardManager = new GuardManager();

  // Register global middleware and guards
  middleware.forEach((mw) => middlewarePipeline.use(mw));
  guards.forEach((guard) => guardManager.register(guard, { global: true }));

  // Compile route patterns for better performance
  const compiledRoutes = $derived(() =>
    routes.map((route) => ({
      ...route,
      compiledPattern: route.path ? compilePattern(route.path) : null
    }))
  );

  async function handleNavigation(path: string): Promise<void> {
    isNavigating = true;
    navigationError = null;

    try {
      const match = findRoute(path);

      if (match.matched && match.route) {
        // Execute guards
        const guardResult = await guardManager.execute({
          to: match as any, // Type conversion for compatibility
          from: currentRoute as any,
          data: {},
          meta: {
            timestamp: Date.now(),
            trigger: "user"
          }
        });

        if (!guardResult.allowed) {
          if (guardResult.redirect) {
            navigate(guardResult.redirect, { replace: guardResult.replace ?? false });
            return;
          } else {
            throw new Error("Navigation blocked by guard");
          }
        }

        // Execute middleware
        const context = createContext(match as any, path, match.query);
        const middlewareResult = await middlewarePipeline.execute(context);

        if (!middlewareResult.success) {
          throw middlewareResult.error || new Error("Middleware execution failed");
        }

        currentRoute = match;
      } else {
        throw new Error(`No route found for path: ${path}`);
      }
    } catch (error) {
      navigationError = error as Error;
      console.error("Navigation error:", error);
    } finally {
      isNavigating = false;
    }
  }

  function findRoute(path: string): RouteMatch {
    const normalizedPath = hash ? path.replace("#", "") : path;
    const [pathname, search] = normalizedPath.split("?");
    const query = search ? Object.fromEntries(new URLSearchParams(search)) : {};

    for (const route of compiledRoutes()) {
      if (route.compiledPattern) {
        const match = matchPattern(route.compiledPattern, pathname || "/");
        if (match.matched) {
          return {
            matched: true,
            params: match.params,
            query,
            route: route as any, // TODO: Type this,
            remaining: match.remaining ?? ""
          };
        }
      }
    }

    return {
      matched: false,
      params: {},
      query
    };
  }

  function navigate(path: string, options: { replace?: boolean } = {}): void {
    const fullPath = hash ? `#${path}` : path;

    if (options.replace) {
      history.replaceState(null, "", fullPath);
    } else {
      history.pushState(null, "", fullPath);
    }

    handleNavigation(path);
  }

  function handlePopState(): void {
    const path = hash ? location.hash.slice(1) : location.pathname + location.search;
    handleNavigation(path);
  }

  onMount(() => {
    // Handle initial navigation
    const initialPath = hash ? location.hash.slice(1) || "/" : location.pathname + location.search;
    handleNavigation(initialPath);

    // Listen for navigation events
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  });

  // Expose navigation function to parent component
  export { navigate };
</script>

{#if navigationError}
  <div class="router-error">
    <h2>Navigation Error</h2>
    <p>{navigationError.message}</p>
  </div>
{:else if isNavigating}
  <div class="router-loading">Loading...</div>
{:else if currentRoute?.matched && currentRoute.route}
  {#if currentRoute.route.component}
    <svelte:component
      this={currentRoute.route.component}
      {...currentRoute.route.props}
      route={currentRoute} />
  {:else if currentRoute.route.snippet}
    {@render currentRoute.route.snippet()}
  {/if}
{:else}
  <div class="router-not-found">
    <h2>Page Not Found</h2>
    <p>The requested page could not be found.</p>
  </div>
{/if}

<style>
  .router-error,
  .router-loading,
  .router-not-found {
    padding: 2rem;
    text-align: center;
  }

  .router-error {
    background-color: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #800;
  }

  .router-loading {
    background-color: #eef;
    border: 1px solid #ccf;
    border-radius: 4px;
    color: #008;
  }

  .router-not-found {
    background-color: #ffe;
    border: 1px solid #ffc;
    border-radius: 4px;
    color: #880;
  }
</style>
