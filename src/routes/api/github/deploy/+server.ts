import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { findTenantForUser } from '$lib/server/tenantAccess';
import { validateDocsDocument, type DocsDocument } from '$lib/data/docsEditor';
import { deployDocsToGithub, getOwnedProductGithubLink, recordGithubAudit } from '$lib/server/githubCanonical';
import type { RequestHandler } from './$types';

async function userIdFromRequest(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

export const POST: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await userIdFromRequest(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	let body: { product_id?: string };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}
	const productId = body.product_id?.trim();
	if (!productId) return json({ ok: false, code: 'MISSING_PRODUCT_ID' }, { status: 400 });
	const owned = await getOwnedProductGithubLink(admin, productId, userId, 'source');
	if (!owned) return json({ ok: false, code: 'PRODUCT_NOT_FOUND_OR_NOT_OWNER' }, { status: 403 });
	if (!owned.link) return json({ ok: false, code: 'GITHUB_NOT_LINKED', message: 'Connect GitHub in Git settings before deploying.' }, { status: 409 });
	const tenant = await findTenantForUser(admin, userId);
	if (!tenant) return json({ ok: false, code: 'TENANT_NOT_FOUND' }, { status: 404 });
	const { data: row, error } = await admin.from('docs_documents').select('draft, draft_version').eq('tenant_id', tenant.id).maybeSingle();
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	const document = (row as { draft?: unknown } | null)?.draft as DocsDocument | undefined;
	const version = Number((row as { draft_version?: number } | null)?.draft_version ?? 0);
	if (!document || !version) return json({ ok: false, code: 'DOCS_NOT_SAVED', message: 'Save the documentation draft before deploying.' }, { status: 409 });
	const issues = validateDocsDocument(document);
	if (issues.length) return json({ ok: false, code: 'INVALID', issues }, { status: 422 });
	try {
		const productClientUrl = `${url.origin}/workspace/docs/editor`;
		const result = await deployDocsToGithub({ link: owned.link, document, tenantSlug: tenant.slug, version, productName: owned.product.name, productClientUrl });
		const now = new Date().toISOString();
		await admin.from('github_repo_links').update({ last_sha: result.sha, last_synced_at: now, last_error: null, sync_status: result.mode === 'commit' ? 'synced' : 'awaiting_pull_request', sync_error_code: null }).eq('id', owned.link.id);
		await admin.from('github_sync_runs').insert({ product_id: productId, event: result.mode === 'commit' ? 'docs_deploy' : 'docs_pull_request', sha: result.sha, ok: true, details: { branch: result.branch, pullRequestUrl: result.pullRequestUrl ?? null, pullRequestNumber: result.pullRequestNumber ?? null } });
		await recordGithubAudit(admin, productId, result.mode === 'commit' ? 'docs.deploy_committed' : 'docs.deploy_pull_request_created', { branch: result.branch, sha: result.sha, pullRequestUrl: result.pullRequestUrl ?? null, version }, userId, owned.link.repo_full_name);
		return json({ ok: true, ...result, version });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		await admin.from('github_repo_links').update({ last_error: message, sync_status: 'failed', sync_error_code: 'DEPLOY_FAILED' }).eq('id', owned.link.id);
		await admin.from('github_sync_runs').insert({ product_id: productId, event: 'docs_deploy', ok: false, error: message, details: {} });
		await recordGithubAudit(admin, productId, 'docs.deploy_failed', { message, version }, userId, owned.link.repo_full_name);
		return json({ ok: false, code: 'DEPLOY_FAILED', message }, { status: 502 });
	}
};
