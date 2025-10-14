import { page } from "@vitest/browser/context";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import SimpleRouter from "@v3/api/simple/router.svelte";
import Home from "./Home.svelte";
import About from "./About.svelte";
import UserProfile from "./UserProfile.svelte";
import { goto } from "@v3/api/simple";

/**
 * Test suite for SimpleRouter component.
 *
 * This suite verifies the functionality of the SimpleRouter, including:
 * - Rendering routes without a basePath.
 * - Correctly handling routing with a basePath.
 * - Lazy loading components.
 * - Parameter extraction.
 */
describe("SimpleRouter", () => {
  describe("Without basePath", () => {
    const routes = [
      { path: "/", component: Home },
      { path: "/about", component: About },
      { path: "/users/:id", component: UserProfile }
    ];

    test("renders the root component", async () => {
      render(SimpleRouter, { props: { routes } });
      await expect.element(page.getByTestId("home-component")).toBeVisible();
    });

    test("navigates to a different route", async () => {
      render(SimpleRouter, { props: { routes } });
      await expect.element(page.getByTestId("home-component")).toBeVisible();

      goto("/about");

      await expect.element(page.getByTestId("about-component")).toBeVisible();
    });

    test("handles route parameters", async () => {
      render(SimpleRouter, { props: { routes } });
      goto("/users/123");

      await expect.element(page.getByTestId("user-profile-component")).toBeVisible();
      await expect.element(page.getByTestId("user-id")).toHaveTextContent("User ID: 123");
    });
  });

  describe("With basePath", () => {
    const routes = [
      { path: "/", component: Home },
      { path: "/about", component: About },
      { path: "/users/:id", component: UserProfile }
    ];

    test("renders the root component with basePath", async () => {
      // Manually set the browser URL for the test environment
      window.history.pushState({}, "", "/app");

      render(SimpleRouter, { props: { routes, basePath: "/app" } });

      await expect.element(page.getByTestId("home-component")).toBeVisible();
    });

    test("navigates to a different route with basePath", async () => {
      window.history.pushState({}, "", "/app");
      render(SimpleRouter, { props: { routes, basePath: "/app" } });

      await expect.element(page.getByTestId("home-component")).toBeVisible();

      goto("/app/about");

      await expect.element(page.getByTestId("about-component")).toBeVisible();
    });

    test("handles route parameters with basePath", async () => {
      window.history.pushState({}, "", "/app");
      render(SimpleRouter, { props: { routes, basePath: "/app" } });
      
      goto("/app/users/456");

      await expect.element(page.getByTestId("user-profile-component")).toBeVisible();
      await expect.element(page.getByTestId("user-id")).toHaveTextContent("User ID: 456");
    });

    test("does not render component if path does not match basePath", async () => {
      window.history.pushState({}, "", "/other");
      render(SimpleRouter, { props: { routes, basePath: "/app" } });

      // Assuming your router renders nothing or a not-found component
      // Here, we check that none of the main components are visible.
      await expect.element(page.getByTestId("home-component")).not.toBeInTheDocument();
      await expect.element(page.getByTestId("about-component")).not.toBeInTheDocument();
    });
  });

  describe("Lazy Loading", () => {
    const routes = [
      { path: "/", component: Home },
      { path: "/profile/:id", component: () => import("./UserProfile.svelte") }
    ];

    test("lazily loads a component", async () => {
      render(SimpleRouter, { props: { routes } });
      goto("/profile/789");

      await expect.element(page.getByTestId("user-profile-component")).toBeVisible();
      await expect.element(page.getByTestId("user-id")).toHaveTextContent("User ID: 789");
    });
  });
});
