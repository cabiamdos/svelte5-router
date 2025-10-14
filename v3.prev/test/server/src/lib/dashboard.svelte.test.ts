import { page } from '@vitest/browser/context';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Dashboard from './Dashboard.svelte';

/**
 * Test suite for Dashboard component.
 *
 * Dashboard displays user-specific content and requires authentication.
 * It accepts an optional user prop with default value 'Guest'.
 *
 * Coverage:
 * - Default and custom user rendering
 * - User name handling
 * - Authentication context display
 * - Edge cases
 * - Accessibility
 */
describe('Dashboard Component', () => {
	describe('Initial Rendering', () => {
		test('renders with default user', async () => {
			render(Dashboard);

			const component = page.getByTestId('dashboard-component');
			await expect.element(component).toBeVisible();

			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('Dashboard');

			const welcomeText = component.getByText(/Welcome, Guest!/);
			await expect.element(welcomeText).toBeVisible();

			const authText = component.getByText('This route requires authentication');
			await expect.element(authText).toBeVisible();
		});

		test('renders with custom user', async () => {
			render(Dashboard, {
				props: {
					user: 'John Doe'
				}
			});

			const component = page.getByTestId('dashboard-component');
			const welcomeText = component.getByText(/Welcome, John Doe!/);
			await expect.element(welcomeText).toBeVisible();
		});

		test('handles undefined user prop', async () => {
			render(Dashboard, {
				props: {
					user: undefined
				}
			});

			const component = page.getByTestId('dashboard-component');
			const welcomeText = component.getByText(/Welcome, Guest!/);
			await expect.element(welcomeText).toBeVisible();
		});
	});

	describe('Content Rendering', () => {
		test('renders user name safely', async () => {
			render(Dashboard, {
				props: {
					user: '<script>alert("xss")</script>'
				}
			});

			const component = page.getByTestId('dashboard-component');
			const welcomeText = component.getByText(/Welcome,/);
			const text = await welcomeText.textContent();
			expect(text).toContain('<script>');
			expect(text).toContain('Welcome, <script>alert("xss")</script>!');
		});

		test('handles empty user string', async () => {
			render(Dashboard, {
				props: {
					user: ''
				}
			});

			const component = page.getByTestId('dashboard-component');
			const welcomeText = component.getByText(/Welcome, !/);
			await expect.element(welcomeText).toBeVisible();
		});

		test('handles special characters in user name', async () => {
			render(Dashboard, {
				props: {
					user: 'José García © 你好'
				}
			});

			const component = page.getByTestId('dashboard-component');
			const welcomeText = component.getByText(/Welcome, José García © 你好!/);
			await expect.element(welcomeText).toBeVisible();
		});
	});

	describe('Edge Cases', () => {
		test('handles very long user names', async () => {
			const longName = 'A'.repeat(200);
			render(Dashboard, {
				props: {
					user: longName
				}
			});

			const component = page.getByTestId('dashboard-component');
			const welcomeText = component.getByText(/Welcome,/);
			const text = await welcomeText.textContent();
			expect(text).toContain(longName);
		});

		test('handles numeric user names', async () => {
			render(Dashboard, {
				props: {
					user: 12345 as any
				}
			});

			const component = page.getByTestId('dashboard-component');
			const welcomeText = component.getByText(/Welcome, 12345!/);
			await expect.element(welcomeText).toBeVisible();
		});

		test('handles user names with newlines', async () => {
			render(Dashboard, {
				props: {
					user: 'First\nLast'
				}
			});

			const component = page.getByTestId('dashboard-component');
			const welcomeText = component.getByText(/Welcome,/);
			const text = await welcomeText.textContent();
			expect(text).toContain('First');
			expect(text).toContain('Last');
		});
	});

	describe('Accessibility', () => {
		test('maintains semantic HTML structure', async () => {
			render(Dashboard);

			const component = page.getByTestId('dashboard-component');
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('Dashboard');

			const paragraphs = component.locator('p').all();
			expect((await paragraphs).length).toBe(2);
		});

		test('has accessible content structure', async () => {
			render(Dashboard, {
				props: {
					user: 'Test User'
				}
			});

			const component = page.getByTestId('dashboard-component');

			const welcome = component.getByText(/Welcome, Test User!/);
			await expect.element(welcome).toBeVisible();
			const welcomeTag = await welcome.evaluate((el) => el.tagName);
			expect(welcomeTag).toBe('P');

			const authInfo = component.getByText('This route requires authentication');
			await expect.element(authInfo).toBeVisible();
			const authTag = await authInfo.evaluate((el) => el.tagName);
			expect(authTag).toBe('P');
		});
	});

	describe('Component Structure', () => {
		test('has correct test id', async () => {
			render(Dashboard);

			const component = page.getByTestId('dashboard-component');
			const testId = await component.getAttribute('data-testid');
			expect(testId).toBe('dashboard-component');
		});

		test('renders correct DOM structure', async () => {
			render(Dashboard);

			const component = page.getByTestId('dashboard-component');

			const headings = component.locator('h1').all();
			expect((await headings).length).toBe(1);

			const paragraphs = component.locator('p').all();
			expect((await paragraphs).length).toBe(2);
		});
	});
});
