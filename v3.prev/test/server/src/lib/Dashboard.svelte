<script lang="ts">
	let { user = 'Guest' } = $props();
</script>

<div data-testid="dashboard-component">
	<h1>Dashboard</h1>
	<p>Welcome, {user}!</p>
	<p>This route requires authentication</p>
</div>
