import { page } from '@vitest/browser/context';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import About from './About.svelte';

/**
 * Test suite for About component.
 *
 * The About component displays router version information.
 * It accepts an optional version prop with default value '3.0.0'.
 *
 * Coverage:
 * - Default and custom version rendering
 * - Version string validation
 * - Edge cases with various version formats
 * - Accessibility
 */
describe('About Component', () => {
	describe('Initial Rendering', () => {
		test('renders with default version', async () => {
			render(About);

			const component = page.getByTestId('about-component');
			await expect.element(component).toBeVisible();

			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('About');

			const versionText = component.getByText(/Router Version:/);
			await expect.element(versionText).toHaveTextContent('Router Version: 3.0.0');
		});

		test('renders with custom version', async () => {
			render(About, {
				props: {
					version: '4.5.2-beta'
				}
			});

			const component = page.getByTestId('about-component');
			const versionText = component.getByText(/Router Version:/);
			await expect.element(versionText).toHaveTextContent('Router Version: 4.5.2-beta');
		});

		test('handles undefined version prop', async () => {
			render(About, {
				props: {
					version: undefined
				}
			});

			const component = page.getByTestId('about-component');
			const versionText = component.getByText(/Router Version:/);
			await expect.element(versionText).toHaveTextContent('Router Version: 3.0.0');
		});
	});

	describe('Content Rendering', () => {
		test('renders version safely', async () => {
			render(About, {
				props: {
					version: '<script>alert("xss")</script>'
				}
			});

			const component = page.getByTestId('about-component');
			const versionText = component.getByText(/Router Version:/);
			const text = await versionText.textContent();
			expect(text).toContain('<script>');
		});

		test('handles empty version string', async () => {
			render(About, {
				props: {
					version: ''
				}
			});

			const component = page.getByTestId('about-component');
			const versionText = component.getByText(/Router Version:/);
			await expect.element(versionText).toHaveTextContent('Router Version:');
		});

		test('handles special characters in version', async () => {
			render(About, {
				props: {
					version: 'v1.0.0+build.123'
				}
			});

			const component = page.getByTestId('about-component');
			const versionText = component.getByText(/Router Version:/);
			await expect.element(versionText).toHaveTextContent('Router Version: v1.0.0+build.123');
		});
	});

	describe('Edge Cases', () => {
		test('handles very long version strings', async () => {
			const longVersion = 'v'.repeat(100) + '1.0.0';
			render(About, {
				props: {
					version: longVersion
				}
			});

			const component = page.getByTestId('about-component');
			const versionText = component.getByText(/Router Version:/);
			const text = await versionText.textContent();
			expect(text).toContain(longVersion);
		});

		test('handles numeric version', async () => {
			render(About, {
				props: {
					version: 123 as any
				}
			});

			const component = page.getByTestId('about-component');
			const versionText = component.getByText(/Router Version:/);
			await expect.element(versionText).toHaveTextContent('Router Version: 123');
		});
	});

	describe('Accessibility', () => {
		test('maintains semantic HTML structure', async () => {
			render(About);

			const component = page.getByTestId('about-component');
			const heading = component.getByRole('heading', { level: 1 });
			await expect.element(heading).toHaveTextContent('About');

			const paragraph = component.locator('p').first();
			await expect.element(paragraph).toBeVisible();
		});

		test('has accessible content', async () => {
			render(About, {
				props: {
					version: '3.0.0'
				}
			});

			const component = page.getByTestId('about-component');
			const versionParagraph = component.getByText(/Router Version:/);
			await expect.element(versionParagraph).toBeVisible();

			const tagName = await versionParagraph.evaluate((el) => el.tagName);
			expect(tagName).toBe('P');
		});
	});

	describe('Component Structure', () => {
		test('has correct test id', async () => {
			render(About);

			const component = page.getByTestId('about-component');
			const testId = await component.getAttribute('data-testid');
			expect(testId).toBe('about-component');
		});

		test('renders correct DOM structure', async () => {
			render(About);

			const component = page.getByTestId('about-component');

			const headings = component.locator('h1').all();
			expect((await headings).length).toBe(1);

			const paragraphs = component.locator('p').all();
			expect((await paragraphs).length).toBe(1);
		});
	});
});
