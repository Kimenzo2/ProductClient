import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { createIssue, getGithubIssue } from '$lib/server/githubApp';
import { parseGithubReference, recordGithubAudit } from '$lib/server/githubCanonical';
import type { RequestHandler } from './$types';

async function getUserId(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

type IncidentLookup = { id: string; tenant_id: string; title?: string | null; summary?: string | null };

async function findIncident(admin: ReturnType<typeof createAdminClient>, identifier: string, fields: string) {
	const normalized = identifier.trim();
	if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
		return (await admin.from('incidents').select(fields).eq('id', normalized).maybeSingle()) as unknown as { data: IncidentLookup | null; error: { message: string } | null };
	}
	return (await admin.from('incidents').select(fields).eq('external_id', normalized).maybeSingle()) as unknown as { data: IncidentLookup | null; error: { message: string } | null };
}

export const GET: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await getUserId(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const incidentId = url.searchParams.get('incident_id');
	if (!incidentId) return json({ ok: false, code: 'MISSING_INCIDENT_ID' }, { status: 400 });
	const { data: incident } = await findIncident(admin, incidentId, 'id, tenant_id');
	if (!incident) return json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
	const { data: tenant } = await admin.from('tenants').select('owner_id').eq('id', incident.tenant_id).maybeSingle();
	if (!tenant || tenant.owner_id !== userId) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const { data, error } = await admin.from('incident_github_links').select('*').eq('incident_id', incident.id).order('created_at', { ascending: true });
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	return json({ ok: true, links: data ?? [] });
};

export const POST: RequestHandler = async ({ request }) => {
	const admin = createAdminClient();
	const userId = await getUserId(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	let body: { incident_id?: string; product_id?: string; reference?: string; action?: 'attach' | 'create' };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}
	const reference = body.reference?.trim();
	if (!body.incident_id || !body.product_id || (body.action !== 'create' && !reference)) return json({ ok: false, code: 'MISSING_FIELDS' }, { status: 400 });
	const parsed = reference ? parseGithubReference(reference) : null;
	if (body.action !== 'create' && !parsed) return json({ ok: false, code: 'INVALID_GITHUB_REFERENCE', message: 'Use a GitHub pull request or issue URL.' }, { status: 422 });
	const { data: incident } = await findIncident(admin, body.incident_id, 'id, tenant_id, title, summary');
	if (!incident) return json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
	const { data: tenant } = await admin.from('tenants').select('owner_id').eq('id', incident.tenant_id).maybeSingle();
	if (!tenant || tenant.owner_id !== userId) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const { data: product } = await admin.from('products').select('id, name, tenant_id').eq('id', body.product_id).eq('maker_id', userId).is('deleted_at', null).maybeSingle();
	if (product && product.tenant_id !== incident.tenant_id) return json({ ok: false, code: 'PRODUCT_TENANT_MISMATCH' }, { status: 422 });
	if (!product) return json({ ok: false, code: 'PRODUCT_NOT_FOUND' }, { status: 404 });
	const repoQuery = admin.from('github_repo_links').select('installation_id, repo_full_name, role').eq('product_id', product.id);
	const { data: repoLink } = body.action === 'create'
		? await repoQuery.eq('role', 'source').maybeSingle()
		: await repoQuery.eq('repo_full_name', parsed?.repo ?? '').in('role', ['source', 'context']).limit(1).maybeSingle();
	if (!repoLink) return json({ ok: false, code: 'WRONG_GITHUB_REPOSITORY', message: 'Attach a PR or issue from the product source/context repository.' }, { status: 422 });
	try {
		const created = body.action === 'create'
			? await createIssue(repoLink.installation_id, repoLink.repo_full_name, `Incident: ${incident.title ?? 'Service incident'}`, `Track the engineering work for this incident.\n\n${incident.summary ?? ''}`)
			: null;
		const resolved = created ? { kind: 'issue' as const, repo: repoLink.repo_full_name, number: created.number, url: created.html_url } : parsed!;
		const githubItem = created ? { title: `Incident: ${incident.title ?? 'Service incident'}`, state: 'open', closed_at: null } : await getGithubIssue(repoLink.installation_id, resolved.repo, resolved.number);
		const { data, error } = await admin.from('incident_github_links').upsert({ product_id: product.id, incident_id: incident.id, kind: resolved.kind, url: resolved.url, repo_full_name: resolved.repo, number: resolved.number, title: githubItem.title, state: githubItem.state, closed_at: githubItem.closed_at, created_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'incident_id,url' }).select('*').maybeSingle();
		if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
		await recordGithubAudit(admin, product.id, body.action === 'create' ? 'incident.github_issue_created' : 'incident.github_linked', { incidentId: incident.id, kind: resolved.kind, url: resolved.url }, userId, resolved.repo);
		return json({ ok: true, link: data });
	} catch (error) {
		return json({ ok: false, code: 'GITHUB_ERROR', message: error instanceof Error ? error.message : String(error) }, { status: 502 });
	}
};
