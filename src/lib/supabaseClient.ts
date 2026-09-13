import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
	console.warn('Service configuration missing.');
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

// The session cookie is intentionally shared across hosts, but refresh-token
// rotation must have one owner. The auth/marketing hosts can read the session
// for SSO; only the app host is allowed to exchange refresh tokens. Without
// this boundary, the auth tab and workspace tab can refresh the same token at
// nearly the same time and one tab invalidates the other.
function ownsSessionRefresh(): boolean {
	if (typeof window === 'undefined') return false;
	const hostname = window.location.hostname.toLowerCase();
	return (
		hostname === 'app.productclient.com' ||
		hostname === 'app' ||
		((hostname === 'localhost' || hostname === '127.0.0.1') && window.location.port === '3000')
	);
}

const shouldAutoRefreshToken = ownsSessionRefresh();

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
					autoRefreshToken: shouldAutoRefreshToken,
					persistSession: true,
					storage: {
						getItem: (key: string) => readSessionCookie(key),
						setItem: (key: string, value: string) => writeSessionCookie(key, value),
						removeItem: (key: string) => deleteSessionCookie(key)
					},
					// Auth callbacks and the cross-host session handoff are processed
					// explicitly. Only the app host refreshes the shared session.
					detectSessionInUrl: false,
					flowType: 'pkce'
				}
			})
		: null;
