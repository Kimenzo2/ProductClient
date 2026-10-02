import { createAdminClient } from '#lib/server/supabaseAdmin.js';
import { getInstallUrl, signState } from '#lib/server/githubApp.js';
import type { RequestHandler } from './$types';

async function getUserId(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

export const GET: RequestHandler = async ({ request, url }) => {
	try {
		const admin = createAdminClient();
		const userId = await getUserId(request, admin);
		if (!userId) return Response.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

		const productId = url.searchParams.get('product_id');
		if (!productId) return Response.json({ ok: false, code: 'MISSING_PRODUCT_ID' }, { status: 400 });

		const { data: product, error: productError } = await admin
			.from('products')
			.select('id, maker_id')
			.eq('id', productId)
			.maybeSingle();
		if (productError) {
			console.error('[github/install] product lookup failed', productError);
			return Response.json({ ok: false, code: 'PRODUCT_LOOKUP_FAILED' }, { status: 500 });
		}
		if (!product || (product as { maker_id: string }).maker_id !== userId) {
			return Response.json({ ok: false, code: 'PRODUCT_NOT_FOUND_OR_NOT_OWNER' }, { status: 403 });
		}

		const nonce = crypto.randomUUID();
		const now = Date.now();
		const state = signState({ product_id: productId, maker_id: userId, nonce, exp: now + 10 * 60 * 1000, iat: now });
		const installUrl = getInstallUrl(state);

		return Response.json({ ok: true, installUrl, state });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error('[github/install] request failed', message);
		if (message.startsWith('Missing GITHUB_')) {
			return Response.json(
				{ ok: false, code: 'GITHUB_NOT_CONFIGURED', message: 'GitHub integration is not configured on this deployment.' },
				{ status: 503 }
			);
		}
		if (message.startsWith('Missing PUBLIC_SUPABASE_') || message.startsWith('Missing Supabase server secret')) {
			return Response.json({ ok: false, code: 'SERVER_NOT_CONFIGURED' }, { status: 503 });
		}
		return Response.json({ ok: false, code: 'GITHUB_INSTALL_FAILED', message: 'Could not start the GitHub installation.' }, { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	// alias for GET but via POST body
	return GET(event);
};
