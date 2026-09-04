const authOrigin = 'https://auth.productclient.com';
const appOrigin = 'https://app.productclient.com';

export type AuthDestination = 'login' | 'sign-up' | 'forgot-password' | 'reset-password' | 'callback' | 'confirm';

const productionAuthPaths: Record<AuthDestination, string> = {
	login: '/log-in',
	'sign-up': '/sign-up',
	'forgot-password': '/forgot-password',
	'reset-password': '/reset-password',
	callback: '/callback',
	confirm: '/confirm'
};

const localAuthPaths: Record<AuthDestination, string> = {
	login: '/auth',
	'sign-up': '/auth/sign-up',
	'forgot-password': '/auth/forgot-password',
	'reset-password': '/auth/reset-password',
	callback: '/auth/callback',
	confirm: '/auth/confirm'
};

/**
 * Keep authentication on its dedicated production host while preserving the
 * existing local and compatibility paths during development.
 */
export function authHref(destination: AuthDestination, next?: string): string {
	const href = import.meta.env.PROD
		? `${authOrigin}${productionAuthPaths[destination]}`
		: localAuthPaths[destination];

	return next ? `${href}?next=${encodeURIComponent(next)}` : href;
}

/**
 * Send an authenticated user to the application host after authentication.
 */
export function appHref(path: string): string {
	const normalizedPath = path.startsWith('/') ? path : '/workspace';
	return import.meta.env.PROD ? `${appOrigin}${normalizedPath}` : normalizedPath;
}
