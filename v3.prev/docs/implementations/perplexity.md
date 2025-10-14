# Perplexity Deep Research: Implementation Strategy: Connecting Custom Svelte 5 Router to SvelteKit

## Executive Overview

This implementation strategy outlines a comprehensive approach to integrate a
custom Svelte 5 router library with SvelteKit's SSR/SSG capabilities while
preserving its lightweight SPA architecture. The solution bridges the gap
between client-side routing flexibility and server-side rendering requirements
through a three-phase implementation: **Adapter Integration**, **Build-Time
Processing**, and **Runtime Coordination**.

## Architecture Foundation

### Core Integration Points

**1. SvelteKit Adapter Layer**

- Custom adapter extending `@sveltejs/kit` Builder API[1][2]
- Route manifest generation and analysis[3][4]
- Build output coordination for multiple rendering modes

**2. Vite Plugin Integration**

- Route discovery and analysis during development[4][5]
- Build-time code transformation and optimization
- Development server integration with custom routing

**3. Hydration Coordination System**

- Server-client state synchronization using Svelte 5 runes[6][7]
- Progressive hydration with custom component boundaries
- Runtime mode detection and adaptation

## Phase 1: Adapter Integration

### 1.1 Custom SvelteKit Adapter Creation

The adapter serves as the bridge between your custom router and SvelteKit's
build system, implementing the standard adapter API[1][2]:

```jsx
// adapter-custom-router/index.js
import { createAdapter } from "./adapter-core.js";

export default function customRouterAdapter(options = {}) {
  /** @type {import("@sveltejs/kit").Adapter} */
  const adapter = {
    name: "custom-router-adapter",

    async adapt(builder) {
      // 1. Analyze custom routes from your router configuration
      const customRoutes = await analyzeCustomRoutes(options.routerConfig);

      // 2. Generate SvelteKit-compatible route manifest
      const manifest = generateHybridManifest(customRoutes, builder);

      // 3. Build assets for both SPA and SSR modes
      await buildDualModeAssets(builder, manifest, options);

      // 4. Generate adapter-specific output
      await generateAdapterOutput(builder, manifest, options);
    },

    async emulate() {
      return {
        platform({ config, prerender }) {
          return {
            router: createRouterContext(config),
            mode: prerender ? "ssg" : "ssr"
          };
        }
      };
    },

    supports: {
      read: ({ config, route }) => {
        // Support both file-based and programmatic routes
        return config.routes?.some((r) => r.id === route.id) ?? true;
      }
    }
  };

  return adapter;
}
```

### 1.2 Route Analysis and Manifest Generation

The adapter analyzes your custom router's route configuration and creates a
unified manifest that works with both systems:

```jsx
// adapter-core.js
import { createRequire } from 'module';

export async function analyzeCustomRoutes(routerConfig) {
  const routes = [];

  // Parse custom router configuration
  for (const route of routerConfig.routes || []) {
    const analyzed = await analyzeRoute(route);
    routes.push({
      id: route.path,
      pattern: convertToSvelteKitPattern(route.pattern),
      component: route.component,
      loadFunction: route.load,
      meta {
        ssr: route.ssr ?? true,
        csr: route.csr ?? true,
        prerender: route.prerender ?? false,
        hydration: route.hydration ?? 'auto'
      }
    });
  }

  return routes;
}

export function generateHybridManifest(customRoutes, builder) {
  // Create manifest compatible with both systems
  const manifest = {
    version: Date.now(),
    routes: customRoutes.map(route => ({
      // SvelteKit format
      id: route.id,
      pattern: route.pattern,
      names: extractParamNames(route.pattern),
      types: {},

      // Custom router extensions
      component: route.component,
      loadFunction: route.loadFunction,
      meta route.metadata
    })),

    // Runtime configuration
    runtime: {
      mode: 'hybrid', // 'spa' | 'ssr' | 'hybrid'
      hydration: 'progressive',
      fallback: '/__app/spa-fallback'
    }
  };

  return manifest;
}

```

### 1.3 Build Output Generation

The adapter generates optimized builds for different deployment scenarios:

```jsx
export async function buildDualModeAssets(builder, manifest, options) {
  const buildDir = builder.getBuildDirectory("custom-router");

  // 1. Generate SSR server bundle
  if (manifest.routes.some((r) => r.metadata.ssr)) {
    await generateSSRBundle(builder, manifest, {
      outDir: path.join(buildDir, "server"),
      entries: manifest.routes.filter((r) => r.metadata.ssr)
    });
  }

  // 2. Generate SPA client bundle
  await generateSPABundle(builder, manifest, {
    outDir: path.join(buildDir, "client"),
    entries: manifest.routes.filter((r) => r.metadata.csr)
  });

  // 3. Generate static assets for SSG routes
  const prerenderRoutes = manifest.routes.filter((r) => r.metadata.prerender);
  if (prerenderRoutes.length > 0) {
    await generateStaticAssets(builder, prerenderRoutes, {
      outDir: path.join(buildDir, "static")
    });
  }

  // 4. Generate runtime manifest
  await fs.writeFile(
    path.join(buildDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}
```

## Phase 2: Build-Time Processing

### 2.1 Vite Plugin for Development Integration

Create a Vite plugin that integrates your custom router with SvelteKit's
development server[4][5]:

```jsx
// vite-plugin-custom-router.js
import { createRouteWatcher } from "./route-watcher.js";
import { generateRouteTypes } from "./type-generation.js";

export function customRouterPlugin(options = {}) {
  let manifest;
  let routeWatcher;

  return {
    name: "custom-router-integration",

    buildStart() {
      // Initialize route watching for development
      routeWatcher = createRouteWatcher(options.routesDir);
      routeWatcher.on("change", async () => {
        manifest = await generateManifest(options);
        await generateRouteTypes(manifest);
      });
    },

    configResolved(config) {
      // Integrate with SvelteKit's configuration
      if (config.sveltekit) {
        config.sveltekit.router = {
          ...config.sveltekit.router,
          type: "custom",
          resolver: createCustomResolver(options)
        };
      }
    },

    configureServer(server) {
      // Add custom route handling middleware
      server.middlewares.use("/__custom-router", async (req, res, next) => {
        if (req.url === "/__custom-router/manifest") {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(manifest));
          return;
        }
        next();
      });
    },

    load(id) {
      // Transform route imports for SSR compatibility
      if (id.includes("?route-ssr")) {
        return generateSSRRouteWrapper(id);
      }
    },

    transform(code, id) {
      // Transform custom router calls to work with SvelteKit
      if (id.includes("custom-router")) {
        return transformRouterCode(code, manifest);
      }
    }
  };
}
```

### 2.2 Route Discovery and Code Generation

Implement intelligent route discovery that works with both file-based and
programmatic routes:

```jsx
// route-discovery.js
export async function discoverRoutes(routesDir, programmaticRoutes = []) {
  const routes = [...programmaticRoutes];

  // Discover file-based routes
  const files = await glob('**/*.{svelte,js,ts}', {
    cwd: routesDir,
    ignore: ['**/*.test.*', '**/.*']
  });

  for (const file of files) {
    const routePath = fileToRoutePath(file);
    const component = await analyzeComponent(path.join(routesDir, file));

    routes.push({
      path: routePath,
      file: path.join(routesDir, file),
      component,
      load: component.load,
      meta extractRouteMetadata(component)
    });
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

export async function generateRouteTypes(manifest) {
  const types = generateTypeScript(manifest);

  await fs.writeFile(
    path.join(process.cwd(), 'src/lib/router-types.d.ts'),
    types
  );
}

function generateTypeScript(manifest) {
  return `
// Auto-generated route types
export interface Routes {
${manifest.routes.map(route => {
  const params = extractRouteParams(route.pattern);
  const paramType = params.length > 0
    ? `{ ${params.map(p => `${p}: string`).join('; ')} }`
    : '{}';
  return `  '${route.id}': ${paramType};`;
}).join('\\n')}
}

export interface RouteData {
${manifest.routes.map(route =>
  `  '${route.id}': ${route.loadFunction ? 'any' : 'never'};`
).join('\\n')}
}
`;
}

```

### 2.3 SSG Pre-rendering Integration

Integrate with SvelteKit's prerendering system for static generation:

```jsx
// prerender-integration.js
export async function prerenderCustomRoutes(manifest, builder) {
  const prerenderRoutes = manifest.routes.filter((r) => r.metadata.prerender);

  for (const route of prerenderRoutes) {
    await prerenderRoute(route, builder);
  }
}

async function prerenderRoute(route, builder) {
  // 1. Execute load function if present
  const data = route.loadFunction ? await route.loadFunction() : {};

  // 2. Render component on server
  const component = await import(route.component);
  const rendered = component.render({ data });

  // 3. Generate static HTML
  const html = generateHTML(rendered, route, data);

  // 4. Write to static directory
  const outputPath = routeToOutputPath(route.id);
  await builder.writeClient(outputPath, html);

  // 5. Generate hydration data
  if (route.metadata.hydration !== "none") {
    const hydrationData = {
      route: route.id,
      data,
      timestamp: Date.now()
    };

    await builder.writeClient(
      outputPath.replace(".html", ".json"),
      JSON.stringify(hydrationData)
    );
  }
}
```

## Phase 3: Runtime Coordination

### 3.1 Server-Side Rendering Integration

Create SSR handlers that work seamlessly with your custom router:

```jsx
// ssr-handler.js
import { createCustomRouter } from "../router/index.js";

export function createSSRHandler(manifest, options = {}) {
  const router = createCustomRouter({
    routes: manifest.routes,
    mode: "ssr"
  });

  return async function handleSSR(event) {
    const { pathname, search } = new URL(event.request.url);

    // 1. Resolve route using custom router
    const match = router.resolve(pathname + search);
    if (!match) {
      return new Response("Not Found", { status: 404 });
    }

    // 2. Execute load function if present
    let data = {};
    if (match.route.loadFunction) {
      try {
        data = await match.route.loadFunction({
          params: match.params,
          url: new URL(event.request.url),
          request: event.request,
          platform: event.platform
        });
      } catch (error) {
        return handleSSRError(error, match.route);
      }
    }

    // 3. Render component
    const component = await import(match.route.component);
    const rendered = component.render({
      data,
      params: match.params,
      url: pathname + search
    });

    // 4. Generate HTML with hydration data
    const html = generateSSRHTML(rendered, {
      route: match.route,
      data,
      params: match.params,
      manifest
    });

    return new Response(html, {
      headers: { "content-type": "text/html" }
    });
  };
}
```

### 3.2 Client-Side Hydration Coordination

Implement intelligent hydration that works with Svelte 5 runes[6][8]:

```jsx
// hydration-coordinator.js
import { createCustomRouter } from '../router/index.js';

export class HydrationCoordinator {
  #manifest;
  #router;
  #hydrationState = $state(new Map());
  #isHydrating = $state(true);

  constructor(manifest) {
    this.#manifest = manifest;
    this.#router = createCustomRouter({
      routes: manifest.routes,
      mode: 'hydration'
    });

    // Coordinate hydration with Svelte 5 effects
    $effect(() => {
      if (this.#isHydrating) {
        this.#performHydration();
      }
    });
  }

  async #performHydration() {
    const route = this.#getCurrentRoute();
    if (!route) return;

    try {
      // 1. Retrieve hydration data
      const hydrationData = await this.#getHydrationData(route);

      // 2. Validate server-client consistency
      const isConsistent = this.#validateHydration(hydrationData);

      if (isConsistent) {
        // 3. Hydrate existing DOM
        await this.#hydrateRoute(route, hydrationData);
      } else {
        // 4. Fall back to client-side rendering
        console.warn('Hydration mismatch detected, falling back to CSR');
        await this.#clientRenderRoute(route);
      }

      // 5. Initialize client-side routing
      this.#initializeClientRouting();

      this.#isHydrating = false;
      this.#hydrationState.set(route.id, 'complete');

    } catch (error) {
      console.error('Hydration failed:', error);
      this.#fallbackToCSR();
    }
  }

  async #hydrateRoute(route, data) {
    const component = await import(route.component);

    // Use Svelte 5 mount with hydration
    const app = mount(component.default, {
      target: document.body,
      hydrate: true,
      props: {
         data.data,
        params: data.params
      }
    });

    this.#hydrationState.set(route.id, app);
  }

  #initializeClientRouting() {
    // Replace SvelteKit's client-side routing with custom router
    this.#router.start({
      target: document.body,
      hydrated: true,
      onNavigate: this.#handleNavigation.bind(this)
    });
  }

  async #handleNavigation(to, from) {
    const route = this.#router.resolve(to.pathname);

    if (route?.metadata.ssr && !this.#hydrationState.has(route.id)) {
      // Load route data and render client-side
      await this.#clientRenderRoute(route, to);
    }

    // Update browser history
    history.pushState({ route: route.id }, '', to.href);
  }
}

```

### 3.3 Universal Data Layer

Create a data layer that works across SSR, hydration, and client-side
navigation:

```jsx
// universal-data.svelte.js
export class UniversalDataLayer {
  #data = $state(new Map());
  #loading = $state(new Set());
  #errors = $state(new Map());

  // Derived state for reactive components
  get isLoading() {
    return $derived(this.#loading.size > 0);
  }

  get hasErrors() {
    return $derived(this.#errors.size > 0);
  }

  // Get data for a specific route
  getRouteData(routeId) {
    return $derived(() => this.#data.get(routeId));
  }

  // Load data with caching and deduplication
  async loadRouteData(route, context = {}) {
    const cacheKey = this.#getCacheKey(route, context);

    if (this.#loading.has(cacheKey)) {
      // Deduplicate concurrent requests
      return this.#waitForLoad(cacheKey);
    }

    if (this.#data.has(cacheKey)) {
      // Return cached data if still valid
      const cached = this.#data.get(cacheKey);
      if (this.#isCacheValid(cached)) {
        return cached.data;
      }
    }

    this.#loading.add(cacheKey);
    this.#errors.delete(cacheKey);

    try {
      let data;

      if (route.loadFunction) {
        data = await route.loadFunction(context);
      } else {
        data = {};
      }

      this.#data.set(cacheKey, {
        data,
        timestamp: Date.now(),
        route: route.id
      });

      return data;
    } catch (error) {
      this.#errors.set(cacheKey, error);
      throw error;
    } finally {
      this.#loading.delete(cacheKey);
    }
  }

  // Invalidate cached data
  invalidate(routeId, params = {}) {
    const keysToDelete = [];

    for (const [key, value] of this.#data.entries()) {
      if (value.route === routeId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.#data.delete(key);
      this.#errors.delete(key);
    });
  }

  #getCacheKey(route, context) {
    return `${route.id}:${JSON.stringify(context.params || {})}`;
  }

  #isCacheValid(cached) {
    // Simple TTL-based validation
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return Date.now() - cached.timestamp < maxAge;
  }
}

// Global instance for application use
export const dataLayer = new UniversalDataLayer();
```

## Integration Configuration

### SvelteKit Configuration

```jsx
// svelte.config.js
import { customRouterAdapter } from "./adapter-custom-router/index.js";
import { customRouterPlugin } from "./vite-plugin-custom-router.js";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  kit: {
    adapter: customRouterAdapter({
      routerConfig: {
        routes: "./src/routes.config.js",
        mode: "hybrid", // 'spa' | 'ssr' | 'hybrid'
        hydration: "progressive"
      },
      output: {
        ssr: true,
        csr: true,
        prerender: "auto"
      }
    }),

    // Disable SvelteKit's built-in routing for hybrid mode
    router: false,

    // Custom service worker for SPA fallback
    serviceWorker: {
      register: true,
      files: (filepath) => !/\\.DS_Store/.test(filepath)
    }
  },

  vite: {
    plugins: [
      customRouterPlugin({
        routesDir: "./src/routes",
        generateTypes: true,
        dev: {
          hmr: true,
          overlay: true
        }
      })
    ]
  }
};

export default config;
```

### Custom Router Configuration

```jsx
// src/routes.config.js
export const routes = [
  {
    path: "/",
    pattern: "^/$",
    component: "./routes/home.svelte",
    ssr: true,
    prerender: true
  },

  {
    path: "/blog/[slug]",
    pattern: "^/blog/([^/]+)/?$",
    component: "./routes/blog/[slug].svelte",
    load: async ({ params, fetch }) => {
      const post = await fetch(`/api/posts/${params.slug}`).then((r) =>
        r.json()
      );
      return { post };
    },
    ssr: true,
    csr: true
  },

  {
    path: "/dashboard/*",
    pattern: "^/dashboard(/.*)?$",
    component: "./routes/dashboard/app.svelte",
    ssr: false,
    csr: true,
    hydration: "none" // Pure SPA mode
  }
];

export const config = {
  mode: "hybrid",
  fallback: "/app",
  transitions: true,
  prefetch: "hover"
};
```

## Development Workflow

### 1. Development Mode

```bash
# Standard SvelteKit development with custom router
npm run dev

# The Vite plugin provides:
# - Hot module reloading for route changes
# - Type generation for route parameters
# - Development overlay for debugging
# - Route manifest updates on file changes

```

### 2. Build Process

```bash
# Build for production with multiple output modes
npm run build

# Generates:
# - SSR bundle for server-side rendering
# - SPA bundle for client-side routing
# - Static assets for prerendered routes
# - Service worker for offline support

```

### 3. Deployment Options

```bash
# Deploy SSR version to Node.js/edge runtime
npm run deploy:ssr

# Deploy static version to CDN
npm run deploy:static

# Deploy hybrid version with edge functions
npm run deploy:hybrid

```

## Testing Strategy

### Unit Testing

```jsx
// router-integration.test.js
import { expect, test } from 'vitest';
import { createTestAdapter } from './test-utils.js';

test('adapter generates correct manifest', async () => {
  const adapter = createTestAdapter({
    routes: [
      { path: '/', component: './home.svelte', ssr: true },
      { path: '/about', component: './about.svelte', prerender: true }
    ]
  });

  const manifest = await adapter.generateManifest();

  expect(manifest.routes).toHaveLength(2);
  expect(manifest.routes[0]).toMatchObject({
    id: '/',
    meta { ssr: true, prerender: false }
  });
});

```

### Integration Testing

```jsx
// hydration.test.js
import { expect, test } from "@playwright/test";

test("hydration preserves server state", async ({ page }) => {
  // Navigate to SSR page
  await page.goto("/blog/test-post");

  // Verify server-rendered content
  await expect(page.locator("h1")).toContainText("Test Post");

  // Wait for hydration to complete
  await page.waitForFunction(() => window.__HYDRATION_COMPLETE__);

  // Verify client-side interactivity
  await page.click("[data-like-button]");
  await expect(page.locator("[data-like-count]")).toContainText("1");
});
```

## Performance Optimization

### Bundle Splitting Strategy

- **Core Router**: Essential routing logic (~5KB gzipped)
- **SSR Runtime**: Server-side rendering helpers (~8KB)
- **Hydration Coordinator**: Client-side hydration logic (~6KB)
- **Route Components**: Lazy-loaded per route (variable)

### Caching Strategy

- **Route Manifest**: Cached with service worker, TTL 1 hour
- **Component Bundles**: Immutable caching with content hashing
- **Data Responses**: Stale-while-revalidate with customizable TTL
- **Hydration Data**: Session storage with consistency validation

## Migration Path

### From Pure SPA

1. Install adapter and configure SvelteKit
2. Add SSR metadata to existing routes
3. Implement load functions for data fetching
4. Test hydration consistency
5. Enable prerendering for static content

### From SvelteKit

1. Install custom router plugin
2. Configure hybrid routing mode
3. Migrate file-based routes to configuration
4. Test compatibility with existing patterns
5. Optimize bundle splitting and caching

## Conclusion

This implementation strategy provides a comprehensive solution for integrating a
custom Svelte 5 router with SvelteKit's SSR/SSG capabilities. The three-phase
approach ensures:

1. **Seamless Integration**: Full compatibility with SvelteKit's build system
   and deployment ecosystem
2. **Performance Optimization**: Intelligent code splitting, caching, and
   hydration strategies
3. **Developer Experience**: Type safety, hot reloading, and familiar
   development patterns
4. **Flexibility**: Support for pure SPA, SSR, SSG, and hybrid rendering modes
5. **Production Ready**: Comprehensive testing, error handling, and performance
   monitoring

The solution maintains the lightweight nature of your custom router while
unlocking the powerful SSR/SSG capabilities of SvelteKit, creating a
best-of-both-worlds architecture that scales from simple SPAs to complex
full-stack applications.
