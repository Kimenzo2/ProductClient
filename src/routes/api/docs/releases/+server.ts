import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { findTenantForUser } from '$lib/server/tenantAccess';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const { data: auth } = await admin.auth.getUser(token);
	const userId = auth.user?.id;
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const tenant = await findTenantForUser(admin, userId);
	if (!tenant) return json({ ok: false, code: 'TENANT_NOT_FOUND' }, { status: 404 });
	const { data, error } = await admin
		.from('docs_releases')
		.select('id, version, content_hash, published_at, published_by, rollback_of_version, created_at')
		.eq('tenant_id', tenant.id)
		.order('version', { ascending: false })
		.limit(50);
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	return json({ ok: true, releases: data ?? [] }, { headers: { 'cache-control': 'no-store' } });
};
