import type { Session } from '@supabase/supabase-js';

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
 * Invariant: `path` must exist on the APP host, not this one — the handoff
 * carries no memory of where it came from, only where it is going.
 */
export function appHref(path: string, session?: Pick<Session, 'access_token' | 'refresh_token'>): string {
	const normalizedPath = path.startsWith('/') ? path : '/workspace';
	const href = import.meta.env.PROD ? `${appOrigin}${normalizedPath}` : normalizedPath;

	// Browser storage is isolated by origin. Carry a newly-created production
	// session to app.* once so the app host can persist it in its own storage.
	// The fragment is never sent in the HTTP request and is removed immediately
	// after the app imports the session.
	if (!session || !import.meta.env.PROD) return href;

	const handoff = new URLSearchParams({
		pc_session_handoff: '1',
		pc_access_token: session.access_token,
		pc_refresh_token: session.refresh_token
	});
	return `${href}#${handoff.toString()}`;
}

/**
 * Open a blank tab synchronously inside a user gesture (click/submit), before
 * any await. Popup blockers allow this; navigating it later always works.
 * Returns null when popups are blocked — callers must fall back to same-tab
 * navigation. Never call this after an await: the gesture is gone by then.
 */
export function openBlankTab(): Window | null {
	if (typeof window === 'undefined') return null;
	try {
		const tab = window.open('about:blank', '_blank');
		if (tab) tab.opener = null;
		return tab;
	} catch {
		return null;
	}
}

/**
 * Marketing host where signed-in visitors land after auth handoffs.
 */
export function feedHref(): string {
	return import.meta.env.PROD ? 'https://productclient.com/feed' : '/feed';
}

/**
 * Complete a cross-origin app handoff: the dashboard opens in the captured
 * tab, and this tab moves on to the discovery feed a beat later so a
 * signed-in visitor is never stranded on a dead auth page. Falls back to
 * same-tab navigation when popups are blocked.
 */
export function completeAppHandoff(tab: Window | null, destination: string): void {
	if (tab && !tab.closed) {
		tab.location.href = destination;
		window.setTimeout(() => {
			window.location.assign(feedHref());
		}, 600);
		return;
	}
	window.location.assign(destination);
}
