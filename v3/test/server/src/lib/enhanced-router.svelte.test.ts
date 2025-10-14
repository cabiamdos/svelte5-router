import { page } from "@vitest/browser/context";
import { describe, expect, test, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import EnhancedRouter from "@v3/api/enhanced/router.svelte";
import Home from "./Home.svelte";
import About from "./About.svelte";
import Dashboard from "./Dashboard.svelte";
import Login from "./Login.svelte";
import { goto, createAuthGuard } from "@v3/api/enhanced";

/**
 * Test suite for EnhancedRouter component.
 *
 * This suite verifies the functionality of the EnhancedRouter, covering:
 * - Middleware execution.
 * - Route guards and authentication.
 * - Lifecycle hooks.
 * - basePath handling.
 */
describe("EnhancedRouter", () => {
  beforeEach(() => {
    // Reset authentication state and URL before each test
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  const isAuthenticated = () => localStorage.getItem("auth") === "true";
  const authGuard = createAuthGuard(isAuthenticated);

  const routes = [
    { path: "/", component: Home },
    { path: "/about", component: About },
    {
      path: "/dashboard",
      component: Dashboard,
      guards: [authGuard]
    },
    { path: "/login", component: Login }
  ];

  describe("Guards and Authentication", () => {
    test("blocks access to protected route when not authenticated", async () => {
      render(EnhancedRouter, { props: { routes } });
      goto("/dashboard");

      // createAuthGuard redirects to /login
      await expect.element(page.getByTestId("login-component")).toBeVisible();
      expect(window.location.pathname).toBe("/login");
    });

    test("allows access to protected route when authenticated", async () => {
      localStorage.setItem("auth", "true");
      render(EnhancedRouter, { props: { routes } });

      goto("/dashboard");

      await expect.element(page.getByTestId("dashboard-component")).toBeVisible();
      expect(window.location.pathname).toBe("/dashboard");
    });
  });

  describe("Middleware", () => {
    let middlewareCalls: string[] = [];
    const trackingMiddleware = async (context, next) => {
      middlewareCalls.push(`Navigating to: ${context.to}`);
      await next();
    };

    const routesWithMiddleware = [
      { path: "/", component: Home },
      { path: "/about", component: About, middleware: [trackingMiddleware] }
    ];

    beforeEach(() => {
      middlewareCalls = [];
    });

    test("executes middleware on a route", async () => {
      render(EnhancedRouter, { props: { routes: routesWithMiddleware } });
      expect(middlewareCalls.length).toBe(0);

      goto("/about");

      // Wait for navigation and middleware execution
      await expect.poll(() => middlewareCalls.length).toBe(1);
      expect(middlewareCalls).toContain("Navigating to: /about");
    });
  });

  describe("With basePath", () => {
    test("handles navigation correctly with basePath", async () => {
      window.history.pushState({}, "", "/app");
      render(EnhancedRouter, { props: { routes, basePath: "/app" } });
      
      await expect.element(page.getByTestId("home-component")).toBeVisible();

      goto("/app/about");

      await expect.element(page.getByTestId("about-component")).toBeVisible();
      expect(window.location.pathname).toBe("/app/about");
    });

    test("handles guards correctly with basePath", async () => {
      window.history.pushState({}, "", "/app");
      render(EnhancedRouter, { props: { routes, basePath: "/app" } });
      
      goto("/app/dashboard");

      await expect.element(page.getByTestId("login-component")).toBeVisible();
      // The guard redirects to /login, which inside the router is relative to basePath
      // The SPA adapter will navigate to the absolute path
      expect(window.location.pathname).toBe("/login");
    });
  });
});
