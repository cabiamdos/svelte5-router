<!--
  Enhanced Router - Level 2 API

  Adds middleware, guards, and lifecycle hooks to the Simple API.
-->
<script lang="ts">
  import type {
    EnhancedRouteConfig,
    MiddlewareContext,
    GuardContext,
    NavigationDirection
  } from "../../types";
  import { RouterState } from "../../state";
  import { parsePattern } from "../../patterns/parser";
  import { compileMatcher } from "../../patterns/matcher";
  import { createSPAAdapter } from "../../runtime/spa-adapter";
  import { executePipeline } from "../../middleware";
  import { executeGuards } from "../../guards";

  interface Props {
    routes: EnhancedRouteConfig[];
    basePath?: string;
    middleware?: import("../../types").MiddlewareFunction[];
    guards?: import("../../types").GuardFunction[];
  }

  let { routes, basePath = "", middleware = [], guards = [] }: Props = $props();

  const state = new RouterState();
  const adapter = createSPAAdapter();

  const matchers = routes.map((route) => {
    const pattern = route.path || "/";
    const result = parsePattern(pattern, { basePath });
    return { route, matcher: compileMatcher(result.ast) };
  });

  async function handleNavigation(url: string): Promise<void> {
    state.setState("navigating");

    const urlObj = new URL(url, window.location.origin);
    let path = urlObj.pathname;
    const previousPath = state.path;

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

    for (const { route, matcher } of matchers) {
      const match = matcher(path);
      if (!match) continue;

      // Create contexts
      const guardContext: GuardContext = {
        route: { ...match, route },
        to: path,
        from: previousPath,
        direction: "push" as NavigationDirection,
        state: adapter.getState(),
        runtime: "spa",
        redirect: (url: string) => adapter.replace(url)
      };

      // Execute guards
      const globalGuardsAllowed =
        guards.length === 0 || (await executeGuards(guards, guardContext));
      const routeGuardsAllowed = !route.guards || (await executeGuards(route.guards, guardContext));

      if (!globalGuardsAllowed || !routeGuardsAllowed) {
        state.setError(new Error("Access denied"));
        return;
      }

      // Create middleware context
      const middlewareContext: MiddlewareContext = {
        route: { ...match, route },
        to: path,
        from: previousPath,
        direction: "push" as NavigationDirection,
        state: adapter.getState(),
        runtime: "spa",
        abort: (redirect?: string) => {
          if (redirect) adapter.replace(redirect);
        },
        data: {}
      };

      // Execute middleware
      const globalMiddlewareSuccess =
        middleware.length === 0 || (await executePipeline(middleware, middlewareContext));
      const routeMiddlewareSuccess =
        !route.middleware || (await executePipeline(route.middleware, middlewareContext));

      if (!globalMiddlewareSuccess || !routeMiddlewareSuccess) {
        state.setError(new Error("Navigation aborted by middleware"));
        return;
      }

      // Execute beforeEnter hooks
      if (route.hooks?.beforeEnter) {
        const hooks = Array.isArray(route.hooks.beforeEnter)
          ? route.hooks.beforeEnter
          : [route.hooks.beforeEnter];
        for (const hook of hooks) {
          const result = await hook(middlewareContext);
          if (result === false) {
            state.setError(new Error("Navigation cancelled by hook"));
            return;
          }
        }
      }

      state.setRoute({ ...match, route });

      // Execute afterEnter hooks
      if (route.hooks?.afterEnter) {
        const hooks = Array.isArray(route.hooks.afterEnter)
          ? route.hooks.afterEnter
          : [route.hooks.afterEnter];
        for (const hook of hooks) {
          await hook(middlewareContext);
        }
      }

      return;
    }

    state.setError(new Error("Route not found: " + path));
  }

  $effect(() => {
    if (adapter.isAvailable()) {
      const unlisten = adapter.listen(handleNavigation);
      handleNavigation(adapter.getURL());

      return () => {
        if (unlisten) unlisten();
      };
    }
  });
</script>

{#if state.current}
  {@const { route } = state.current}
  {@const Component = route.component}

  {#if Component}
    {#if typeof Component === "function"}
      {#await Component() then module}
        <svelte:component this={module.default} {...state.params} {...route.props} />
      {:catch error}
        <div class="router-error">
          <h2>Error loading component</h2>
          <p>{error.message}</p>
        </div>
      {/await}
    {:else}
      <svelte:component this={Component} {...state.params} {...route.props} />
    {/if}
  {:else if route.snippet}
    {@render route.snippet(state.params)}
  {/if}
{:else if state.error}
  <div class="router-error">
    <h2>Navigation Error</h2>
    <p>{state.error.message}</p>
  </div>
{:else if state.navigating}
  <div class="router-loading">Loading...</div>
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
