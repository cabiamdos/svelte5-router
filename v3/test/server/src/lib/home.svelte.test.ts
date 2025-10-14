import { page } from '@vitest/browser/context';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Home from './Home.svelte';

/**
 * This test suite verifies the Home component functionality.
 *
 * The Home component displays a welcome message and description.
 * It accepts an optional message prop that customizes the heading.
 *
 * Coverage includes:
 * - Initial rendering with default and custom props
 * - Prop validation and handling
 * - Content rendering
 * - Edge cases with empty/long strings
 * - Accessibility features
 */
describe('Home Component', () => {
	describe('Initial Rendering', () => {
		/**
		 * Tests that the component renders with its default message.
		 * This ensures the component works without explicit props.
		 */
		test('renders with default props', async () => {
			render(Home);

			const component = page.getByTestId('home-component');
			await expect.element(component).toBeVisible();

			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('Welcome Home');

			const paragraph = component.getByText('This is the home page');
			await expect.element(paragraph).toBeVisible();
		});

		/**
		 * Tests that the component correctly displays custom message prop.
		 * This verifies prop binding and reactivity.
		 */
		test('renders with custom props', async () => {
			render(Home, {
				props: {
					message: 'Custom Welcome Message'
				}
			});

			const component = page.getByTestId('home-component');
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('Custom Welcome Message');
		});

		/**
		 * Tests graceful handling of missing/undefined props.
		 * Component should fall back to default message.
		 */
		test('handles missing props gracefully', async () => {
			render(Home, {
				props: {
					message: undefined
				}
			});

			const component = page.getByTestId('home-component');
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('Welcome Home');
		});
	});

	describe('Content Rendering', () => {
		/**
		 * Tests that HTML is rendered as text, not executed.
		 * Security check to ensure no XSS vulnerabilities.
		 */
		test('renders HTML content safely', async () => {
			render(Home, {
				props: {
					message: '<script>alert("xss")</script>Safe Text'
				}
			});

			const component = page.getByTestId('home-component');
			const heading = component.getByRole('heading', { level: 1 });
			// HTML should be escaped/rendered as text
			await expect.element(heading).toHaveTextContent('<script>alert("xss")</script>Safe Text');
		});

		/**
		 * Tests handling of empty string message.
		 * Component should still render container with empty heading.
		 */
		test('handles empty content', async () => {
			render(Home, {
				props: {
					message: ''
				}
			});

			const component = page.getByTestId('home-component');
			await expect.element(component).toBeVisible();

			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toBeVisible();
			await expect.element(heading).toHaveTextContent('');
		});

		/**
		 * Tests rendering of special characters and unicode.
		 * Ensures international content displays correctly.
		 */
		test('handles special characters', async () => {
			const specialMessage = 'Hello © 你好 🎉 <>&"\'';
			render(Home, {
				props: {
					message: specialMessage
				}
			});

			const component = page.getByTestId('home-component');
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent(specialMessage);
		});
	});

	describe('Edge Cases', () => {
		/**
		 * Tests handling of very long message strings.
		 * Ensures component doesn't break with extreme content.
		 */
		test('handles very long content', async () => {
			const longMessage = 'A'.repeat(1000);
			render(Home, {
				props: {
					message: longMessage
				}
			});

			const component = page.getByTestId('home-component');
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent(longMessage);
		});

		/**
		 * Tests handling of newlines and whitespace.
		 * Verifies proper text normalization.
		 */
		test('handles multi-line content', async () => {
			const multiLineMessage = 'Line 1\nLine 2\nLine 3';
			render(Home, {
				props: {
					message: multiLineMessage
				}
			});

			const component = page.getByTestId('home-component');
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('Line 1 Line 2 Line 3');
		});

		/**
		 * Tests handling of number props (type coercion).
		 * Ensures type safety doesn't cause runtime errors.
		 */
		test('handles non-string message types', async () => {
			render(Home, {
				props: {
					message: 12345 as any
				}
			});

			const component = page.getByTestId('home-component');
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('12345');
		});
	});

	describe('Accessibility', () => {
		/**
		 * Tests semantic HTML structure.
		 * Verifies proper heading hierarchy and landmarks.
		 */
		test('maintains semantic HTML structure', async () => {
			render(Home);

			const component = page.getByTestId('home-component');
			await expect.element(component).toBeVisible();

			// Verify heading exists and is level 1
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toBeVisible();

			// Verify paragraph exists
			const paragraph = component.getByText('This is the home page');
			await expect.element(paragraph).toBeVisible();
		});

		/**
		 * Tests that component container is accessible.
		 * Ensures screen readers can navigate the component.
		 */
		test('has accessible structure', async () => {
			render(Home, {
				props: {
					message: 'Accessible Home'
				}
			});

			const component = page.getByTestId('home-component');

			// Component should be a div (generic container)
			expect(await component.evaluate(el => el.tagName)).toBe('DIV');

			// Content should be accessible via role queries
			const heading = component.getByRole('heading');
			await expect.element(heading).toBeVisible();
			await expect.element(heading).toHaveTextContent('Accessible Home');
		});

		/**
		 * Tests keyboard navigation doesn't cause issues.
		 * Component has no interactive elements but should not interfere.
		 */
		test('supports keyboard navigation context', async () => {
			render(Home);

			const component = page.getByTestId('home-component');
			await expect.element(component).toBeVisible();

			// Component itself is not focusable
			await expect.element(component).not.toHaveAttribute('tabindex', '0');
		});
	});

	describe('Component Structure', () => {
		/**
		 * Tests that data-testid is properly applied.
		 * Ensures testing infrastructure works correctly.
		 */
		test('has correct test id', async () => {
			render(Home);

			const component = page.getByTestId('home-component');
			await expect.element(component).toHaveAttribute('data-testid', 'home-component');
		});

		/**
		 * Tests component renders as expected DOM structure.
		 * Verifies no unexpected nesting or elements.
		 */
		test('renders correct DOM structure', async () => {
			render(Home, {
				props: {
					message: 'Test'
				}
			});

			const component = page.getByTestId('home-component');

			// Should have exactly one h1
			const headings = component.locator('h1').all();
			expect((await headings).length).toBe(1);

			// Should have exactly one p
			const paragraphs = component.locator('p').all();
			expect((await paragraphs).length).toBe(1);
		});
	});
});
