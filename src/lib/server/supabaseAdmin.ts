import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

/**
 * Server-only Supabase client with `service_role` privileges (sb_secret_...).
 * Bypasses RLS — use only in server contexts (+page.server.ts, +server.ts, hooks.server.ts).
 *
 * Env: SUPABASE_SECRET_KEY (preferred) or SUPABASE_SERVICE_ROLE_KEY (legacy alias)
 * Never import this file from client code — src/lib/server/* is server-only by SvelteKit convention.
 */
function getSecretKey(): string {
	return (
		privateEnv.SUPABASE_SECRET_KEY ??
		(privateEnv as Record<string, string | undefined>).SUPABASE_SERVICE_ROLE_KEY ??
		''
	);
}

export function createAdminClient(): SupabaseClient {
	const url = PUBLIC_SUPABASE_URL;
	const secret = getSecretKey();

	if (!url) throw new Error('Missing PUBLIC_SUPABASE_URL');
	if (!secret) {
		throw new Error(
			'Missing SUPABASE_SECRET_KEY (add sb_secret_... to .env — server-only, never PUBLIC_)'
		);
	}

	return createClient(url, secret, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}

/** Singleton for convenience — same underlying secret, no session persistence. */
export const supabaseAdmin: SupabaseClient | null = (() => {
	try {
		return createAdminClient();
	} catch {
		// During build without env, return null — server routes should handle gracefully
		return null;
	}
})();
