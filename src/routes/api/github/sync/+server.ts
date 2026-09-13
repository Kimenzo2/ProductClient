import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { getInstallationToken, getRepoTree, fetchFileContent } from '$lib/server/githubApp';
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
	const docsPath = (link as { docs_path: string }).docs_path;
	const installationId = (link as { installation_id: number }).installation_id;

	try {
		const token = await getInstallationToken(installationId);
		// verify branch sha
		const brRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/${encodeURIComponent(branch)}`, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
		});
		if (!brRes.ok) {
			const t = await brRes.text().catch(() => '');
			throw new Error(`Branch ${branch} ${brRes.status}: ${t.slice(0, 300)}`);
		}
		const brData = (await brRes.json()) as { object: { sha: string } };
		const sha = brData.object.sha;

		const { files } = await getRepoTree(installationId, repoFullName, branch, docsPath);

		// Optionally fetch a sample file to validate content
		let sample: string | null = null;
		if (files[0]) {
			try {
				sample = await fetchFileContent(installationId, repoFullName, files[0].path, branch);
			} catch {}
		}

		await admin.from('github_repo_links').update({ last_sha: sha, last_synced_at: new Date().toISOString(), last_error: null }).eq('product_id', productId);
		await admin.from('github_sync_runs').insert({ product_id: productId, event: 'manual_sync', sha, ok: true, error: sample ? `found ${files.length} files, sample ${files[0].path.slice(0, 80)}` : `found ${files.length} files` });

		return json({ ok: true, sha, files: files.slice(0, 20), total: files.length });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await admin.from('github_repo_links').update({ last_error: msg }).eq('product_id', productId);
		await admin.from('github_sync_runs').insert({ product_id: productId, event: 'manual_sync', ok: false, error: msg });
		return json({ ok: false, code: 'SYNC_FAILED', message: msg }, { status: 502 });
	}
};
