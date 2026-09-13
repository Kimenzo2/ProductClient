import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { listInstallationRepos } from '$lib/server/githubApp';
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

	const installationIdRaw = url.searchParams.get('installation_id');
	const productId = url.searchParams.get('product_id');

	let installationId: number | null = null;
	if (installationIdRaw) {
		installationId = Number(installationIdRaw);
	} else if (productId) {
		// resolve via repo link or installation table
		const { data: link } = await admin.from('github_repo_links').select('installation_id').eq('product_id', productId).maybeSingle();
		if (link) installationId = (link as { installation_id: number }).installation_id;
		else {
			// fallback: pick first installation for maker
			const { data: inst } = await admin.from('github_installations').select('installation_id').eq('maker_id', userId).limit(1).maybeSingle();
			if (inst) installationId = (inst as { installation_id: number }).installation_id;
		}
	} else {
		// list all installations for maker — return installations first
		const { data: installs } = await admin.from('github_installations').select('installation_id, account_login, account_type').eq('maker_id', userId);
		if (!installs?.length) return json({ ok: true, repositories: [], installations: [] });
		// if only one, auto-fetch its repos
		if (installs.length === 1) {
			installationId = (installs[0] as { installation_id: number }).installation_id;
		} else {
			return json({ ok: true, installations: installs, repositories: [] });
		}
	}

	if (!installationId) return json({ ok: false, code: 'MISSING_INSTALLATION_ID' }, { status: 400 });

	// verify ownership of installation
	const { data: inst } = await admin.from('github_installations').select('installation_id').eq('installation_id', installationId).eq('maker_id', userId).maybeSingle();
	if (!inst) return json({ ok: false, code: 'INSTALLATION_NOT_FOUND' }, { status: 404 });

	try {
		const repos = await listInstallationRepos(installationId);
		// sort by updated desc
		repos.sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
		return json({ ok: true, repositories: repos, installation_id: installationId });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return json({ ok: false, code: 'GITHUB_ERROR', message: msg }, { status: 502 });
	}
};
