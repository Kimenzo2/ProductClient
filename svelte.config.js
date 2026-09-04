import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		paths: {
			// The production app is also served on sibling subdomains. Keep shared
			// SvelteKit assets on the apex deployment so Cloudflare host routing
			// cannot intercept them as documentation assets.
			assets: process.env.VERCEL_ENV === 'production' ? 'https://productclient.com' : ''
		},
		alias: {
			$lib: 'src/lib',
			'$lib/*': 'src/lib/*'
		}
	}
};

export default config;
