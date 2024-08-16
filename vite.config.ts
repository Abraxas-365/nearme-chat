import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import envCompatible from 'vite-plugin-env-compatible';

export default defineConfig({
	plugins: [sveltekit(), purgeCss(), envCompatible()]
});
