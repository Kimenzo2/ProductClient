import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { validateRoadmapDoc } from '$lib/data/roadmapEditor';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { findTenantForUser } from '$lib/server/tenantAccess';
import type { RequestHandler } from './$types';

const MAX_DOC_BYTES = 1_048_576; // 1 MB — matches D1 TEXT limit, prevents Zod DoS
// Enterprise: Click Publish is the only source of truth. No debounce / rate-limit timer.
// Concurrency is version-based (If-Match) — same as GOV.UK Publishing API optimistic-locking
// and Umbraco single-transaction publish. Double-click is guarded client-side via
// `publishing` flag + ref, not a 3s window.

async function getUserId(request: Request): Promise<string | null> {
	let supabaseAdmin;
	try {
		supabaseAdmin = createAdminClient();
	} catch {
		return null;
	}
	const authHeader = request.headers.get('authorization') ?? '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) return null;
	const { data } = await supabaseAdmin.auth.getUser(token);
	return data.user?.id ?? null;
}

async function getTenantId(userId: string) {
	const supabaseAdmin = createAdminClient();
	const tenant = await findTenantForUser(supabaseAdmin, userId);
	if (tenant) return tenant as { id: string; slug: string };
	const { data: ensured } = await supabaseAdmin.rpc('ensure_tenant_for_user', { p_user_id: userId } as never);
	if (!ensured) return null;
	return await findTenantForUser(supabaseAdmin, userId);
}

// Single Publish Writes: editor writes only on Publish. Supabase `roadmap_docs` is source of truth,
// D1 `roadmaps` is edge cache for `roadmap.productclient.com/{slug}` reads (10ms vs 210ms RTT).
export const GET: RequestHandler = async ({ request }) => {
	let supabaseAdmin;
	try {
		supabaseAdmin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	const userId = await getUserId(request);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const tenant = await getTenantId(userId);
	if (!tenant) return json({ ok: true, doc: null, version: 0 }, { headers: { 'cache-control': 'no-store' } });
	const { data: row } = await supabaseAdmin
		.from('roadmap_docs')
		.select('doc, published_at, version')
		.eq('tenant_id', tenant.id)
		.maybeSingle();
	return json(
		{ ok: true, doc: (row as { doc: unknown } | null)?.doc ?? null, version: (row as { version?: number } | null)?.version ?? 0 },
		{ headers: { 'cache-control': 'no-store', etag: `W/"${(row as { version?: number } | null)?.version ?? 0}"` } }
	);
};

export const POST: RequestHandler = async ({ request }) => {
	// Auth first — don't burn CPU on unauthenticated validation
	let supabaseAdmin;
	try {
		supabaseAdmin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	const userId = await getUserId(request);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED', message: 'Sign in required' }, { status: 401 });

	// Payload guard: Content-Length + JSON size
	const contentLength = Number(request.headers.get('content-length') ?? 0);
	if (contentLength > MAX_DOC_BYTES) {
		return json({ ok: false, code: 'PAYLOAD_TOO_LARGE' }, { status: 413 });
	}
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}
	const doc = (body as { doc?: unknown })?.doc;
	const jsonBytes = Buffer.byteLength(JSON.stringify(doc ?? ''), 'utf8');
	if (jsonBytes > MAX_DOC_BYTES) {
		return json({ ok: false, code: 'PAYLOAD_TOO_LARGE' }, { status: 413 });
	}

	const issues = validateRoadmapDoc(doc);
	if (issues.length > 0) return json({ ok: false, code: 'INVALID', issues }, { status: 422 });

	const tenant = await getTenantId(userId);
	if (!tenant) return json({ ok: false, code: 'TENANT_NOT_FOUND' }, { status: 404 });

	// Optimistic concurrency: If-Match with version (from GET etag)
	const ifMatch = request.headers.get('if-match');
	const expectedVersion = ifMatch ? Number(ifMatch.replace(/[^0-9]/g, '')) : null;

	const timestamp = new Date().toISOString();
	let publishedVersion: number | null = null;
	if (expectedVersion !== null && !Number.isNaN(expectedVersion)) {
		if (expectedVersion === 0) {
			const { data: inserted, error: insertErr } = await supabaseAdmin
				.from('roadmap_docs')
				.insert({ tenant_id: tenant.id, doc: doc as object, published_at: timestamp, updated_by: userId, version: 1 })
				.select('version')
				.maybeSingle();
			if (insertErr) {
				if (insertErr.code === '23505') return json({ ok: false, code: 'CONFLICT', message: 'Someone else published changes. Reload to get the latest.' }, { status: 409 });
				return json({ ok: false, code: 'DB_ERROR', message: insertErr.message }, { status: 500 });
			}
			publishedVersion = (inserted as { version?: number } | null)?.version ?? 1;
		} else {
			const { data: updated, error: updateErr } = await supabaseAdmin
				.from('roadmap_docs')
				.update({ doc: doc as object, published_at: timestamp, updated_by: userId })
				.eq('tenant_id', tenant.id)
				.eq('version', expectedVersion)
				.select('version')
				.maybeSingle();
			if (updateErr) return json({ ok: false, code: 'DB_ERROR', message: updateErr.message }, { status: 500 });
			if (!updated) {
				const { data: current } = await supabaseAdmin.from('roadmap_docs').select('version').eq('tenant_id', tenant.id).maybeSingle();
				return json({ ok: false, code: 'CONFLICT', message: 'Someone else published changes. Reload to get the latest.', currentVersion: (current as { version?: number } | null)?.version ?? 0 }, { status: 409 });
			}
			publishedVersion = (updated as { version?: number }).version ?? expectedVersion + 1;
		}
	} else {
		const { data: upserted, error: upsertErr } = await supabaseAdmin
			.from('roadmap_docs')
			.upsert({ tenant_id: tenant.id, doc: doc as object, published_at: timestamp, updated_by: userId }, { onConflict: 'tenant_id' })
			.select('version')
			.maybeSingle();
		if (upsertErr) return json({ ok: false, code: 'DB_ERROR', message: upsertErr.message }, { status: 500 });
		publishedVersion = (upserted as { version?: number } | null)?.version ?? null;
	}

	// Mirror to D1 edge cache (best-effort, but surface lag)
	const d1Result = await mirrorToD1(tenant.slug, doc, timestamp);
	if (!d1Result.ok) {
		// Publish succeeded in Supabase; D1 lag is non-fatal but visible to user
		return json({ ok: true, slug: tenant.slug, version: publishedVersion, warning: 'Published but edge cache is stale — will sync shortly' });
	}

	return json({ ok: true, slug: tenant.slug, version: publishedVersion });
};

async function mirrorToD1(slug: string, doc: unknown, timestamp: string): Promise<{ ok: boolean }> {
	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const databaseId = env.CLOUDFLARE_D1_DATABASE_ID;
	const token = env.CLOUDFLARE_API_TOKEN;
	if (!accountId || !databaseId || !token) return { ok: true };
	const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify({
				sql: 'INSERT INTO roadmaps (tenant_slug, doc, updated_at, published_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(tenant_slug) DO UPDATE SET doc=excluded.doc, updated_at=excluded.updated_at, published_at=excluded.published_at',
				params: [slug, JSON.stringify(doc), timestamp, timestamp]
			})
		});
		const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
		if (!res.ok || data?.success === false) return { ok: false };
		return { ok: true };
	} catch {
		return { ok: false };
	}
}
