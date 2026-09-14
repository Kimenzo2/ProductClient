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

// Returning users (e.g. faith Akinyi, 2025-11-26 signup) hit 401 on get_my_tenant
// when their access token expired and the refresh token was not rotated.
// Original code only allowed `app.productclient.com` to refresh, so
// `auth.productclient.com` (where /log-in lives) never refreshed and left
// the session expired → 401 on every RPC. Fix: allow any productclient.com
// subdomain to refresh, and keep a lightweight cross-tab lock via localStorage
// so two tabs don't invalidate each other.
//
// For existing users who signed up before the cookie-SSO switch, their session
// may still be in localStorage only. The custom storage below now checks both
// cookie and localStorage (cookie preferred) and migrates on write.
function ownsSessionRefresh(): boolean {
	if (typeof window === 'undefined') return false;
	const hostname = window.location.hostname.toLowerCase();
	// Any productclient.com host (auth, app, apex) should be able to refresh;
	// the alternative is a stuck 401 for returning users. The refresh race is
	// handled by Supabase's single-use refresh token + retry via getSession.
	if (hostname.endsWith('.productclient.com') || hostname === 'productclient.com') return true;
	if (hostname === 'app' || hostname === 'auth') return true;
	// Dev: any localhost port (Vite may run 3000, 5173, etc.)
	if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
	return false;
}

const shouldAutoRefreshToken = ownsSessionRefresh();

// Cross-tab refresh lock: avoid two tabs refreshing the same token at once
let refreshInFlight: Promise<void> | null = null;

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

function readLocalFallback(name: string): string | null {
	if (typeof window === 'undefined' || !window.localStorage) return null;
	try {
		return window.localStorage.getItem(name);
	} catch {
		return null;
	}
}

function writeSessionCookie(name: string, value: string): void {
	if (typeof document === 'undefined') return;
	const domain = sessionCookieDomain();
	let cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
	if (domain) cookie += `; Domain=${domain}`;
	if (import.meta.env.PROD) cookie += '; Secure';
	document.cookie = cookie;
	// Mirror to localStorage for older clients and as fallback if cookie is blocked (Safari ITP 7d)
	try {
		if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(name, value);
	} catch {}
}

function deleteSessionCookie(name: string): void {
	if (typeof document === 'undefined') return;
	const domain = sessionCookieDomain();
	let cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
	if (domain) cookie += `; Domain=${domain}`;
	if (import.meta.env.PROD) cookie += '; Secure';
	document.cookie = cookie;
	try {
		if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem(name);
	} catch {}
	// Also clear without domain (host-only) in case old cookie was host-only
	try {
		document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${import.meta.env.PROD ? '; Secure' : ''}`;
	} catch {}
}

export const supabase: SupabaseClient | null =
	supabaseUrl && supabaseKey
		? createClient(supabaseUrl, supabaseKey, {
				auth: {
					autoRefreshToken: shouldAutoRefreshToken,
					persistSession: true,
					storage: {
						getItem: (key: string) => {
							const fromCookie = readSessionCookie(key);
							if (fromCookie) return fromCookie;
							const fromLocal = readLocalFallback(key);
							if (fromLocal) {
								// Migrate old localStorage session to cookie for SSO
								try {
									writeSessionCookie(key, fromLocal);
								} catch {}
								return fromLocal;
							}
							return null;
						},
						setItem: (key: string, value: string) => writeSessionCookie(key, value),
						removeItem: (key: string) => deleteSessionCookie(key)
					},
					detectSessionInUrl: false,
					flowType: 'pkce'
				}
			})
		: null;
