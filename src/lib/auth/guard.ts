import { goto } from '$app/navigation';
import { supabase } from '$lib/supabaseClient';
import { authHref } from '$lib/auth/urls';

let sessionHandoff: Promise<boolean> | undefined;

async function importSessionHandoff(): Promise<boolean> {
	if (!supabase || typeof window === 'undefined') return false;
	if (sessionHandoff) return sessionHandoff;

	const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
	const accessToken = params.get('pc_access_token');
	const refreshToken = params.get('pc_refresh_token');
	if (params.get('pc_session_handoff') !== '1' || !accessToken || !refreshToken) return false;

	// Remove the tokens before awaiting the network call so they do not remain
	// in the address bar or browser history if the session import fails.
	history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
	sessionHandoff = supabase.auth
		.setSession({ access_token: accessToken, refresh_token: refreshToken })
		.then(({ error }) => !error)
		.catch(() => false);

	return sessionHandoff;
}

export async function requireSession(next: string): Promise<boolean> {
	if (!supabase) return false;
	await importSessionHandoff();
	const { data } = await supabase.auth.getSession();
	if (data.session) return true;
	const destination = authHref('login', next);
	if (destination.startsWith('http')) {
		window.location.assign(destination);
	} else {
		void goto(destination, { replaceState: true });
	}
	return false;
}
