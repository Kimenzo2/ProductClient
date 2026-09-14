import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { getInstallationToken } from '$lib/server/githubApp';
import { ownedProductWithTenant } from '$lib/server/productTenant';
import type { RequestHandler } from './$types';

const kits = new Set(['docs', 'roadmap', 'status']);

async function userIdFromRequest(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

async function ownedProduct(admin: ReturnType<typeof createAdminClient>, productId: string, userId: string) {
	return ownedProductWithTenant(admin, productId, userId);
}

export const GET: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await userIdFromRequest(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const productId = url.searchParams.get('product_id')?.trim();
	if (!productId) return json({ ok: false, code: 'MISSING_PRODUCT_ID' }, { status: 400 });
	const product = await ownedProduct(admin, productId, userId);
	if (!product) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const { data, error } = await admin.from('github_kit_repositories').select('*').eq('product_id', product.id).order('kit', { ascending: true });
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	return json({ ok: true, repositories: data ?? [] });
};

export const POST: RequestHandler = async ({ request }) => {
	const admin = createAdminClient();
	const userId = await userIdFromRequest(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	let body: {
		product_id?: string;
		installation_id?: number;
		kit?: string;
		repo_full_name?: string;
		branch?: string;
		content_path?: string;
	};
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}
	const productId = body.product_id?.trim();
	const installationId = body.installation_id ? Number(body.installation_id) : null;
	const kit = body.kit?.trim();
	const repoFullName = body.repo_full_name?.trim();
	const branch = body.branch?.trim() || 'main';
	let contentPath = body.content_path?.trim() || '/';
	if (!contentPath.startsWith('/')) contentPath = `/${contentPath}`;
	if (!productId || !installationId || !kit || !repoFullName) return json({ ok: false, code: 'MISSING_FIELDS' }, { status: 400 });
	if (!kits.has(kit)) return json({ ok: false, code: 'INVALID_KIT' }, { status: 422 });
	if (!/^[-A-Za-z0-9_.]+\/[-A-Za-z0-9_.]+$/.test(repoFullName)) return json({ ok: false, code: 'INVALID_REPOSITORY' }, { status: 422 });
	if (!/^\S+$/.test(branch)) return json({ ok: false, code: 'INVALID_BRANCH' }, { status: 422 });

	const product = await ownedProduct(admin, productId, userId);
	if (!product) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const { data: installation } = await admin.from('github_installations').select('installation_id').eq('installation_id', installationId).eq('maker_id', userId).maybeSingle();
	if (!installation) return json({ ok: false, code: 'INSTALLATION_NOT_FOUND' }, { status: 404 });

	try {
		const token = await getInstallationToken(installationId);
		const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
		const repoResponse = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers });
		if (!repoResponse.ok) return json({ ok: false, code: 'REPO_NOT_ACCESSIBLE' }, { status: 400 });
		const branchResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/${encodeURIComponent(branch)}`, { headers });
		if (!branchResponse.ok) return json({ ok: false, code: 'BRANCH_NOT_FOUND', message: `Branch ${branch} not found` }, { status: 400 });
	} catch (error) {
		return json({ ok: false, code: 'GITHUB_ERROR', message: error instanceof Error ? error.message : String(error) }, { status: 502 });
	}

	const { data, error } = await admin.from('github_kit_repositories').upsert({
		tenant_id: product.tenant_id,
		product_id: product.id,
		installation_id: installationId,
		kit,
		repo_full_name: repoFullName,
		branch,
		content_path: contentPath,
		managed: false,
		provision_status: 'manual',
		provision_error: null,
		updated_at: new Date().toISOString()
	}, { onConflict: 'product_id,kit' }).select('*').maybeSingle();
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	return json({ ok: true, repository: data });
};

export const DELETE: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await userIdFromRequest(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const productId = url.searchParams.get('product_id')?.trim();
	const kit = url.searchParams.get('kit')?.trim();
	const removeAll = url.searchParams.get('all') === '1';
	if (!productId || (!kit && !removeAll) || (kit && !kits.has(kit))) return json({ ok: false, code: 'MISSING_FIELDS' }, { status: 400 });
	const product = await ownedProduct(admin, productId, userId);
	if (!product) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	let managedQuery = admin.from('github_kit_repositories').update({ installation_id: null, provision_status: 'awaiting_authorization', github_sync_status: 'idle', updated_at: new Date().toISOString() }).eq('product_id', product.id).eq('managed', true);
	if (kit) managedQuery = managedQuery.eq('kit', kit);
	const managedWrite = await managedQuery;
	if (managedWrite.error) return json({ ok: false, code: 'DB_ERROR', message: managedWrite.error.message }, { status: 500 });
	let query = admin.from('github_kit_repositories').delete().eq('product_id', product.id).eq('managed', false);
	if (kit) query = query.eq('kit', kit);
	const { error } = await query;
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	return json({ ok: true });
};
