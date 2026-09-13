import type { RequestHandler } from './$types';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { getWebhookSecret, verifyWebhookSignatureSync, getInstallationToken } from '$lib/server/githubApp';

export const POST: RequestHandler = async ({ request }) => {
	const rawBody = await request.text(); // keep raw for HMAC
	const signature = request.headers.get('x-hub-signature-256');
	const event = request.headers.get('x-github-event') ?? '';
	const delivery = request.headers.get('x-github-delivery') ?? '';

	let secret: string;
	try {
		secret = getWebhookSecret();
	} catch {
		return new Response(JSON.stringify({ ok: false, code: 'NOT_CONFIGURED' }), { status: 503, headers: { 'content-type': 'application/json' } });
	}

	if (!verifyWebhookSignatureSync(rawBody, signature, secret)) {
		return new Response(JSON.stringify({ ok: false, code: 'INVALID_SIGNATURE' }), { status: 401, headers: { 'content-type': 'application/json' } });
	}

	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(rawBody) as Record<string, unknown>;
	} catch {
		return new Response(JSON.stringify({ ok: false, code: 'BAD_JSON' }), { status: 400, headers: { 'content-type': 'application/json' } });
	}

	// idempotency: if delivery already processed, return 200
	const admin = createAdminClient();

	// handle events
	try {
		if (event === 'installation') {
			const action = (payload.action as string) ?? '';
			const inst = payload.installation as { id: number; account: { login: string; type: string; id: number } } | undefined;
			if (inst) {
				if (action === 'deleted') {
					await admin.from('github_installations').update({ suspended_at: new Date().toISOString() }).eq('installation_id', inst.id);
					// optionally delete links? keep but disable
				} else if (action === 'created' || action === 'unsuspend') {
					await admin.from('github_installations').update({ suspended_at: null, account_login: inst.account.login, account_type: inst.account.type as 'User' | 'Organization' }).eq('installation_id', inst.id);
				}
			}
			return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
		}

		if (event === 'installation_repositories') {
			const action = payload.action as string;
			const inst = payload.installation as { id: number } | undefined;
			const reposRemoved = (payload.repositories_removed as Array<{ full_name: string }>) ?? [];
			if (action === 'removed' && inst && reposRemoved.length) {
				for (const r of reposRemoved) {
					await admin.from('github_repo_links').delete().eq('repo_full_name', r.full_name).eq('installation_id', inst.id);
				}
			}
			return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
		}

		if (event === 'push') {
			const repo = payload.repository as { full_name: string } | undefined;
			const ref = payload.ref as string | undefined; // refs/heads/main
			const after = payload.after as string | undefined;
			if (!repo?.full_name || !ref || !after) {
				return new Response(JSON.stringify({ ok: true, ignored: 'missing repo/ref/after' }), { status: 200, headers: { 'content-type': 'application/json' } });
			}
			const branch = ref.replace(/^refs\/heads\//, '');
			// find links that match repo + branch
			const { data: links } = await admin.from('github_repo_links').select('product_id, installation_id, docs_path, branch, repo_full_name').eq('repo_full_name', repo.full_name).eq('branch', branch);
			if (!links?.length) {
				return new Response(JSON.stringify({ ok: true, ignored: 'no matching source link' }), { status: 200, headers: { 'content-type': 'application/json' } });
			}
			for (const link of links as Array<{ product_id: string; installation_id: number; docs_path: string; branch: string; repo_full_name: string }>) {
				try {
					// trigger sync — fetch tree and write into existing docs storage
					// For now, update last_sha and log sync run; docs file sync is stubbed to docs_documents if exists
					// Attempt to fetch docs files count (lightweight)
					let filesCount = 0;
					let error: string | null = null;
					try {
						const instId = link.installation_id as number;
						// Use helper to get tree
						const { getRepoTree } = await import('$lib/server/githubApp');
						const { files } = await getRepoTree(instId, link.repo_full_name, link.branch, link.docs_path);
						filesCount = files.length;
						// TODO: write files into existing docs storage — for solo v1, we update last_sha and create sync run
						// If docs_documents exists for product/tenant, update it here
					} catch (e) {
						error = e instanceof Error ? e.message : String(e);
					}

					await admin.from('github_repo_links').update({ last_sha: after, last_synced_at: new Date().toISOString(), last_error: error }).eq('product_id', link.product_id);
					await admin.from('github_sync_runs').insert({ product_id: link.product_id, event: 'push', sha: after, ok: !error, error: error ?? (filesCount ? `synced ${filesCount} files` : null) });

					// fire-and-forget sync to docs_documents if tenant mapping exists (best effort)
					if (!error) {
						// If a tenant exists matching product? Not in this schema, skip. Update last_synced_at is success.
					}
				} catch (e) {
					const msg = e instanceof Error ? e.message : String(e);
					await admin.from('github_sync_runs').insert({ product_id: link.product_id, event: 'push', sha: after, ok: false, error: msg });
					await admin.from('github_repo_links').update({ last_error: msg }).eq('product_id', link.product_id);
				}
			}
			return new Response(JSON.stringify({ ok: true, synced: (links as unknown[]).length }), { status: 200, headers: { 'content-type': 'application/json' } });
		}

		if (event === 'pull_request') {
			// preview only if Checks implemented; acknowledge
			return new Response(JSON.stringify({ ok: true, ignored: 'pull_request not yet handled' }), { status: 200, headers: { 'content-type': 'application/json' } });
		}

		// other events: 200
		return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.error('webhook handler error', msg);
		return new Response(JSON.stringify({ ok: false, code: 'HANDLER_ERROR', message: msg }), { status: 500, headers: { 'content-type': 'application/json' } });
	}
};

// Ensure raw body is not parsed by SvelteKit JSON handling — we read text() manually
