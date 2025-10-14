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
<script lang="ts">
  import { compileMatcher } from "../../patterns/matcher";
  import { parsePattern } from "../../patterns/parser";
  import { createSPAAdapter } from "../../runtime/spa-adapter";
  import { RouterState } from "../../state";
  import type { SimpleRouteConfig } from "../../types";

  interface Props {
    routes: SimpleRouteConfig[];
    basePath?: string;
  }

  let { routes, basePath = "" }: Props = $props();

  const state = new RouterState();
  const adapter = createSPAAdapter();

  const matchers = routes.map((route) => {
    const pattern = route.path || "/";
    const result = parsePattern(pattern, { basePath });
    return {
      route,
      matcher: compileMatcher(result.ast)
    };
  });

  function handleNavigation(url: string): void {
    state.setState("navigating");

    const urlObj = new URL(url, window.location.origin);
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

    for (const { route, matcher } of matchers) {
      const match = matcher(path);
      if (match) {
        state.setRoute({ ...match, route });
        return;
      }
    }

    state.setError(new Error("Route not found: " + path));
  }

  // Listen for navigation with proper lifecycle management
  $effect(() => {
    if (adapter.isAvailable()) {
      const unlisten = adapter.listen(handleNavigation);
      // Initial navigation
      handleNavigation(adapter.getURL());

      // Cleanup on unmount
      return () => {
        if (unlisten) unlisten();
      };
    }
  });

  console.log("state", state);
</script>

{#if state.current}
  {@const currentRoute = state.current.route}
  {@const currentParams = state.current.params}

  {#if currentRoute?.component}
    {#if typeof currentRoute.component === "function"}
      {#await currentRoute.component() then module}
        {@const Component = module.default || module}
        <Component {...currentRoute.props} {...currentParams} />
      {:catch error}
        <div class="router-error">
          <h2>Error loading component</h2>
          <p>{error.message}</p>
        </div>
      {/await}
    {:else}
      {@const Component = currentRoute.component}
      <Component {...currentRoute.props} {...currentParams} />
    {/if}
  {:else if currentRoute?.snippet}
    {@render currentRoute.snippet()}
  {:else if currentRoute?.children && currentRoute.children.length > 0}
    <svelte:self
      routes={currentRoute.children}
      basePath={basePath + (currentRoute.path || "")} />
  {/if}
{:else if state.error}
  <div class="router-error">
    <h2>Navigation Error</h2>
    <p>{state.error.message}</p>
  </div>
{:else if state.state === "navigating"}
  <div class="router-loading">Loading...</div>
{:else}
  <div class="router-not-found">
    <h2>No Route Matched</h2>
    <p>Current path: {typeof window !== 'undefined' ? window.location.pathname : ''}</p>
  </div>
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
