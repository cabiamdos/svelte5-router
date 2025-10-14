<!--
  Simple Router - Level 1 API
  For users who just want basic routing with minimal configuration
-->
<script lang="ts">
  import { createRouter } from "./enhanced";
  import type { SimpleRouteConfig } from "./types";

  interface Props {
    routes: SimpleRouteConfig[];
    basePath?: string;
  }

  let { routes, basePath = "" }: Props = $props();

  // Convert simple routes to enhanced format
  const enhancedRoutes = routes.map((route) => ({
    ...route,
    path: route.path || "/"
  }));

  // Create enhanced router with simplified configuration
  const router = createRouter({
    routes: enhancedRoutes,
    basePath
  });
</script>

<svelte:component
  this={router}
  {routes} />
