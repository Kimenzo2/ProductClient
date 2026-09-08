import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import type { RequestHandler } from './$types';

/**
 * Sync a Supabase tenant into the shared Cloudflare D1 tenant registry
 * (`productclient-tenants`). That single registry is read by every hosted
 * page Worker — Documentation (`{slug}.productclient.com`), Status, and
 * Roadmap — so one record maps the tenant to all of its hosted pages.
 *
 * Postgres is the source of truth (slug uniqueness + reserved words are
 * enforced there). This endpoint is a mirror for hostname resolution:
 *
 *  - `id` is the Supabase tenant uuid, kept as the D1 primary key so the
 *    registry row is stable across renames.
 *  - On create the row is inserted; on rename the same row is updated in
 *    place, so the old slug stops resolving immediately and no stale record
 *    is left behind.
 *
 * Client code calls this after `ensureMyTenant` / `renameMyTenant` with the
 * already-validated slug. The endpoint re-validates anyway and never trusts
 * the client for uniqueness or format.
 */
export const POST: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	const authHeader = request.headers.get('authorization') ?? '';
	const authToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
	if (!authToken) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const { data: authData } = await admin.auth.getUser(authToken);
	const userId = authData.user?.id;
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

	let body: { id?: string; slug?: string; displayName?: string; name?: string } | null = null;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST', message: 'Invalid JSON' }, { status: 400 });
	}
	const idRaw = body?.id ? body.id.toString().trim() : '';
	if (!idRaw) return json({ ok: false, code: 'BAD_REQUEST', message: 'tenant id required' }, { status: 400 });
	const { data: tenant } = await admin.from('tenants').select('id, slug, name').eq('id', idRaw).eq('owner_id', userId).maybeSingle();
	if (!tenant) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const slugRaw = tenant.slug.trim().toLowerCase();
	const displayRaw = tenant.name.trim();
	// Mirror the server-side slug rules (same shape as Postgres normalize_slug).
	const slug = slugRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
	if (slug.length < 3 || slug.length > 63 || !/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(slug) || slug.includes('--')) {
		return json({ ok: false, code: 'INVALID_SLUG' }, { status: 422 });
	}
	const displayName = displayRaw.replace(/\s+/g, ' ').trim().slice(0, 120);
	if (!displayName) return json({ ok: false, code: 'INVALID_DISPLAY_NAME' }, { status: 422 });
	// Keep the canonical Supabase tenant uuid as the registry key so renames
	// update the same record in place. The client cannot choose these values.
	const id = tenant.id;

	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const databaseId = env.CLOUDFLARE_D1_DATABASE_ID;
	const cloudflareToken = env.CLOUDFLARE_API_TOKEN;
	if (!accountId || !databaseId || !cloudflareToken) {
		// Graceful: the tenant still works in Supabase; the hosted registry is
		// best-effort until the Cloudflare env is configured.
		return json({ ok: false, code: 'NOT_CONFIGURED', message: 'Cloudflare D1 not configured' }, { status: 503 });
	}

	// Cloudflare D1 REST: POST /accounts/{accountId}/d1/database/{databaseId}/query
	const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
	try {
		const resp = await fetch(url, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${cloudflareToken}`
			},
			body: JSON.stringify({
				sql: `INSERT INTO tenants (id, slug, display_name, status)
				      VALUES (?1, ?2, ?3, 'active')
				      ON CONFLICT (id) DO UPDATE SET
				        slug = excluded.slug,
				        display_name = excluded.display_name,
				        status = 'active',
				        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
				params: [id, slug, displayName]
			})
		});
		const data = (await resp.json()) as {
			success?: boolean;
			errors?: { message?: string }[];
			code?: string;
		};
		if (!resp.ok || data.success === false) {
			const message = (data.errors?.[0]?.message ?? '').toLowerCase();
			if (message.includes('unique constraint failed')) {
				// Slug is claimed by another tenant record — Postgres already
				// prevented this, but a race or manual edit can surface it here.
				return json({ ok: false, code: 'SLUG_TAKEN' }, { status: 409 });
			}
			return json({ ok: false, code: 'D1_ERROR', errors: data.errors ?? data.code }, { status: 502 });
		}
		return json({ ok: true, id, slug, displayName });
	} catch (e) {
		return json({ ok: false, code: 'FETCH_FAILED', message: String(e) }, { status: 502 });
	}
};
