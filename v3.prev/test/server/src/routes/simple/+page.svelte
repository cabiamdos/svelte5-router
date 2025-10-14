<script lang="ts">
	import { SimpleRouter, goto } from '@v3/api/simple';
	import Home from '$lib/Home.svelte';
	import About from '$lib/About.svelte';
	import Login from '$lib/Login.svelte';

	const routes = [
		{ path: '/', component: Home, props: { message: 'Simple API Home' } },
		{ path: '/about', component: About, props: { version: '3.0.0-simple' } },
		{ path: '/login', component: Login },
		{ path: '/users/:id', component: () => import('$lib/UserProfile.svelte') },
		{ path: '/users/:userId/posts/:postId', component: () => import('$lib/Posts.svelte') },
		{ path: '/files/*path', component: () => import('$lib/Posts.svelte') }
	];
</script>

<div data-testid="simple-api-test">
	<h1>Simple API Test</h1>

	<nav data-testid="navigation">
		<button data-testid="nav-home" onclick={() => goto('/simple/')}>Home</button>
		<button data-testid="nav-about" onclick={() => goto('/simple/about')}>About</button>
		<button data-testid="nav-user-123" onclick={() => goto('/simple/users/123')}>User 123</button>
		<button data-testid="nav-post" onclick={() => goto('/simple/users/42/posts/99')}>Post 99</button>
		<button data-testid="nav-files" onclick={() => goto('/simple/files/docs/test.pdf')}>Files</button>
	</nav>

	<div data-testid="router-content">
		<SimpleRouter {routes} basePath="/simple" />
	</div>
</div>

<style>
	nav {
		display: flex;
		gap: 0.5rem;
		margin: 1rem 0;
		padding: 1rem;
		background: #f0f0f0;
	}

	button {
		padding: 0.5rem 1rem;
		cursor: pointer;
	}
</style>
