<script lang="ts">
	let { message = 'Welcome Home' } = $props();
</script>

<div data-testid="home-component">
	<h1>{message}</h1>
	<p>This is the home page</p>
</div>
