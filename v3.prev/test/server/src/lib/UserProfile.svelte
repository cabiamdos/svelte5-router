<script lang="ts">
	let { id } = $props<{ id: string }>();
</script>

<div data-testid="user-profile-component">
	<h1>User Profile</h1>
	<p data-testid="user-id">User ID: {id}</p>
	<p>This is an async-loaded component</p>
</div>
