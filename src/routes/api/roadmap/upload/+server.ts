import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization') ?? '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

	let supabaseAdmin;
	try {
		supabaseAdmin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	const { data: userData } = await supabaseAdmin.auth.getUser(token);
	const userId = userData.user?.id;
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

	const form = await request.formData().catch(() => null);
	if (!form) return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	const file = form.get('file') as File | null;
	const field = (form.get('field') as string | null) ?? 'logo';
	if (!file || !(file instanceof File)) return json({ ok: false, code: 'BAD_REQUEST', message: 'No file' }, { status: 400 });
	if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/avif'].includes(file.type)) {
		return json({ ok: false, code: 'INVALID_TYPE' }, { status: 400 });
	}
	if (file.size > 5 * 1024 * 1024) return json({ ok: false, code: 'TOO_LARGE' }, { status: 413 });

	const ext = file.name.split('.').pop() ?? 'png';
	const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'png';
	const path = `${userId}/${field}-${Date.now()}.${safeExt}`;

	const { error: upErr } = await supabaseAdmin.storage.from('roadmap-assets').upload(path, file, {
		contentType: file.type,
		upsert: true
	});
	if (upErr) return json({ ok: false, code: 'UPLOAD_FAILED', message: upErr.message }, { status: 500 });

	const { data: urlData } = supabaseAdmin.storage.from('roadmap-assets').getPublicUrl(path);
	return json({ ok: true, url: urlData.publicUrl, path });
};
