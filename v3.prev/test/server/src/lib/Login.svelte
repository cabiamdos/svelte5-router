<script lang="ts">
	function handleLogin() {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('auth', 'true');
		}
		window.dispatchEvent(new CustomEvent('auth-changed'));
	}
</script>

<div data-testid="login-component">
	<h1>Login</h1>
	<button data-testid="login-button" onclick={handleLogin}> Login </button>
</div>
