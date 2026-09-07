import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
	console.warn('Supabase env missing: PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

// Parent-domain cookie storage: one Supabase session shared across apex,
// auth.*, and app.*. localStorage is per-origin and cannot do this, which is
// why signed-in visitors looked like strangers on the marketing host.
// Dev (localhost): host-only cookie — still shared across ports, because the
// cookie model ignores ports.
//
// Threat model, stated plainly: this cookie is readable by page JavaScript
// (supabase-js must read it), so it resists XSS exactly as much as
// localStorage did — i.e. not at all. What it buys is SSO scope, not theft
// resistance. Real defenses remain: Supabase refresh-token rotation, short
// JWT lifetime on the dashboard, and RLS on every live table. When sensitive
// data flows, graduate to httpOnly cookies via @supabase/ssr or a BFF.
//
// Operational limits: cookie values cap near 4KB (no chunking here —
// standard sessions fit; huge user_metadata would silently truncate), and
// Safari ITP caps JS-set cookies to 7 days (Safari users re-login weekly).
// The storage key defaults to sb-<project-ref>-auth-token: both repos share
// one Supabase project, so they share one cookie name. That sharing is
// load-bearing for SSO — never override storageKey on one side only.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function sessionCookieDomain(): string | undefined {
	if (!import.meta.env.PROD) return undefined;
	return '.productclient.com';
}

function readSessionCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const cookies = document.cookie ? document.cookie.split('; ') : [];
	for (const entry of cookies) {
		const idx = entry.indexOf('=');
		if (idx < 0) continue;
		if (entry.slice(0, idx).trim() === name) {
			try {
				return decodeURIComponent(entry.slice(idx + 1));
			} catch {
				return entry.slice(idx + 1);
			}
		}
	}
	return null;
}

function writeSessionCookie(name: string, value: string): void {
	if (typeof document === 'undefined') return;
	const domain = sessionCookieDomain();
	let cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
	if (domain) cookie += `; Domain=${domain}`;
	if (import.meta.env.PROD) cookie += '; Secure';
	document.cookie = cookie;
}

function deleteSessionCookie(name: string): void {
	if (typeof document === 'undefined') return;
	const domain = sessionCookieDomain();
	let cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
	if (domain) cookie += `; Domain=${domain}`;
	if (import.meta.env.PROD) cookie += '; Secure';
	document.cookie = cookie;
}

export const supabase: SupabaseClient | null =
	supabaseUrl && supabaseKey
		? createClient(supabaseUrl, supabaseKey, {
				auth: {
					autoRefreshToken: true,
					persistSession: true,
					storage: {
						getItem: (key: string) => readSessionCookie(key),
						setItem: (key: string, value: string) => writeSessionCookie(key, value),
						removeItem: (key: string) => deleteSessionCookie(key)
					},
					// Auth callbacks and the cross-host session handoff are processed
					// explicitly so two clients cannot consume the same refresh token.
					detectSessionInUrl: false,
					flowType: 'pkce'
				}
			})
		: null;
