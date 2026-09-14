import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { provisionStarterKits } from '$lib/server/githubKitProvisioning';
import { ownedProductWithTenant } from '$lib/server/productTenant';
import type { RequestHandler } from './$types';

async function userIdFromRequest(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

export const POST: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
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

	const product = await ownedProductWithTenant(admin, productId, userId);
	if (!product) return json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });

	try {
		const result = await provisionStarterKits(admin, productId, userId);
		return json({ ok: true, status: result.status, repositories: result.repositories }, { status: result.status === 'awaiting_authorization' ? 202 : 200 });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const { data: repositories } = await admin.from('github_kit_repositories').select('*').eq('product_id', productId).order('kit', { ascending: true });
		return json({ ok: false, status: 'failed', code: 'PROVISIONING_FAILED', message, repositories: repositories ?? [] }, { status: 502 });
	}
};
