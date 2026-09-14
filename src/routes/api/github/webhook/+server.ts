import type { RequestHandler } from './$types';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { getWebhookSecret, verifyWebhookSignatureSync } from '$lib/server/githubApp';
import { syncDocsFromGithub } from '$lib/server/githubDocsSync';

type GithubRepository = { full_name: string };
type GithubInstallation = { id: number; account?: { login?: string; type?: string; id?: number } };

function response(body: Record<string, unknown>, status = 200) {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

async function logRun(admin: ReturnType<typeof createAdminClient>, productId: string, delivery: string, event: string, sha: string | null, ok: boolean, error: string | null, details: Record<string, unknown> = {}) {
	await admin.from('github_sync_runs').insert({ product_id: productId, delivery_id: `${delivery}:${productId}`, event, sha, ok, error, details });
}

function releaseSlug(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160) || 'github-release';
}

export const POST: RequestHandler = async ({ request }) => {
	const rawBody = await request.text();
	const signature = request.headers.get('x-hub-signature-256');
	const event = request.headers.get('x-github-event') ?? '';
	const delivery = request.headers.get('x-github-delivery') ?? crypto.randomUUID();
	let secret: string;
	try {
		secret = getWebhookSecret();
	} catch {
		return response({ ok: false, code: 'NOT_CONFIGURED' }, 503);
	}
	if (!verifyWebhookSignatureSync(rawBody, signature, secret)) return response({ ok: false, code: 'INVALID_SIGNATURE' }, 401);
	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(rawBody) as Record<string, unknown>;
	} catch {
		return response({ ok: false, code: 'BAD_JSON' }, 400);
	}

	const admin = createAdminClient();
	try {
		const { data: seenDelivery } = await admin.from('github_sync_runs').select('id').like('delivery_id', `${delivery}:%`).limit(1).maybeSingle();
		if (seenDelivery) return response({ ok: true, duplicate: true });
		if (event === 'installation') {
			const installation = payload.installation as GithubInstallation | undefined;
			if (!installation?.id) return response({ ok: true, ignored: 'missing installation' });
			const action = String(payload.action ?? '');
			if (action === 'deleted') {
				await admin.from('github_repo_links').delete().eq('installation_id', installation.id);
				await admin.from('github_installations').update({ suspended_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('installation_id', installation.id);
			} else if (action === 'created' || action === 'unsuspend') {
				await admin.from('github_installations').update({ suspended_at: null, account_login: installation.account?.login ?? 'unknown', account_type: installation.account?.type === 'Organization' ? 'Organization' : 'User', account_id: installation.account?.id ?? null, updated_at: new Date().toISOString() }).eq('installation_id', installation.id);
			}
			return response({ ok: true });
		}

		if (event === 'installation_repositories') {
			const installation = payload.installation as GithubInstallation | undefined;
			const removed = (payload.repositories_removed as Array<{ full_name?: string }> | undefined) ?? [];
			if (installation?.id && removed.length) {
				for (const repo of removed) if (repo.full_name) await admin.from('github_repo_links').delete().eq('installation_id', installation.id).eq('repo_full_name', repo.full_name);
			}
			return response({ ok: true });
		}

		const repository = payload.repository as GithubRepository | undefined;
		const installation = payload.installation as GithubInstallation | undefined;
		if (!repository?.full_name || !installation?.id) return response({ ok: true, ignored: 'missing repository or installation' });

		if (event === 'push') {
			const branch = String(payload.ref ?? '').replace(/^refs\/heads\//, '');
			const after = String(payload.after ?? '');
			if (!branch || !after) return response({ ok: true, ignored: 'missing ref or sha' });
			const { data: links } = await admin.from('github_repo_links').select('*').eq('repo_full_name', repository.full_name).eq('branch', branch).eq('role', 'source');
			for (const link of (links ?? []) as Array<Record<string, unknown>>) {
				const productId = String(link.product_id);
				try {
					const sync = await syncDocsFromGithub(admin, link as Parameters<typeof syncDocsFromGithub>[1], branch, after);
					await logRun(admin, productId, delivery, 'push', after, sync.ok, sync.ok ? null : sync.message, { branch, docsFiles: sync.files, imported: sync.imported, code: sync.ok ? null : sync.code });
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error);
					await admin.from('github_repo_links').update({ last_error: message, sync_status: 'failed', sync_error_code: 'PUSH_SYNC_FAILED' }).eq('id', link.id);
					await logRun(admin, productId, delivery, 'push', after, false, message, { branch });
				}
			}
			return response({ ok: true, synced: links?.length ?? 0 });
		}

		if (event === 'issues') {
			const issue = payload.issue as { number?: number; html_url?: string; state?: string; closed_at?: string | null } | undefined;
			if (!issue?.number) return response({ ok: true, ignored: 'missing issue' });
			const action = String(payload.action ?? '');
			const { data: feedback } = await admin.from('feedback_items').select('id, product_id').eq('github_repo_full_name', repository.full_name).eq('github_issue_number', issue.number);
			for (const item of feedback ?? []) {
				const nextStatus = issue.state === 'closed' || action === 'closed' ? 'shipped' : action === 'reopened' ? 'in_progress' : undefined;
				await admin.from('feedback_items').update({ ...(nextStatus ? { status: nextStatus } : {}), ...(issue.html_url ? { github_issue_url: issue.html_url } : {}) }).eq('id', item.id);
				await logRun(admin, item.product_id, delivery, 'issue', null, true, null, { action, feedbackId: item.id, number: issue.number });
			}
			const { data: incidentLinks } = await admin.from('incident_github_links').select('id').eq('repo_full_name', repository.full_name).eq('number', issue.number);
			for (const link of incidentLinks ?? []) await admin.from('incident_github_links').update({ state: issue.state ?? null, closed_at: issue.closed_at ?? null, updated_at: new Date().toISOString() }).eq('id', link.id);
			return response({ ok: true, feedback: feedback?.length ?? 0, incidents: incidentLinks?.length ?? 0 });
		}

		if (event === 'pull_request') {
			const pull = payload.pull_request as { number?: number; title?: string; state?: string; merged?: boolean; merged_at?: string | null } | undefined;
			if (!pull?.number) return response({ ok: true, ignored: 'missing pull request' });
			const { data: links } = await admin.from('incident_github_links').select('id, product_id').eq('repo_full_name', repository.full_name).eq('number', pull.number).eq('kind', 'pull_request');
			for (const link of links ?? []) await admin.from('incident_github_links').update({ title: pull.title ?? null, state: pull.state ?? null, merged: pull.merged ?? false, closed_at: pull.merged_at ?? null, updated_at: new Date().toISOString() }).eq('id', link.id);
			const { data: sourceLinks } = await admin.from('github_repo_links').select('product_id').eq('repo_full_name', repository.full_name).eq('role', 'source');
			for (const source of sourceLinks ?? []) await logRun(admin, source.product_id, delivery, 'pull_request', null, true, null, { action: String(payload.action ?? ''), number: pull.number, incidentLinks: links?.length ?? 0, ignored: !(links?.length), merged: Boolean(pull.merged) });
			if (!(sourceLinks?.length ?? 0)) console.info('[github/webhook] pull_request ignored: repository has no ProductClient source link', { repository: repository.full_name, number: pull.number, action: payload.action });
			return response({ ok: true, incidents: links?.length ?? 0, logged: sourceLinks?.length ?? 0 });
		}

		if (event === 'release') {
			const release = payload.release as { id?: number; html_url?: string; name?: string; tag_name?: string; body?: string; draft?: boolean; published_at?: string | null } | undefined;
			if (!release?.id) return response({ ok: true, ignored: 'missing release' });
			const { data: sourceLinks } = await admin.from('github_repo_links').select('product_id').eq('repo_full_name', repository.full_name).eq('role', 'source');
			for (const link of sourceLinks ?? []) {
				await admin.from('releases').upsert({ product_id: link.product_id, slug: `github-${release.id}-${releaseSlug(release.tag_name ?? release.name ?? 'release')}`, title: release.name ?? release.tag_name ?? 'GitHub release', body: release.body ?? '', version: release.tag_name ?? null, status: 'draft', published_at: null, github_release_id: release.id, github_release_url: release.html_url ?? null, github_repo_full_name: repository.full_name }, { onConflict: 'product_id,slug' });
				await logRun(admin, link.product_id, delivery, 'release', null, true, null, { releaseId: release.id, url: release.html_url ?? null, status: 'draft', pendingMakerConfirmation: true });
			}
			return response({ ok: true, products: sourceLinks?.length ?? 0 });
		}

		return response({ ok: true, ignored: event || 'unknown_event' });
	} catch (error) {
		console.error('[github/webhook] handler error', error);
		return response({ ok: false, code: 'HANDLER_ERROR' }, 500);
	}
};
