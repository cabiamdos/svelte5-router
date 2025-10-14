import { sveltekit } from '@sveltejs/kit/vite';
import sonda from 'sonda/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), sonda()]
});
