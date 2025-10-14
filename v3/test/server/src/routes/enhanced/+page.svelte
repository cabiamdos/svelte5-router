<script lang="ts">
  import { Router, goto, loggingMiddleware, createAuthGuard } from '@v3/api/enhanced';
  import type { MiddlewareFunction, GuardFunction } from '@v3/types';
  import Home from '$lib/Home.svelte';
  import About from '$lib/About.svelte';
  import Dashboard from '$lib/Dashboard.svelte';
  import Login from '$lib/Login.svelte';

  let authState = $state(false);
  let middlewareCalls = $state<string[]>([]);
  let hookCalls = $state<string[]>([]);

  // Check auth on mount
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      authState = localStorage.getItem('auth') === 'true';
    }
  });

  // Listen for auth changes
  $effect(() => {
    const handler = () => {
      if (typeof localStorage !== 'undefined') {
        authState = localStorage.getItem('auth') === 'true';
      }
    };
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  });

  const isAuthenticated = () => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth') === 'true';
    }
    return false;
  };

  const authGuard = createAuthGuard(isAuthenticated);

  const trackingMiddleware: MiddlewareFunction = async (context, next) => {
    middlewareCalls = [...middlewareCalls, `Navigating to: ${context.to}`];
    await next();
  };

  const timingMiddleware: MiddlewareFunction = async (context, next) => {
    const start = performance.now();
    await next();
    const duration = performance.now() - start;
    middlewareCalls = [...middlewareCalls, `Navigation took: ${duration.toFixed(2)}ms`];
  };

  const routes = [
    { 
      path: '/', 
      component: Home,
      hooks: {
        beforeEnter: (ctx) => {
          hookCalls = [...hookCalls, 'beforeEnter: Home'];
          return true;
        },
        afterEnter: (ctx) => {
          hookCalls = [...hookCalls, 'afterEnter: Home'];
        }
      }
    },
    { 
      path: '/about', 
      component: About,
      middleware: [trackingMiddleware]
    },
    { 
      path: '/dashboard', 
      component: Dashboard,
      guards: [authGuard],
      middleware: [trackingMiddleware, timingMiddleware],
      meta: { requiresAuth: true },
      hooks: {
        beforeEnter: () => {
          hookCalls = [...hookCalls, 'beforeEnter: Dashboard'];
          return true;
        },
        afterEnter: () => {
          hookCalls = [...hookCalls, 'afterEnter: Dashboard'];
        }
      }
    },
    { path: '/login', component: Login }
  ];

  const globalMiddleware = [loggingMiddleware];

  function logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth');
      authState = false;
    }
    goto('/login');
  }
</script>

<div data-testid="enhanced-api-test">
  <h1>Enhanced API Test</h1>
  
  <div data-testid="auth-status">
    Auth: {authState ? 'Logged In' : 'Logged Out'}
    {#if authState}
      <button data-testid="logout-button" onclick={logout}>Logout</button>
    {/if}
  </div>

  <nav data-testid="navigation">
    <button data-testid="nav-home" onclick={() => goto('/')}>Home</button>
    <button data-testid="nav-about" onclick={() => goto('/about')}>About</button>
    <button data-testid="nav-dashboard" onclick={() => goto('/dashboard')}>Dashboard</button>
    <button data-testid="nav-login" onclick={() => goto('/login')}>Login</button>
  </nav>

  <div data-testid="middleware-log">
    <h3>Middleware Calls:</h3>
    <ul>
      {#each middlewareCalls as call}
        <li data-testid="middleware-call">{call}</li>
      {/each}
    </ul>
  </div>

  <div data-testid="hook-log">
    <h3>Hook Calls:</h3>
    <ul>
      {#each hookCalls as call}
        <li data-testid="hook-call">{call}</li>
      {/each}
    </ul>
  </div>

  <div data-testid="router-content">
    <Router {routes} middleware={globalMiddleware} basePath="/enhanced" />
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
