import { page } from '@vitest/browser/context';
import { describe, expect, test, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Login from './Login.svelte';

/**
 * Test suite for Login component.
 *
 * The Login component provides authentication functionality.
 * It sets localStorage and dispatches a custom auth-changed event.
 *
 * Coverage:
 * - Initial rendering
 * - Button interactions
 * - LocalStorage manipulation
 * - Custom event dispatching
 * - Accessibility
 */
describe('Login Component', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		if (typeof localStorage !== 'undefined') {
			localStorage.clear();
		}
	});

	describe('Initial Rendering', () => {
		test('renders login component', async () => {
			render(Login);

			const component = page.getByTestId('login-component');
			await expect.element(component).toBeVisible();

			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('Login');

			const button = page.getByTestId('login-button');
			await expect.element(button).toBeVisible();
			await expect.element(button).toHaveTextContent('Login');
		});
	});

	describe('User Interactions', () => {
		test('handles login button click', async () => {
			render(Login);

			const button = page.getByTestId('login-button');
			await button.click();

			// Verify localStorage was set
			const authValue = localStorage.getItem('auth');
			expect(authValue).toBe('true');
		});

		test('dispatches auth-changed event on login', async () => {
			render(Login);

			let eventDispatched = false;
			const handler = () => {
				eventDispatched = true;
			};
			window.addEventListener('auth-changed', handler);

			const button = page.getByTestId('login-button');
			await button.click();

			// Small delay to allow event to propagate
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(eventDispatched).toBe(true);

			window.removeEventListener('auth-changed', handler);
		});
	});

	describe('Accessibility', () => {
		test('has accessible button', async () => {
			render(Login);

			const button = page.getByTestId('login-button');
			await expect.element(button).toBeVisible();

			const role = await button.evaluate((el) => el.getAttribute('role') || el.tagName);
			expect(role === 'BUTTON' || role === 'button').toBe(true);
		});

		test('button is keyboard accessible', async () => {
			render(Login);

			const button = page.getByTestId('login-button');

			// Verify button is focusable
			const tabIndex = await button.evaluate((el) => el.tabIndex);
			expect(tabIndex).toBeGreaterThanOrEqual(0);
		});

		test('maintains semantic HTML structure', async () => {
			render(Login);

			const component = page.getByTestId('login-component');
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toBeVisible();

			const button = component.getByRole('button', { name: /Login/i });
			await expect.element(button).toBeVisible();
		});
	});

	describe('Component Structure', () => {
		test('has correct test id', async () => {
			render(Login);

			const component = page.getByTestId('login-component');
			const testId = await component.getAttribute('data-testid');
			expect(testId).toBe('login-component');
		});

		test('renders correct DOM structure', async () => {
			render(Login);

			const component = page.getByTestId('login-component');

			const headings = component.locator('h1').all();
			expect((await headings).length).toBe(1);

			const buttons = component.locator('button').all();
			expect((await buttons).length).toBe(1);
		});
	});
});
