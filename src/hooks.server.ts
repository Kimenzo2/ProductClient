import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
import type { Handle } from '@sveltejs/kit';

injectAnalytics({ mode: dev ? 'development' : 'production' });
injectSpeedInsights();

export const handle: Handle = async ({ event, resolve }) => {
	const host = event.url.hostname.toLowerCase();
	const isAppHost = host.startsWith('app.') || host === 'app';
	const path = event.url.pathname;

	// Skip static assets, API, and SvelteKit internals — let them resolve normally so CSS/JS never 404 on custom host
	if (path.startsWith('/_app') || path.startsWith('/_vercel') || path.startsWith('/api') || path.includes('.')) {
		return resolve(event);
	}

	// app.* is the internal workspace host (Cloudflare DNS → Vercel origin). Never serve marketing at app.*
	if (isAppHost) {
		// Root on app.* → workspace (keeps post-sign-up expectation: app.productclient.com === internal)
		if (path === '/') {
			return new Response(null, {
				status: 307,
				headers: { location: '/workspace' }
			});
		}
		// Block marketing-only routes on app host — redirect to workspace equivalent
		if (path === '/feed' || path === '/products' || path === '/launchpad' || path === '/following') {
			return new Response(null, {
				status: 307,
				headers: { location: '/workspace' }
			});
		}
	}

	// Apex host should not serve workspace internals as public — optional guard (keep, but allow direct link)
	// if (!isAppHost && path.startsWith('/workspace')) { /* could redirect to app host in production */ }

	return resolve(event);
};
