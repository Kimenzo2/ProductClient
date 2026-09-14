import { goto } from '$app/navigation';
import { env } from '$env/dynamic/public';
import { supabase } from '$lib/supabaseClient';
import { authHref } from '$lib/auth/urls';

let sessionHandoff: Promise<boolean> | undefined;
const HANDOFF_RETRY_DELAYS = [0, 120, 320] as const;

async function importSessionHandoff(): Promise<boolean> {
	if (!supabase || typeof window === 'undefined') return false;
	if (sessionHandoff !== undefined) {
		const result = await sessionHandoff;
		if (result) return true;
		sessionHandoff = undefined;
	}

	const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
	const accessToken = params.get('pc_access_token');
	const refreshToken = params.get('pc_refresh_token');
	if (params.get('pc_session_handoff') !== '1' || !accessToken || !refreshToken) return false;

	sessionHandoff = supabase.auth
		.setSession({ access_token: accessToken, refresh_token: refreshToken })
		.then(({ error }) => {
			if (error) return false;
			// Do not discard the handoff tokens until Supabase has accepted them.
			// Clearing the hash first made a transient setSession failure
			// irreversible and sent the user back to auth with no session.
			history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
			return true;
		})
		.catch(() => false);

	const ok = await sessionHandoff;
	if (!ok) sessionHandoff = undefined;
	return ok;
}

async function restoreSession(): Promise<boolean> {
	if (!supabase || typeof window === 'undefined') return false;
	const hasHandoff = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('pc_session_handoff') === '1';
	if (hasHandoff) {
		for (const delay of HANDOFF_RETRY_DELAYS) {
			if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
			if (await importSessionHandoff()) return true;
		}
	}
	const { data } = await supabase.auth.getSession();
	return Boolean(data.session);
}

export async function requireSession(next: string): Promise<boolean> {
	// DEV ONLY zero-auth flag (PUBLIC_DEV_AUTH_BYPASS=1 in .env.local):
	// dashboard renders on mock data with no session. PROD builds ignore it
	// unconditionally — it cannot leak to production. Restart dev after set.
	if (!import.meta.env.PROD && env.PUBLIC_DEV_AUTH_BYPASS === '1') {
		return true;
	}
	if (!supabase) return false;
	if (await restoreSession()) return true;
	const destination = authHref('login', next);
	if (destination.startsWith('http')) {
		window.location.assign(destination);
	} else {
		void goto(destination, { replaceState: true });
	}
	return false;
}
