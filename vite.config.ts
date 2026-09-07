import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: 'localhost',
		// Pinned per AGENTS.md contract: Supabase redirect URLs are registered
		// per exact localhost URL, so the port must never drift. strictPort
		// fails loudly instead of silently landing on a rejected URL.
		port: 3000,
		strictPort: true
	},
	preview: {
		host: 'localhost',
		port: 3000,
		strictPort: true
	}
});
