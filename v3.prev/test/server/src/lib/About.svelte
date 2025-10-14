<script lang="ts">
	let { version = '3.0.0' } = $props();
</script>

<div data-testid="about-component">
	<h1>About</h1>
	<p>Router Version: {version}</p>
</div>
