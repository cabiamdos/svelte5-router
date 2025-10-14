<div class="container">
	<header>
		<h1>🚀 Svelte 5 Router v3</h1>
		<p class="tagline">Progressive, Type-Safe Routing for Svelte 5</p>
	</header>

	<section class="intro">
		<p>
			A modern, layered routing solution built specifically for Svelte 5 using runes. Choose your
			API level based on your needs - from simple to advanced.
		</p>
	</section>

	<section class="demos">
		<h2>🎯 Live Demos</h2>

		<div class="demo-grid">
			<a href="/simple" class="demo-card simple">
				<div class="card-header">
					<h3>📝 Simple API</h3>
					<span class="badge">Level 1</span>
				</div>
				<p>Basic routing with minimal configuration. Perfect for simple SPAs.</p>
				<ul>
					<li>✅ Path matching (static, params, wildcards)</li>
					<li>✅ Component rendering</li>
					<li>✅ Lazy loading</li>
					<li>✅ Query parameters</li>
				</ul>
				<div class="card-footer">
					<span class="link-text">View Demo →</span>
				</div>
			</a>

			<a href="/enhanced" class="demo-card enhanced">
				<div class="card-header">
					<h3>⚡ Enhanced API</h3>
					<span class="badge">Level 2</span>
				</div>
				<p>Adds middleware, guards, and lifecycle hooks for complex applications.</p>
				<ul>
					<li>✅ All Simple API features</li>
					<li>✅ Middleware pipeline</li>
					<li>✅ Route guards</li>
					<li>✅ Lifecycle hooks</li>
				</ul>
				<div class="card-footer">
					<span class="link-text">View Demo →</span>
				</div>
			</a>

			<a href="/advanced" class="demo-card advanced">
				<div class="card-header">
					<h3>🔧 Advanced API</h3>
					<span class="badge">Level 3</span>
				</div>
				<p>Full programmatic control with direct access to all internals.</p>
				<ul>
					<li>✅ All Enhanced API features</li>
					<li>✅ Pattern parser & matcher</li>
					<li>✅ Runtime adapters</li>
					<li>✅ Custom state management</li>
				</ul>
				<div class="card-footer">
					<span class="link-text">View Demo →</span>
				</div>
			</a>
		</div>
	</section>

	<section class="features">
		<h2>✨ Key Features</h2>

		<div class="feature-grid">
			<div class="feature">
				<div class="feature-icon">🎯</div>
				<h4>AST-Based Matching</h4>
				<p>No regex! O(n) pattern matching with AST compilation</p>
			</div>

			<div class="feature">
				<div class="feature-icon">⚡</div>
				<h4>Svelte 5 Runes</h4>
				<p>Built with $state, $derived, and $effect - no legacy syntax</p>
			</div>

			<div class="feature">
				<div class="feature-icon">📦</div>
				<h4>Tree-Shakeable</h4>
				<p>Modular design - only bundle what you use</p>
			</div>

			<div class="feature">
				<div class="feature-icon">🔒</div>
				<h4>Type-Safe</h4>
				<p>100% TypeScript with strict mode enabled</p>
			</div>

			<div class="feature">
				<div class="feature-icon">🌐</div>
				<h4>Universal</h4>
				<p>Works in SPA, SSR, and SSG environments</p>
			</div>

			<div class="feature">
				<div class="feature-icon">🧪</div>
				<h4>Well Tested</h4>
				<p>140+ tests with >90% code coverage</p>
			</div>
		</div>
	</section>

	<section class="pattern-examples">
		<h2>📚 Pattern Examples</h2>

		<div class="patterns">
			<div class="pattern-item">
				<code>/users/:id</code>
				<span class="pattern-desc">Single parameter</span>
			</div>

			<div class="pattern-item">
				<code>/users/:id?</code>
				<span class="pattern-desc">Optional parameter</span>
			</div>

			<div class="pattern-item">
				<code>/files/*path</code>
				<span class="pattern-desc">Wildcard segment</span>
			</div>

			<div class="pattern-item">
				<code>/files/**path</code>
				<span class="pattern-desc">Greedy wildcard</span>
			</div>

			<div class="pattern-item">
				<code>/posts/:id/comments/:commentId</code>
				<span class="pattern-desc">Multiple parameters</span>
			</div>
		</div>
	</section>

	<footer>
		<p>Built with ❤️ for Svelte 5</p>
		<p class="version">Version 3.0.0</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		text-align: center;
		color: white;
		margin-bottom: 3rem;
		padding: 2rem 0;
	}

	h1 {
		font-size: 3.5rem;
		margin: 0 0 1rem 0;
		font-weight: 700;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
	}

	.tagline {
		font-size: 1.5rem;
		opacity: 0.95;
		margin: 0;
	}

	.intro {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.intro p {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #555;
		margin: 0;
	}

	section {
		margin-bottom: 2rem;
	}

	h2 {
		color: white;
		font-size: 2rem;
		margin-bottom: 1.5rem;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
	}

	.demo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.demo-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		display: flex;
		flex-direction: column;
	}

	.demo-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.demo-card h3 {
		margin: 0;
		color: #333;
		font-size: 1.5rem;
	}

	.badge {
		background: #667eea;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.demo-card p {
		color: #666;
		line-height: 1.6;
		margin: 0 0 1rem 0;
	}

	.demo-card ul {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem 0;
		flex-grow: 1;
	}

	.demo-card li {
		padding: 0.5rem 0;
		color: #555;
	}

	.card-footer {
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.link-text {
		color: #667eea;
		font-weight: 600;
	}

	.demo-card:hover .link-text {
		text-decoration: underline;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.feature {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.feature h4 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.feature p {
		color: #666;
		margin: 0;
		line-height: 1.5;
	}

	.pattern-examples {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.pattern-examples h2 {
		color: #333;
		text-shadow: none;
	}

	.patterns {
		display: grid;
		gap: 1rem;
	}

	.pattern-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		border-left: 4px solid #667eea;
	}

	.pattern-item code {
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 1.1rem;
		color: #667eea;
		font-weight: 600;
	}

	.pattern-desc {
		color: #666;
	}

	footer {
		text-align: center;
		color: white;
		padding: 2rem 0;
		margin-top: 3rem;
	}

	footer p {
		margin: 0.5rem 0;
	}

	.version {
		opacity: 0.8;
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2.5rem;
		}

		.tagline {
			font-size: 1.2rem;
		}

		.demo-grid,
		.feature-grid {
			grid-template-columns: 1fr;
		}

		.pattern-item {
			flex-direction: column;
			text-align: center;
			gap: 0.5rem;
		}
	}
</style>
