import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		UnoCSS(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			alias: {
				$lib: 'src/lib',
				'$lib/*': 'src/lib/*'
			},
			adapter: adapter()
		})
	],
	server: {
		port: 3000,
		host: 'localhost'
	},
	preview: {
		port: 3000,
		host: 'localhost'
	}
});
