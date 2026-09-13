import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { getInstallUrl, signState } from '$lib/server/githubApp';
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
	if (!productId) return json({ ok: false, code: 'MISSING_PRODUCT_ID' }, { status: 400 });

	const { data: product } = await admin.from('products').select('id, maker_id').eq('id', productId).maybeSingle();
	if (!product || (product as { maker_id: string }).maker_id !== userId) {
		return json({ ok: false, code: 'PRODUCT_NOT_FOUND_OR_NOT_OWNER' }, { status: 403 });
	}

	const nonce = crypto.randomUUID();
	const state = signState({ product_id: productId, maker_id: userId, nonce, exp: Date.now() + 10 * 60 * 1000, iat: Date.now() });
	const installUrl = getInstallUrl(state);

	return json({ ok: true, installUrl, state });
};

export const POST: RequestHandler = async (event) => {
	// alias for GET but via POST body
	return GET(event);
};
