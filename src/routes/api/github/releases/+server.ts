import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { recordGithubAudit } from '$lib/server/githubCanonical';
import type { RequestHandler } from './$types';

async function userIdFromRequest(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

export const GET: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await userIdFromRequest(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const productId = url.searchParams.get('product_id')?.trim();
	if (!productId) return json({ ok: false, code: 'MISSING_PRODUCT_ID' }, { status: 400 });
	const { data: product } = await admin.from('products').select('maker_id').eq('id', productId).maybeSingle();
	if (!product || product.maker_id !== userId) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const { data, error } = await admin.from('releases').select('id, slug, title, version, status, created_at, github_release_url, github_repo_full_name, github_release_id').eq('product_id', productId).not('github_release_url', 'is', null).order('created_at', { ascending: false }).limit(50);
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	return json({ ok: true, releases: data ?? [] });
};

export const POST: RequestHandler = async ({ request }) => {
	const admin = createAdminClient();
	const userId = await userIdFromRequest(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	let body: { product_id?: string; release_id?: string };
	try { body = await request.json(); } catch { return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 }); }
	if (!body.product_id || !body.release_id) return json({ ok: false, code: 'MISSING_FIELDS' }, { status: 400 });
	const { data: product } = await admin.from('products').select('maker_id').eq('id', body.product_id).maybeSingle();
	if (!product || product.maker_id !== userId) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
	const { data: release, error: releaseError } = await admin.from('releases').select('id, product_id, status, github_release_url').eq('id', body.release_id).eq('product_id', body.product_id).maybeSingle();
	if (releaseError) return json({ ok: false, code: 'DB_ERROR', message: releaseError.message }, { status: 500 });
	if (!release) return json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
	const { data, error } = await admin.from('releases').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', body.release_id).eq('product_id', body.product_id).select('id, status, published_at, github_release_url').maybeSingle();
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	await recordGithubAudit(admin, body.product_id, 'release.github_confirmed', { releaseId: body.release_id, url: release.github_release_url ?? null }, userId);
	return json({ ok: true, release: data });
};
