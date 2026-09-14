import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { getGithubIssue } from '$lib/server/githubApp';
import { parseGithubReference, recordGithubAudit } from '$lib/server/githubCanonical';
import type { RequestHandler } from './$types';

async function userIdFromRequest(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

async function ownedProduct(admin: ReturnType<typeof createAdminClient>, productId: string, userId: string) {
	const { data } = await admin.from('products').select('id, tenant_id, maker_id, name').eq('id', productId).maybeSingle();
	return data && data.maker_id === userId ? data : null;
}

export const GET: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await userIdFromRequest(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const productId = url.searchParams.get('product_id')?.trim();
	if (!productId) return json({ ok: false, code: 'MISSING_PRODUCT_ID' }, { status: 400 });
	if (!(await ownedProduct(admin, productId, userId))) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const { data, error } = await admin.from('roadmap_github_links').select('*').eq('product_id', productId).order('updated_at', { ascending: false });
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	return json({ ok: true, links: data ?? [] });
};

export const POST: RequestHandler = async ({ request }) => {
	const admin = createAdminClient();
	const userId = await userIdFromRequest(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	let body: { product_id?: string; item_key?: string; reference?: string };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}
	const productId = body.product_id?.trim();
	const itemKey = body.item_key?.trim();
	const reference = body.reference?.trim();
	if (!productId || !itemKey || !reference) return json({ ok: false, code: 'MISSING_FIELDS' }, { status: 400 });
	if (itemKey.length > 180) return json({ ok: false, code: 'INVALID_ITEM_KEY' }, { status: 422 });
	const product = await ownedProduct(admin, productId, userId);
	if (!product) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const parsed = parseGithubReference(reference);
	if (!parsed || parsed.kind !== 'issue') return json({ ok: false, code: 'INVALID_GITHUB_REFERENCE', message: 'Use a GitHub issue URL or owner/repo#123.' }, { status: 422 });
	const { data: repoLink } = await admin.from('github_repo_links').select('installation_id, role').eq('product_id', productId).eq('repo_full_name', parsed.repo).in('role', ['source', 'context']).limit(1).maybeSingle();
	if (!repoLink) return json({ ok: false, code: 'WRONG_GITHUB_REPOSITORY', message: 'Link an issue from the product source or context repository.' }, { status: 422 });
	try {
		const githubItem = await getGithubIssue(repoLink.installation_id, parsed.repo, parsed.number);
		const { data, error } = await admin.from('roadmap_github_links').upsert({ tenant_id: product.tenant_id, product_id: productId, item_key: itemKey, kind: 'issue', url: parsed.url, repo_full_name: parsed.repo, number: parsed.number, title: githubItem.title, state: githubItem.state, created_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'product_id,item_key' }).select('*').maybeSingle();
		if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
		await recordGithubAudit(admin, productId, 'roadmap.github_linked', { itemKey, url: parsed.url }, userId, parsed.repo);
		return json({ ok: true, link: data });
	} catch (error) {
		return json({ ok: false, code: 'GITHUB_ERROR', message: error instanceof Error ? error.message : String(error) }, { status: 502 });
	}
};

export const DELETE: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await userIdFromRequest(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const productId = url.searchParams.get('product_id')?.trim();
	const itemKey = url.searchParams.get('item_key')?.trim();
	if (!productId || !itemKey) return json({ ok: false, code: 'MISSING_FIELDS' }, { status: 400 });
	if (!(await ownedProduct(admin, productId, userId))) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const { error } = await admin.from('roadmap_github_links').delete().eq('product_id', productId).eq('item_key', itemKey);
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	await recordGithubAudit(admin, productId, 'roadmap.github_unlinked', { itemKey }, userId);
	return json({ ok: true });
};
