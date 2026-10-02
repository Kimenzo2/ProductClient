import { createAdminClient } from '#lib/server/supabaseAdmin.js';
import { findTenantForUser } from '#lib/server/tenantAccess.js';
import { processGithubKitSyncJob } from '#lib/server/githubKitSync.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const admin = createAdminClient();
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return Response.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const { data: auth } = await admin.auth.getUser(token);
	const userId = auth.user?.id;
	if (!userId) return Response.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const tenant = await findTenantForUser(admin, userId);
	if (!tenant) return Response.json({ ok: false, code: 'TENANT_NOT_FOUND' }, { status: 404 });
	if (tenant.role === 'member') return Response.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });

	let body: { release_id?: string } = {};
	try {
		body = await request.json();
	} catch {
		// An empty body means process the next pending release for this tenant.
	}
	let query = admin.from('github_kit_sync_jobs').select('id').eq('tenant_id', tenant.id).eq('status', 'pending').order('created_at', { ascending: true }).limit(1);
	if (body.release_id?.trim()) query = query.eq('release_id', body.release_id.trim());
	const { data: jobs, error } = await query;
	if (error) return Response.json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	const job = jobs?.[0] as { id: string } | undefined;
	if (!job) return Response.json({ ok: true, status: 'idle' });

	try {
		const result = await processGithubKitSyncJob(admin, job.id);
		return Response.json({ ok: true, status: 'succeeded', sha: result.sha });
	} catch (error) {
		return Response.json({ ok: false, status: 'failed', code: 'GITHUB_SYNC_FAILED', message: error instanceof Error ? error.message : String(error) }, { status: 502 });
	}
};
