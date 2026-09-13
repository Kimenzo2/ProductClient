import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { findTenantForUser } from '$lib/server/tenantAccess';
import { validateDocsDocument, type DocsDocument } from '$lib/data/docsEditor';
import { mirrorDocsToD1 } from '$lib/server/docsPublish';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
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
	if (tenant.role === 'member') return json({ ok: false, code: 'FORBIDDEN', message: 'Only workspace owners and admins can publish documentation.' }, { status: 403 });

	let body: { version?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST', message: 'Invalid JSON' }, { status: 400 });
	}
	const expectedVersion = Number(body.version ?? 0);
	if (!Number.isInteger(expectedVersion) || expectedVersion < 1) return json({ ok: false, code: 'INVALID_VERSION' }, { status: 422 });

	const { data: row, error } = await admin
		.from('docs_documents')
		.select('draft, draft_version, published_version')
		.eq('tenant_id', tenant.id)
		.maybeSingle();
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	const current = row as { draft?: unknown; draft_version?: number; published_version?: number } | null;
	if (!current?.draft || current.draft_version !== expectedVersion) return json({ ok: false, code: 'CONFLICT', message: 'Save the latest draft before publishing.' }, { status: 409 });
	const issues = validateDocsDocument(current.draft);
	if (issues.length) return json({ ok: false, code: 'INVALID', issues }, { status: 422 });

	const publishedAt = new Date().toISOString();
	const publishedVersion = (current.published_version ?? 0) + 1;
	const { data: updated, error: updateError } = await admin
		.from('docs_documents')
		.update({ published: current.draft, published_version: publishedVersion, published_at: publishedAt, updated_by: userId })
		.eq('tenant_id', tenant.id)
		.eq('draft_version', expectedVersion)
		.eq('published_version', current.published_version ?? 0)
		.select('published_version')
		.maybeSingle();
	if (updateError) return json({ ok: false, code: 'DB_ERROR', message: updateError.message }, { status: 500 });
	if (!updated) return json({ ok: false, code: 'CONFLICT', message: 'This document changed elsewhere. Reload it before publishing.' }, { status: 409 });

	const mirror = await mirrorDocsToD1(tenant.slug, current.draft as DocsDocument, publishedVersion, publishedAt);
	if (!mirror.ok) return json({ ok: true, version: publishedVersion, warning: `Published to Supabase, but the hosted site is waiting for D1 sync: ${mirror.message ?? 'unknown error'}` });
	return json({ ok: true, version: publishedVersion, publishedAt });
};
