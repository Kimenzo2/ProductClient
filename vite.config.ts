import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import UnoCSS from 'unocss/vite';
import extractorSvelte from '@unocss/extractor-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		UnoCSS({
			mode: 'per-module',
			extractors: [extractorSvelte()],
		}),
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
	resolve: {
		alias: {
			$lib: 'src/lib',
			'$lib/*': 'src/lib/*'
		}
	},
	server: {
		port: 3000,
		host: 'localhost'
	},
	preview: {
		port: 3000,
		host: 'localhost'
	}
});
