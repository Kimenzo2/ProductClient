import type { Reroute } from '@sveltejs/kit';

const authHost = 'auth.productclient.com';

const authHostRoutes: Record<string, string> = {
	'/': '/auth',
	'/log-in': '/auth',
	'/sign-up': '/auth/sign-up',
	'/forgot-password': '/auth/forgot-password',
	'/reset-password': '/auth/reset-password',
	'/callback': '/auth/callback',
	'/confirm': '/auth/confirm'
};

/**
 * Resolve clean authentication-host URLs to the existing route files without
 * changing the URL shown in the browser. This runs on the server and client,
 * so direct loads and SvelteKit client navigation use the same route map.
 */
export const reroute: Reroute = ({ url }) => {
	if (url.hostname.toLowerCase() !== authHost) return;

	return authHostRoutes[url.pathname] ?? url.pathname;
};
