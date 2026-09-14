import { redirect, json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { createAppJWT, verifyState } from '$lib/server/githubApp';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, request }) => {
	const installationIdRaw = url.searchParams.get('installation_id');
	const stateRaw = url.searchParams.get('state');
	const setupAction = url.searchParams.get('setup_action');

	// GitHub can redirect with ?setup_action=install etc without state if user installs from marketplace
	// But our flow always includes state
	if (!installationIdRaw) {
		return json({ ok: false, code: 'MISSING_INSTALLATION_ID' }, { status: 400 });
	}
	const installationId = Number(installationIdRaw);
	if (!Number.isFinite(installationId)) return json({ ok: false, code: 'INVALID_INSTALLATION_ID' }, { status: 400 });

	if (!stateRaw) {
		// A setup callback without state cannot be safely bound to a ProductClient
		// product. Surface the configuration problem instead of pretending that the
		// App is connected to an arbitrary product.
		throw redirect(
			302,
			`/workspace/settings/git?github_error=${encodeURIComponent(`GitHub returned without setup state. Set the GitHub App Setup URL to ${url.origin}/api/github/setup and start the install from ProductClient.`)}&installation_id=${installationId}&setup_action=${setupAction ?? ''}`
		);
	}

	const state = verifyState(stateRaw);
	if (!state) return json({ ok: false, code: 'INVALID_STATE' }, { status: 401 });

	const productId = state.product_id as string | undefined;
	const makerId = state.maker_id as string | undefined;
	const nonce = state.nonce as string | undefined;
	const exp = state.exp as number | undefined;

	if (!productId || !makerId) return json({ ok: false, code: 'INVALID_STATE_PAYLOAD' }, { status: 401 });
	if (exp && Date.now() > exp) return json({ ok: false, code: 'STATE_EXPIRED' }, { status: 401 });

	// TODO: state reuse check — store nonce in github_sync_runs with event='state_nonce' and check unique
	// For now, allow but log

	const admin = createAdminClient();

	// Verify product ownership
	const { data: product } = await admin.from('products').select('id, maker_id, slug, name').eq('id', productId).maybeSingle();
	if (!product || (product as { maker_id: string }).maker_id !== makerId) {
		return json({ ok: false, code: 'PRODUCT_NOT_FOUND_OR_NOT_OWNER' }, { status: 403 });
	}

	// Fetch installation details from GitHub to get account info
	let accountLogin = 'unknown';
	let accountType: 'User' | 'Organization' = 'User';
	let accountId: number | null = null;
	let raw: unknown = null;
	try {
		const jwt = createAppJWT();
		const res = await fetch(`https://api.github.com/app/installations/${installationId}`, {
			headers: {
				Authorization: `Bearer ${jwt}`,
				Accept: 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		});
		if (res.ok) {
			const j = (await res.json()) as { account: { login: string; type: string; id: number } };
			accountLogin = j.account.login;
			accountType = j.account.type === 'Organization' ? 'Organization' : 'User';
			accountId = j.account.id;
			raw = j;
		} else {
			const txt = await res.text().catch(() => '');
			console.warn('GitHub installation fetch failed', res.status, txt);
		}
	} catch (e) {
		console.warn('GitHub installation fetch error', e);
	}

	// Upsert github_installations
	const { error: upsertError } = await admin.from('github_installations').upsert(
		{
			installation_id: installationId,
			account_login: accountLogin,
			account_type: accountType,
			account_id: accountId,
			maker_id: makerId,
			raw,
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'installation_id' }
	);
	if (upsertError) {
		console.error('github_installations upsert failed', upsertError);
		return json({ ok: false, code: 'DB_ERROR', message: upsertError.message }, { status: 500 });
	}

	// If nonce handling, insert sync run to mark used (best effort)
	if (nonce) {
		await admin.from('github_sync_runs').insert({ product_id: productId, event: 'state_nonce', sha: nonce, ok: true }).then(() => {}, () => {});
	}

	// Redirect to git settings for this product
	throw redirect(302, `/workspace/settings/git?product_id=${productId}&installation_id=${installationId}&connected=1`);
};
