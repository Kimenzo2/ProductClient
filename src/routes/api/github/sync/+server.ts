import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { getRepositoryBranch } from '$lib/server/githubApp';
import { syncDocsFromGithub } from '$lib/server/githubDocsSync';
import type { RequestHandler } from './$types';

async function getUserId(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

export const POST: RequestHandler = async ({ request }) => {
	const admin = createAdminClient();
	const userId = await getUserId(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

	let body: { product_id?: string };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}
	const productId = body.product_id?.trim();
	if (!productId) return json({ ok: false, code: 'MISSING_PRODUCT_ID' }, { status: 400 });

	const { data: product } = await admin.from('products').select('maker_id').eq('id', productId).maybeSingle();
	if (!product || (product as { maker_id: string }).maker_id !== userId) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });

	const { data: link } = await admin.from('github_repo_links').select('*').eq('product_id', productId).eq('role', 'source').maybeSingle();
	if (!link) return json({ ok: false, code: 'NOT_LINKED' }, { status: 404 });

	const repoFullName = (link as { repo_full_name: string }).repo_full_name;
	const branch = (link as { branch: string }).branch;
	const installationId = (link as { installation_id: number }).installation_id;

	try {
		const branchInfo = await getRepositoryBranch(installationId, repoFullName, branch);
		const result = await syncDocsFromGithub(admin, link as Parameters<typeof syncDocsFromGithub>[1], branch, branchInfo.sha);
		await admin.from('github_sync_runs').insert({ product_id: productId, event: 'manual_sync', sha: branchInfo.sha, ok: result.ok, error: result.ok ? null : result.message, details: { files: result.files, imported: result.imported, code: result.ok ? null : result.code } });
		await admin.from('github_kit_repositories').update({
			last_sha: result.sha,
			last_synced_at: new Date().toISOString(),
			last_error: result.ok ? null : result.message,
			sync_status: result.ok ? 'synced' : 'failed',
			sync_error_code: result.ok ? null : result.code,
			updated_at: new Date().toISOString()
		}).eq('product_id', productId).eq('kit', 'docs');
		if (!result.ok) return json({ ok: false, code: result.code, message: result.message, sha: result.sha, total: result.files }, { status: 422 });
		return json({ ok: true, sha: result.sha, total: result.files, imported: result.imported });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await admin.from('github_repo_links').update({ last_error: msg, sync_status: 'failed', sync_error_code: 'SYNC_FAILED' }).eq('product_id', productId);
		await admin.from('github_kit_repositories').update({ last_error: msg, sync_status: 'failed', sync_error_code: 'SYNC_FAILED', updated_at: new Date().toISOString() }).eq('product_id', productId).eq('kit', 'docs');
		await admin.from('github_sync_runs').insert({ product_id: productId, event: 'manual_sync', ok: false, error: msg });
		return json({ ok: false, code: 'SYNC_FAILED', message: msg }, { status: 502 });
	}
};
