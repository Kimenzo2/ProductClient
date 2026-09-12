import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import type { RequestHandler } from './$types';

async function hashPassword(pwd: string): Promise<string> {
	const enc = new TextEncoder().encode(pwd);
	const buf = await crypto.subtle.digest('SHA-256', enc);
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export const GET: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	const authHeader = request.headers.get('authorization') ?? '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
	if (!token) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const { data: authData } = await admin.auth.getUser(token);
	const userId = authData.user?.id;
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

	const { data: tenant } = await admin.from('tenants').select('id, slug, name, docs_access_mode, docs_agent_blurb').eq('owner_id', userId).maybeSingle();
	if (!tenant) return json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
	return json({ ok: true, tenant });
};

export const POST: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	const authHeader = request.headers.get('authorization') ?? '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
	if (!token) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const { data: authData } = await admin.auth.getUser(token);
	const userId = authData.user?.id;
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

	let body: { accessMode?: unknown; password?: unknown; agentBlurb?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST', message: 'Invalid JSON' }, { status: 400 });
	}
	const accessMode = typeof body.accessMode === 'string' ? body.accessMode.trim().toLowerCase() : 'public';
	if (!['public', 'password', 'private'].includes(accessMode)) return json({ ok: false, code: 'INVALID_ACCESS_MODE' }, { status: 422 });
	const agentBlurb = typeof body.agentBlurb === 'string' ? body.agentBlurb.trim().slice(0, 500) : null;

	const { data: tenant } = await admin.from('tenants').select('id, slug').eq('owner_id', userId).maybeSingle();
	if (!tenant) return json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });

	let passwordHash: string | null = null;
	if (accessMode === 'password') {
		const pwd = typeof body.password === 'string' ? body.password.trim() : '';
		if (!pwd || pwd.length < 4 || pwd.length > 120) return json({ ok: false, code: 'INVALID_PASSWORD', message: 'Password must be 4-120 chars' }, { status: 422 });
		passwordHash = await hashPassword(pwd);
	}

	const { error: updErr } = await admin
		.from('tenants')
		.update({ docs_access_mode: accessMode, docs_password_hash: passwordHash, docs_agent_blurb: agentBlurb })
		.eq('id', tenant.id);
	if (updErr) return json({ ok: false, code: 'SUPABASE_ERROR', message: updErr.message }, { status: 500 });

	// Sync to D1 registry (best-effort)
	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const databaseId = env.CLOUDFLARE_D1_DATABASE_ID;
	const cloudflareToken = env.CLOUDFLARE_API_TOKEN;
	if (accountId && databaseId && cloudflareToken) {
		const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
		try {
			await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json', authorization: `Bearer ${cloudflareToken}` },
				body: JSON.stringify({
					sql: `UPDATE tenants SET access_mode = ?1, site_password_hash = ?2, agent_blurb = ?3, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?4`,
					params: [accessMode, passwordHash, agentBlurb, tenant.id]
				})
			});
		} catch {}
	}

	return json({ ok: true, tenantId: tenant.id, accessMode, agentBlurb });
};
