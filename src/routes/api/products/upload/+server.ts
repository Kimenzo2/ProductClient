import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import type { RequestHandler } from './$types';

const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml']);
const maxBytes = 8 * 1024 * 1024;

function extensionFor(file: File): string {
	const fromName = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
	if (fromName && fromName.length <= 8) return fromName;
	return file.type === 'image/svg+xml' ? 'svg' : file.type.split('/')[1] ?? 'bin';
}

export const POST: RequestHandler = async ({ request }) => {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

	let admin;
	try {
		admin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'SERVER_NOT_CONFIGURED' }, { status: 503 });
	}

	const { data: userData } = await admin.auth.getUser(token);
	const userId = userData.user?.id;
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

	const form = await request.formData().catch(() => null);
	const file = form?.get('file');
	const productId = String(form?.get('product_id') ?? '').trim();
	if (!(file instanceof File)) return json({ ok: false, code: 'MISSING_FILE' }, { status: 400 });
	if (!allowedTypes.has(file.type)) return json({ ok: false, code: 'INVALID_TYPE' }, { status: 400 });
	if (file.size > maxBytes) return json({ ok: false, code: 'TOO_LARGE' }, { status: 413 });

	if (productId) {
		const { data: product, error: productError } = await admin.from('products').select('id').eq('id', productId).eq('maker_id', userId).maybeSingle();
		if (productError) return json({ ok: false, code: 'PRODUCT_LOOKUP_FAILED' }, { status: 500 });
		if (!product) return json({ ok: false, code: 'PRODUCT_NOT_FOUND_OR_NOT_OWNER' }, { status: 403 });
	}

	const scope = productId || 'drafts';
	const path = `${userId}/${scope}/logo-${crypto.randomUUID()}.${extensionFor(file)}`;
	const { error: uploadError } = await admin.storage.from('product-assets').upload(path, file, {
		contentType: file.type,
		cacheControl: '31536000',
		upsert: false
	});
	if (uploadError) return json({ ok: false, code: 'UPLOAD_FAILED', message: uploadError.message }, { status: 500 });

	const { data: urlData } = admin.storage.from('product-assets').getPublicUrl(path);
	return json({ ok: true, url: urlData.publicUrl, path });
};
