import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'@v3': '../../../src'
		}
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts'],
		browser: {
			enabled: true,
			name: 'chromium',
			provider: 'playwright',
			headless: true,
			screenshotOnFailure: true
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.svelte', 'src/**/*.ts'],
			exclude: ['src/**/*.{test,spec}.ts', 'src/**/*.d.ts'],
			all: true,
			lines: 100,
			functions: 100,
			branches: 100,
			statements: 100
		}
	}
});
