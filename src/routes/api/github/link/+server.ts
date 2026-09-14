import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { getInstallationToken } from '$lib/server/githubApp';
import type { RequestHandler } from './$types';

async function getUserId(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

export const GET: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await getUserId(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const productId = url.searchParams.get('product_id');
	if (productId) {
		// verify ownership via product
		const { data: prod } = await admin.from('products').select('maker_id').eq('id', productId).maybeSingle();
		if (!prod || (prod as { maker_id: string }).maker_id !== userId) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
		const { data } = await admin.from('github_repo_links').select('*').eq('product_id', productId).maybeSingle();
		if (!data) {
			// Installing the GitHub App and linking a repository are separate steps.
			// Recover the maker's latest installation when the callback query was lost.
			const { data: installation } = await admin
				.from('github_installations')
				.select('installation_id')
				.eq('maker_id', userId)
				.order('updated_at', { ascending: false })
				.limit(1)
				.maybeSingle();
			return json({ ok: true, link: null, installation_id: installation?.installation_id ?? null });
		}
		return json({ ok: true, link: data });
	}
	// list all links for maker
	const { data: products } = await admin.from('products').select('id').eq('maker_id', userId);
	const ids = (products as Array<{ id: string }> | null)?.map((p) => p.id) ?? [];
	if (!ids.length) return json({ ok: true, links: [] });
	const { data: links } = await admin.from('github_repo_links').select('*').in('product_id', ids);
	return json({ ok: true, links: links ?? [] });
};

export const POST: RequestHandler = async ({ request }) => {
	const admin = createAdminClient();
	const userId = await getUserId(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

	let body: { product_id?: string; installation_id?: number; repo_full_name?: string; branch?: string; docs_path?: string };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}
	const productId = body.product_id?.trim();
	const installationId = body.installation_id ? Number(body.installation_id) : null;
	const repoFullName = body.repo_full_name?.trim();
	const branch = (body.branch?.trim() || 'main').trim();
	let docsPath = (body.docs_path?.trim() || '/').trim();
	if (!docsPath.startsWith('/')) docsPath = '/' + docsPath;

	if (!productId || !installationId || !repoFullName) return json({ ok: false, code: 'MISSING_FIELDS', message: 'product_id, installation_id, repo_full_name required' }, { status: 400 });

	const { data: product } = await admin.from('products').select('id, maker_id').eq('id', productId).maybeSingle();
	if (!product || (product as { maker_id: string }).maker_id !== userId) return json({ ok: false, code: 'PRODUCT_NOT_FOUND_OR_NOT_OWNER' }, { status: 403 });

	const { data: install } = await admin.from('github_installations').select('installation_id').eq('installation_id', installationId).eq('maker_id', userId).maybeSingle();
	if (!install) return json({ ok: false, code: 'INSTALLATION_NOT_FOUND' }, { status: 404 });

	// verify repo is accessible via installation token + branch exists
	try {
		const token = await getInstallationToken(installationId);
		// check repo exists and branch exists
		const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
		});
		if (!repoRes.ok) {
			const t = await repoRes.text().catch(() => '');
			return json({ ok: false, code: 'REPO_NOT_ACCESSIBLE', message: t.slice(0, 500) }, { status: 400 });
		}
		// branch check optionally
		if (branch !== 'main') {
			const br = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/${encodeURIComponent(branch)}`, {
				headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
			});
			if (!br.ok) return json({ ok: false, code: 'BRANCH_NOT_FOUND', message: `Branch ${branch} not found` }, { status: 400 });
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return json({ ok: false, code: 'GITHUB_ERROR', message: msg }, { status: 502 });
	}

	// upsert link (one source per product)
	const { data, error } = await admin
		.from('github_repo_links')
		.upsert(
			{
				product_id: productId,
				installation_id: installationId,
				repo_full_name: repoFullName,
				role: 'source',
				branch,
				docs_path: docsPath,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'product_id,role' }
		)
		.select('*')
		.maybeSingle();

	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	return json({ ok: true, link: data });
};

export const DELETE: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await getUserId(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const productId = url.searchParams.get('product_id') ?? (await request.json().catch(() => ({} as Record<string, string>))).product_id;
	if (!productId) return json({ ok: false, code: 'MISSING_PRODUCT_ID' }, { status: 400 });
	const { data: product } = await admin.from('products').select('maker_id').eq('id', productId).maybeSingle();
	if (!product || (product as { maker_id: string }).maker_id !== userId) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });

	const { error } = await admin.from('github_repo_links').delete().eq('product_id', productId).eq('role', 'source');
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	return json({ ok: true });
};
