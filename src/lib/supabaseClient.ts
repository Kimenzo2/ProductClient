import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

if (!supabaseUrl || !supabaseKey) {
	console.warn('Service configuration missing.');
}

/**
 * ProductClient's app host owns scheduled background refresh. Supabase may
 * still refresh an expiring session during getSession(); its server-side token
 * reuse window is what protects closely timed requests from separate origins.
 */
function ownsSessionRefresh(): boolean {
	if (typeof window === 'undefined') return false;
	const hostname = window.location.hostname.toLowerCase();
	return (
		hostname === 'app.productclient.com' ||
		hostname === 'app' ||
		((hostname === 'localhost' || hostname === '127.0.0.1') && window.location.port === '3000')
	);
}

const browserAuthOptions = {
	autoRefreshToken: ownsSessionRefresh(),
	persistSession: true,
	detectSessionInUrl: false,
	flowType: 'pkce' as const
};

function createSupabaseClient(): SupabaseClient | null {
	if (!supabaseUrl || !supabaseKey) return null;

	// This module is also imported during SvelteKit SSR. Keep that server-side
	// client stateless; only the browser client reads/writes the shared cookies.
	if (typeof window === 'undefined') {
		return createClient(supabaseUrl, supabaseKey, {
			auth: {
				...browserAuthOptions,
				autoRefreshToken: false,
				persistSession: false
			}
		});
	}

	return createBrowserClient(supabaseUrl, supabaseKey, {
		cookieOptions: {
			...(import.meta.env.PROD ? { domain: '.productclient.com', secure: true } : {}),
			path: '/',
			sameSite: 'lax',
			maxAge: COOKIE_MAX_AGE
		},
		auth: browserAuthOptions
	});
}

export const supabase = createSupabaseClient();
