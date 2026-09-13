import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { findTenantForUser } from '$lib/server/tenantAccess';
import { documentBytes, starterDocsDocument, validateDocsDocument, type DocsDocument } from '$lib/data/docsEditor';
import type { RequestHandler } from './$types';

const MAX_DOC_BYTES = 2_000_000;

async function getUserId(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

async function getTenant(request: Request) {
	const admin = createAdminClient();
	const userId = await getUserId(request, admin);
	if (!userId) return { admin, userId: null, tenant: null };
	let tenant = await findTenantForUser(admin, userId);
	if (!tenant) {
		await admin.rpc('ensure_tenant_for_user', { p_user_id: userId } as never);
		tenant = await findTenantForUser(admin, userId);
	}
	return { admin, userId, tenant };
}

export const GET: RequestHandler = async ({ request }) => {
	let context;
	try {
		context = await getTenant(request);
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	if (!context.userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	if (!context.tenant) return json({ ok: false, code: 'TENANT_NOT_FOUND' }, { status: 404 });
	if (context.tenant.role === 'member') return json({ ok: false, code: 'FORBIDDEN', message: 'Only workspace owners and admins can edit documentation.' }, { status: 403 });

	const { data, error } = await context.admin
		.from('docs_documents')
		.select('draft, draft_version, published, published_version, published_at')
		.eq('tenant_id', context.tenant.id)
		.maybeSingle();
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	const row = data as { draft?: DocsDocument; draft_version?: number; published?: DocsDocument | null; published_version?: number; published_at?: string | null } | null;
	const storedDraft = row?.draft;
	const isLegacyMock = storedDraft?.pages?.some((page) => page.title === 'Config Marketplace' || page.title === 'Market');
	const starterSlugs = new Set(starterDocsDocument.pages.map((page) => page.slug));
	const isUnstructuredStarterDraft = Boolean(
		storedDraft &&
		Array.isArray(storedDraft.pages) &&
		storedDraft.pages.length === starterDocsDocument.pages.length &&
		storedDraft.pages.every((page) => starterSlugs.has(page.slug) && !page.blocks?.length)
	);
	const draft = storedDraft && !isLegacyMock && !isUnstructuredStarterDraft ? storedDraft : starterDocsDocument;
	return json(
		{
			ok: true,
			draft,
			migrated: Boolean(isLegacyMock || isUnstructuredStarterDraft),
			version: row?.draft_version ?? 0,
			published: row?.published ?? null,
			publishedVersion: row?.published_version ?? 0,
			publishedAt: row?.published_at ?? null
		},
		{ headers: { 'cache-control': 'no-store', etag: `W/\"${row?.draft_version ?? 0}\"` } }
	);
};

export const PUT: RequestHandler = async ({ request }) => {
	let context;
	try {
		context = await getTenant(request);
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	if (!context.userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	if (!context.tenant) return json({ ok: false, code: 'TENANT_NOT_FOUND' }, { status: 404 });
	if (context.tenant.role === 'member') return json({ ok: false, code: 'FORBIDDEN', message: 'Only workspace owners and admins can edit documentation.' }, { status: 403 });
	if (Number(request.headers.get('content-length') ?? 0) > MAX_DOC_BYTES) return json({ ok: false, code: 'PAYLOAD_TOO_LARGE' }, { status: 413 });

	let body: { draft?: unknown; version?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST', message: 'Invalid JSON' }, { status: 400 });
	}
	const draft = body.draft as DocsDocument;
	if (!draft || typeof draft !== 'object') return json({ ok: false, code: 'INVALID', issues: ['Draft must be an object'] }, { status: 422 });
	if (documentBytes(draft) > MAX_DOC_BYTES) return json({ ok: false, code: 'PAYLOAD_TOO_LARGE' }, { status: 413 });
	const issues = validateDocsDocument(draft);
	if (issues.length) return json({ ok: false, code: 'INVALID', issues }, { status: 422 });
	const headerVersion = request.headers.get('if-match')?.replace(/[^0-9]/g, '');
	const expectedVersion = Number(headerVersion || body.version || 0);
	if (!Number.isInteger(expectedVersion) || expectedVersion < 0) return json({ ok: false, code: 'INVALID_VERSION' }, { status: 422 });

	if (expectedVersion === 0) {
		const { data, error } = await context.admin
			.from('docs_documents')
			.insert({ tenant_id: context.tenant.id, draft, draft_version: 1, updated_by: context.userId })
			.select('draft_version')
			.maybeSingle();
		if (error) {
			if (error.code === '23505') return json({ ok: false, code: 'CONFLICT', message: 'This document changed elsewhere. Reload it before saving.' }, { status: 409 });
			return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
		}
		return json({ ok: true, version: (data as { draft_version?: number } | null)?.draft_version ?? 1 });
	}

	const { data, error } = await context.admin
		.from('docs_documents')
		.update({ draft, draft_version: expectedVersion + 1, updated_by: context.userId })
		.eq('tenant_id', context.tenant.id)
		.eq('draft_version', expectedVersion)
		.select('draft_version')
		.maybeSingle();
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	if (!data) return json({ ok: false, code: 'CONFLICT', message: 'This document changed elsewhere. Reload it before saving.' }, { status: 409 });
	return json({ ok: true, version: (data as { draft_version?: number }).draft_version ?? expectedVersion + 1 });
};
