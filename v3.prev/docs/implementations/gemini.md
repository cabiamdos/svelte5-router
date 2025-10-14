# Gemini Deep Research: Integrating a Custom Svelte 5 Router with SvelteKit

This document provides a comprehensive, step-by-step implementation strategy for
connecting a custom, programmatic Svelte 5 SPA router library to the SvelteKit
meta-framework. The primary objective is to leverage SvelteKit's powerful
Server-Side Rendering (SSR) and Static Site Generation (SSG) capabilities while
preserving the custom router's lightweight, client-first SPA architecture.

The core of this strategy is the **"Catch-All Host" model**. Since SvelteKit's
routing is fundamentally tied to the filesystem, we cannot programmatically
register your router's routes directly. Instead, this model uses a single,
universal "catch-all" route within SvelteKit to act as a host. This route
intercepts all incoming requests, delegates rendering and data-loading logic to
your custom router on the server, and then seamlessly hands off control to your
router's SPA engine on the client.

---

### **Phase 1: SSR Integration via a Universal Catch-All Route**

The first phase establishes the server-side bridge, allowing SvelteKit's
rendering engine to be driven by your custom router's logic for every incoming
request.

### **1.1. Create the SvelteKit Catch-All Route**

Within your SvelteKit project, create a directory structure that uses an
_optional rest parameter_. This special naming convention ensures the route
matches every possible path, including the root `/`.

Create the following directory and files:

- `src/routes/[[...path]]/+page.server.ts`
- `src/routes/[[...path]]/+page.svelte`

### **1.2. Implement the Server-Side Bridge (`+page.server.ts`)**

This file is the critical link between SvelteKit's request lifecycle and your
router. Its `load` function will intercept the server request, consult your
router to determine the correct component and data, and then feed that
information into the SvelteKit rendering pipeline.

```tsx
// src/routes/[[...path]]/+page.server.ts

import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { customRouter } from "$lib/router/config"; // Your custom router instance and definitions

export const load: PageServerLoad = async ({ params, request, fetch }) => {
  // Reconstruct the full path from SvelteKit's parameters.
  const fullPath = `/${params.path || ""}`;

  // 1. Delegate Route Matching: Ask your custom router to find a match for the current path.
  const matchedRoute = await customRouter.match(fullPath);

  // If your router finds no match, use SvelteKit's standard 404 handling.
  if (!matchedRoute) {
    error(404, { message: "Not Found" });
  }

  // 2. Execute Data Loader: If the matched route has a `loader` function, execute it.
  // Pass a context object that mirrors SvelteKit's own, providing access to params, request, and fetch.
  let loaderData = {};
  if (matchedRoute.loader) {
    try {
      loaderData = await matchedRoute.loader({
        params: matchedRoute.params,
        request,
        fetch
      });
    } catch (e) {
      // Handle errors thrown from the loader, translating them to SvelteKit errors.
      error(500, { message: "Error loading data" });
    }
  }

  // 3. Return Component and Data: Pass the necessary information to the +page.svelte component.
  // We return a string identifier for the component, as the component constructor itself is not serializable.
  return {
    componentIdentifier: matchedRoute.componentPath, // e.g., '$lib/pages/Post.svelte'
    loaderData: loaderData,
    routeParams: matchedRoute.params,
    fullPath: fullPath
  };
};
```

### **1.3. Implement the Dynamic Rendering Host (`+page.svelte`)**

This Svelte component serves as the universal rendering surface. On the server,
it renders the component identified by the `load` function. On the client, its
primary responsibility is to initialize your SPA router and hand over control,
ensuring a seamless transition from the server-rendered page to a fully
interactive SPA.

```
&lt;script lang="ts"&gt;
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { customRouter } from '$lib/router/config'; // Your client-side router instance
  import DynamicRenderer from '$lib/components/DynamicRenderer.svelte';

  // The 'data' prop is populated by the return value of our `load` function.
  let { data } = $props();

  // Use Svelte 5 runes for reactive state management on the client.
  let clientSideComponent = $state(null);
  let clientSideProps = $state({});

  // The initial component and props are determined by the server render.
  let currentComponent = data.componentIdentifier;
  let currentProps = {...data.loaderData, params: data.routeParams };

  onMount(() =&gt; {
    // This code runs only in the browser after the initial HTML has been rendered.

    // 1. Initialize the client-side SPA router.
    // Pass the initial data fetched on the server to prevent a redundant client-side fetch.
    // This is the key to seamless hydration.
    customRouter.init({
      initialPath: data.fullPath,
      initialData: data.loaderData,
      initialComponent: data.componentIdentifier,
      initialParams: data.routeParams,
    });

    // 2. Subscribe to client-side route changes from your custom router.
    // When the user navigates within the SPA, this subscription will update the view.
    customRouter.subscribe((newState) =&gt; {
      clientSideComponent = newState.componentIdentifier;
      clientSideProps = {...newState.loaderData, params: newState.params };
    });
  });
&lt;/script&gt;

{#if clientSideComponent}
  &lt;DynamicRenderer componentIdentifier={clientSideComponent} props={clientSideProps} /&gt;
{:else}
  &lt;DynamicRenderer componentIdentifier={currentComponent} props={currentProps} /&gt;
{/if}
```

You will also need a `DynamicRenderer` utility component that uses Svelte's
`&lt;svelte:component&gt;` tag to render components based on a dynamic import.

```
&lt;script lang="ts"&gt;
  import { onMount } from 'svelte';

  let { componentIdentifier, props } = $props();
  let component = $state(null);

  // Use a reactive statement to dynamically import the component when the identifier changes.
  $effect(() =&gt; {
    // Vite's dynamic import handles resolving the component path.
    import(/* @vite-ignore */ componentIdentifier).then(module =&gt; {
      component = module.default;
    });
  });
&lt;/script&gt;

{#if component}
  &lt;svelte:component this={component} {...props} /&gt;
{:else}
  &lt;p&gt;Loading component...&lt;/p&gt;
{/if}
```

---

### **Phase 2: SSG Integration via Build-Time Route Analysis**

To enable Static Site Generation, we must inform SvelteKit's prerenderer of
every possible URL your application can serve. Since your routes are defined
programmatically, we will use a custom Vite plugin to analyze your router
configuration and generate a manifest of all static and dynamic paths.

### **2.1. Define the Vite Plugin**

Create a plugin that hooks into Vite's build process to discover your routes.

```jsx
// route-manifest-plugin.js
import fs from "fs";
import path from "path";

export function generateRouteManifest(routerConfigPath) {
  return {
    name: "generate-route-manifest",
    async buildStart() {
      // Dynamically import your router configuration.
      const { customRouter } = await import(routerConfigPath);
      const routes = customRouter.getRouteDefinitions(); // Assumes a method to get all route objects.
      const paths = [];

      for (const route of routes) {
        // Check for dynamic segments in the path.
        if (route.path.includes(":") || route.path.includes("*")) {
          // If the route has a `generateStaticParams` function, execute it to get all possible params.
          // This pattern is inspired by frameworks like Next.js and Nuxt.
          if (route.generateStaticParams) {
            const paramsArray = await route.generateStaticParams();
            for (const params of paramsArray) {
              // Build the full path for each parameter combination.
              paths.push(customRouter.buildPath(route.path, params));
            }
          }
        } else {
          // This is a static route.
          paths.push(route.path);
        }
      }

      // Write the discovered paths to a manifest file in the SvelteKit build directory.
      const manifestDir = ".svelte-kit";
      if (!fs.existsSync(manifestDir)) {
        fs.mkdirSync(manifestDir);
      }
      fs.writeFileSync(
        path.join(manifestDir, "prerender-manifest.json"),
        JSON.stringify(paths, null, 2)
      );
    }
  };
}
```

### **2.2. Configure Vite**

Add the plugin to your `vite.config.ts`.

```tsx
// vite.config.ts
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { generateRouteManifest } from "./route-manifest-plugin.js";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    sveltekit(),
    generateRouteManifest(resolve("./src/lib/router/config.ts"))
  ]
});
```

---

### **Phase 3: Adapter Integration for Prerendering**

The final step is to instruct the SvelteKit adapter to use the generated route
manifest during the build. This is achieved by creating a custom adapter that
wraps a standard one, such as `@sveltejs/adapter-static`.

### **3.1. Create a Custom Adapter Wrapper**

In your `svelte.config.js`, define a custom adapter that reads the manifest and
passes the list of prerender entries to the official adapter.

```jsx
// svelte.config.js
import adapterStatic from "@sveltejs/adapter-static";
import fs from "fs";
import path from "path";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  kit: {
    adapter: {
      name: "custom-static-adapter",
      async adapt(builder) {
        const manifestPath = ".svelte-kit/prerender-manifest.json";
        let entries = ["*"]; // Default fallback for SvelteKit

        // Read the prerender manifest generated by our Vite plugin.
        if (fs.existsSync(manifestPath)) {
          const paths = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
          // Format paths for SvelteKit's prerenderer.
          entries = paths.map((p) =>
            p === "/" ? "/" : p.startsWith("/") ? p : `/${p}`
          );
        }

        // Log the routes that will be prerendered.
        builder.log.info(
          `Prerendering ${entries.length} routes discovered by custom router.`
        );

        // Instruct the SvelteKit builder to prerender all discovered routes.
        // The `builder` object is provided by SvelteKit during the build process.
        await builder.prerender({
          entries: entries
        });

        // Initialize the standard static adapter.
        const staticAdapter = adapterStatic({
          pages: "build",
          assets: "build",
          fallback: "index.html" // Essential for SPA functionality after initial load.
        });

        // Let the standard adapter complete the build process.
        await staticAdapter.adapt(builder);
      }
    }
  }
};

export default config;
```

---

### **Phase 4: Runtime Coordination - Connecting the Dots**

This section illustrates the complete lifecycle of a request, demonstrating how
the server-side and client-side components work in harmony.

1. **Build Time (for SSG):**
   - `vite build` is executed.
   - Our `generateRouteManifest` Vite plugin runs, inspects your router config,
     executes any `generateStaticParams` functions, and writes all possible
     paths to `.svelte-kit/prerender-manifest.json`.
   - The custom adapter reads this manifest.
   - `builder.prerender()` is called for each path. For each path (e.g.,
     `/posts/my-first-post`), SvelteKit simulates a server request to the
     `[[...path]]` route.
   - The `+page.server.ts` `load` function executes, calling your custom
     router's `loader` and returning the component identifier and data.
   - SvelteKit renders the `+page.svelte` host component, generating a static
     `build/posts/my-first-post/index.html` file with the data embedded within
     it.
2. **Initial Page Load (SSR or from SSG cache):**
   - A user navigates to `/posts/my-first-post`.
   - The server responds with the fully rendered HTML document. This document
     contains the complete markup for the post page, providing excellent
     performance and SEO.
   - The browser renders this HTML instantly.
3. **Hydration:**
   - The client-side JavaScript bundle is downloaded and executed.
   - The `[[...path]]/+page.svelte` component mounts.
   - The `onMount` function runs. It initializes your custom SPA router.
   - Crucially, it passes the `initialData` (which SvelteKit hydrated from the
     embedded data in the HTML) to the router. **No new API call is made.** The
     client-side state is now perfectly synchronized with the server-rendered
     state.
4. **Client-Side Navigation:**
   - The user clicks a `&lt;Link to="/about"&gt;` component provided by your
     router library.
   - Your router's client-side logic intercepts the click, preventing a
     full-page reload.
   - It executes the `loader` for the `/about` route, this time making a `fetch`
     request from the browser.
   - Upon receiving the data, it updates its internal reactive state (managed
     with Svelte 5 Runes).
   - The subscription in `[[...path]]/+page.svelte` is triggered by this state
     change.
   - The `DynamicRenderer` receives new props and Svelte efficiently updates the
     DOM to display the "About" page.

From this point on, the application behaves as a fast, modern SPA, fulfilling
the goal of maintaining your router's lightweight architecture while gaining the
initial load performance of a server-rendered application.
