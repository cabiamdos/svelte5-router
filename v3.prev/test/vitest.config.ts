import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["e2e/**/*.test.ts", "unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["../src/**/*.ts", "../src/**/*.svelte.ts"],
      exclude: ["../src/**/*.test.ts", "../src/types.ts"],
      all: true,
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90
    }
  },
  resolve: {
    alias: {
      "@v3": "../src"
    }
  }
});
