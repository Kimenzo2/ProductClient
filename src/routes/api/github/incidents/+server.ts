import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { getGithubIssue } from '$lib/server/githubApp';
import { parseGithubReference, recordGithubAudit } from '$lib/server/githubCanonical';
import type { RequestHandler } from './$types';

async function getUserId(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

type IncidentLookup = { id: string; tenant_id: string; title?: string | null };

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
	let body: { incident_id?: string; reference?: string };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}
	const reference = body.reference?.trim();
	if (!body.incident_id || !reference) return json({ ok: false, code: 'MISSING_FIELDS' }, { status: 400 });
	const parsed = parseGithubReference(reference);
	if (!parsed) return json({ ok: false, code: 'INVALID_GITHUB_REFERENCE', message: 'Use a GitHub pull request or issue URL.' }, { status: 422 });
	const { data: incident } = await findIncident(admin, body.incident_id, 'id, tenant_id, title');
	if (!incident) return json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
	const { data: tenant } = await admin.from('tenants').select('owner_id').eq('id', incident.tenant_id).maybeSingle();
	if (!tenant || tenant.owner_id !== userId) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const { data: products } = await admin.from('products').select('id, name').eq('tenant_id', incident.tenant_id).eq('maker_id', userId).is('deleted_at', null);
	const product = products?.[0];
	if (!product) return json({ ok: false, code: 'PRODUCT_NOT_FOUND' }, { status: 404 });
	const { data: repoLink } = await admin.from('github_repo_links').select('installation_id, repo_full_name').eq('product_id', product.id).eq('repo_full_name', parsed.repo).maybeSingle();
	if (!repoLink) return json({ ok: false, code: 'WRONG_GITHUB_REPOSITORY', message: 'Attach a PR or issue from the product source/context repository.' }, { status: 422 });
	try {
		const githubItem = await getGithubIssue(repoLink.installation_id, parsed.repo, parsed.number);
		const { data, error } = await admin.from('incident_github_links').upsert({ incident_id: incident.id, kind: parsed.kind, url: parsed.url, repo_full_name: parsed.repo, number: parsed.number, title: githubItem.title, state: githubItem.state, closed_at: githubItem.closed_at, created_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'incident_id,url' }).select('*').maybeSingle();
		if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
		await recordGithubAudit(admin, product.id, 'incident.github_linked', { incidentId: incident.id, kind: parsed.kind, url: parsed.url }, userId, parsed.repo);
		return json({ ok: true, link: data });
	} catch (error) {
		return json({ ok: false, code: 'GITHUB_ERROR', message: error instanceof Error ? error.message : String(error) }, { status: 502 });
	}
};
