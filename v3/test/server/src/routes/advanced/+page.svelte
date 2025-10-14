<script lang="ts">
	import type { GuardFunction, MiddlewareFunction } from '@v3/api/advanced';
	import {
		compileMatcher,
		createSPAAdapter,
		executeGuards,
		executePipeline,
		loggingMiddleware,
		parsePattern,
		RouterState,
		timingMiddleware
	} from '@v3/api/advanced';

	// State management
	const routerState = new RouterState();
	const adapter = createSPAAdapter();

	// Pattern matching examples
	let patternInput = $state('/users/:id/posts/:postId');
	let pathInput = $state('/users/123/posts/456');
	let matchResult = $state<any>(null);

	// Navigation logs
	let navigationLogs = $state<string[]>([]);
	let middlewareLogs = $state<string[]>([]);
	let guardLogs = $state<string[]>([]);

	// Auth state
	let isAuthenticated = $state(false);

	// Custom matcher demonstration
	function testMatcher() {
		const parsed = parsePattern(patternInput);
		const matcher = compileMatcher(parsed.ast);
		matchResult = matcher(pathInput);
		navigationLogs = [
			...navigationLogs,
			`Pattern: ${patternInput}`,
			`Path: ${pathInput}`,
			`Match: ${matchResult ? 'Success' : 'Failed'}`,
			matchResult ? `Params: ${JSON.stringify(matchResult.params)}` : ''
		];
	}

	// Custom middleware
	const customMiddleware: MiddlewareFunction = async (context, next) => {
		middlewareLogs = [
			...middlewareLogs,
			`[${new Date().toLocaleTimeString()}] Navigating to: ${context.to}`
		];
		await next();
		middlewareLogs = [
			...middlewareLogs,
			`[${new Date().toLocaleTimeString()}] Navigation complete`
		];
	};

	// Custom guard
	const customGuard: GuardFunction = async (context) => {
		const allowed = isAuthenticated;
		guardLogs = [
			...guardLogs,
			`[Guard] Checking route: ${context.to} - ${allowed ? 'ALLOWED' : 'DENIED'}`
		];
		return allowed;
	};

	// Manual navigation with middleware and guards
	async function navigateWithPipeline(path: string, requiresAuth: boolean = false) {
		navigationLogs = [...navigationLogs, `Starting navigation to: ${path}`];

		// Create middleware context
		const middlewareContext: any = {
			route: { matched: true, params: {}, query: {} },
			to: path,
			from: routerState.path,
			direction: 'push',
			state: {},
			runtime: 'spa',
			abort: () => {},
			data: {}
		};

		// Execute middleware
		const middlewareSuccess = await executePipeline(
			[loggingMiddleware, timingMiddleware, customMiddleware],
			middlewareContext
		);

		if (!middlewareSuccess) {
			navigationLogs = [...navigationLogs, 'Navigation aborted by middleware'];
			return;
		}

		// Execute guards if auth required
		if (requiresAuth) {
			const guardContext: any = {
				route: middlewareContext.route,
				to: path,
				from: routerState.path,
				direction: 'push',
				state: {},
				runtime: 'spa',
				redirect: () => {}
			};

			const guardSuccess = await executeGuards([customGuard], guardContext);

			if (!guardSuccess) {
				navigationLogs = [...navigationLogs, 'Navigation denied by guard'];
				return;
			}
		}

		// Navigate
		adapter.push(path);
		navigationLogs = [...navigationLogs, `Navigation complete: ${path}`];
	}

	function toggleAuth() {
		isAuthenticated = !isAuthenticated;
		guardLogs = [
			...guardLogs,
			`Auth state changed: ${isAuthenticated ? 'Logged In' : 'Logged Out'}`
		];
	}

	function clearLogs() {
		navigationLogs = [];
		middlewareLogs = [];
		guardLogs = [];
	}

	// Test different pattern types
	const patternExamples = [
		{ pattern: '/users/:id', path: '/users/123', description: 'Simple parameter' },
		{ pattern: '/users/:id?', path: '/users', description: 'Optional parameter' },
		{ pattern: '/files/*path', path: '/files/docs/test.pdf', description: 'Wildcard' },
		{ pattern: '/files/**path', path: '/files/a/b/c/d.txt', description: 'Greedy wildcard' },
		{
			pattern: '/posts/:id/comments/:commentId',
			path: '/posts/42/comments/99',
			description: 'Multiple parameters'
		}
	];

	let currentExample = $state(0);

	function testExample(index: number) {
		currentExample = index;
		const example = patternExamples[index];
		patternInput = example.pattern;
		pathInput = example.path;
		testMatcher();
	}
</script>

<div data-testid="advanced-api-test" class="container">
	<h1>Advanced API Test</h1>
	<p class="subtitle">Full programmatic control over routing internals</p>

	<!-- Pattern Matching Section -->
	<section class="section">
		<h2>🎯 Pattern Matching & AST</h2>
		<p>Direct access to pattern parser and matcher compiler</p>

		<div class="input-group">
			<label>
				Pattern:
				<input bind:value={patternInput} placeholder="/users/:id" />
			</label>
			<label>
				Path:
				<input bind:value={pathInput} placeholder="/users/123" />
			</label>
			<button onclick={testMatcher}>Test Match</button>
		</div>

		<div class="examples">
			<h3>Pattern Examples:</h3>
			{#each patternExamples as example, i}
				<button
					class="example-btn"
					onclick={() => testExample(i)}
					class:active={currentExample === i}
				>
					{example.description}
				</button>
			{/each}
		</div>

		{#if matchResult}
			<div class="result success">
				<h4>✅ Match Result:</h4>
				<pre>{JSON.stringify(matchResult, null, 2)}</pre>
			</div>
		{:else if matchResult === null && navigationLogs.length > 0}
			<div class="result error">
				<h4>❌ No Match</h4>
			</div>
		{/if}
	</section>

	<!-- Middleware Pipeline Section -->
	<section class="section">
		<h2>⚙️ Middleware Pipeline</h2>
		<p>Execute custom middleware with logging and timing</p>

		<div class="button-group">
			<button onclick={() => navigateWithPipeline('/home')}> Navigate /home </button>
			<button onclick={() => navigateWithPipeline('/about')}> Navigate /about </button>
			<button onclick={() => navigateWithPipeline('/dashboard', true)}>
				Navigate /dashboard (requires auth)
			</button>
		</div>

		<div class="logs">
			<h4>Middleware Logs:</h4>
			<div class="log-content">
				{#each middlewareLogs as log}
					<div class="log-entry">{log}</div>
				{/each}
				{#if middlewareLogs.length === 0}
					<div class="log-empty">No middleware logs yet...</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- Guards Section -->
	<section class="section">
		<h2>🛡️ Route Guards</h2>
		<p>Custom authentication and authorization guards</p>

		<div class="auth-status">
			<span
				>Auth Status: <strong
					>{isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</strong
				></span
			>
			<button onclick={toggleAuth}>
				{isAuthenticated ? 'Logout' : 'Login'}
			</button>
		</div>

		<div class="logs">
			<h4>Guard Logs:</h4>
			<div class="log-content">
				{#each guardLogs as log}
					<div class="log-entry">{log}</div>
				{/each}
				{#if guardLogs.length === 0}
					<div class="log-empty">No guard logs yet...</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- State Management Section -->
	<section class="section">
		<h2>📊 State Management</h2>
		<p>Direct access to RouterState with Svelte 5 runes</p>

		<div class="state-display">
			<div class="state-item">
				<strong>Current Path:</strong>
				{routerState.path}
			</div>
			<div class="state-item">
				<strong>State:</strong>
				{routerState.state}
			</div>
			<div class="state-item">
				<strong>Navigating:</strong>
				{routerState.navigating ? 'Yes' : 'No'}
			</div>
			<div class="state-item">
				<strong>Params:</strong>
				{JSON.stringify(routerState.params)}
			</div>
			<div class="state-item">
				<strong>Query:</strong>
				{JSON.stringify(routerState.query)}
			</div>
		</div>
	</section>

	<!-- Navigation Logs Section -->
	<section class="section">
		<h2>📝 Navigation Logs</h2>
		<button onclick={clearLogs} class="clear-btn">Clear All Logs</button>

		<div class="logs">
			<div class="log-content">
				{#each navigationLogs as log}
					<div class="log-entry">{log}</div>
				{/each}
				{#if navigationLogs.length === 0}
					<div class="log-empty">No navigation logs yet...</div>
				{/if}
			</div>
		</div>
	</section>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	h1 {
		color: #333;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #666;
		font-size: 1.1rem;
		margin-bottom: 2rem;
	}

	.section {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.section h2 {
		margin-top: 0;
		color: #444;
	}

	.section p {
		color: #666;
		margin-bottom: 1rem;
	}

	.input-group {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.input-group label {
		flex: 1;
		min-width: 200px;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-family: monospace;
		margin-top: 0.25rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		background: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	button:hover {
		background: #45a049;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.examples {
		margin: 1rem 0;
	}

	.example-btn {
		margin: 0.25rem;
		padding: 0.5rem 1rem;
		background: #2196f3;
		font-size: 0.9rem;
	}

	.example-btn:hover {
		background: #0b7dda;
	}

	.example-btn.active {
		background: #ff9800;
	}

	.result {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 4px;
	}

	.result.success {
		background: #e7f5e7;
		border: 1px solid #4caf50;
	}

	.result.error {
		background: #ffe7e7;
		border: 1px solid #f44336;
	}

	pre {
		background: white;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.9rem;
	}

	.logs {
		margin-top: 1rem;
	}

	.logs h4 {
		margin: 0 0 0.5rem 0;
		color: #555;
	}

	.log-content {
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 1rem;
		max-height: 300px;
		overflow-y: auto;
		font-family: monospace;
		font-size: 0.9rem;
	}

	.log-entry {
		padding: 0.25rem 0;
		border-bottom: 1px solid #eee;
	}

	.log-entry:last-child {
		border-bottom: none;
	}

	.log-empty {
		color: #999;
		font-style: italic;
	}

	.auth-status {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 1rem;
		background: white;
		border-radius: 4px;
	}

	.auth-status strong {
		color: #333;
	}

	.state-display {
		background: white;
		padding: 1rem;
		border-radius: 4px;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.state-item {
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 4px;
		border-left: 3px solid #4caf50;
	}

	.state-item strong {
		color: #333;
		display: block;
		margin-bottom: 0.25rem;
	}

	.clear-btn {
		background: #f44336;
		margin-bottom: 1rem;
	}

	.clear-btn:hover {
		background: #da190b;
	}
</style>
