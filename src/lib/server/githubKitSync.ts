import type { SupabaseClient } from '@supabase/supabase-js';
import { commitRepositoryFiles } from '$lib/server/githubApp';

type SyncJobInput = {
	tenantId: string;
	productId?: string | null;
	kit: 'docs' | 'roadmap' | 'status';
	releaseId: string;
	contentHash: string;
};

function contentPath(prefix: string | null | undefined, file: string): string {
	const clean = String(prefix ?? '/').replace(/^\/+|\/+$/g, '');
	return clean ? `${clean}/${file}` : file;
}

export async function enqueueGithubKitSyncJob(admin: SupabaseClient, input: SyncJobInput): Promise<void> {
	let productId = input.productId ?? null;
	if (!productId) {
		const { data: docsRows } = await admin.from('github_kit_repositories').select('product_id').eq('tenant_id', input.tenantId).eq('kit', input.kit);
		const rows = (docsRows ?? []) as Array<{ product_id: string | null }>;
		// Never guess between multiple product repositories. A later worker can
		// resolve an explicit product-scoped job without risking a wrong mirror.
		if (rows.length === 1) productId = rows[0].product_id;
	}
	const { error } = await admin.from('github_kit_sync_jobs').upsert(
		{
			tenant_id: input.tenantId,
			product_id: productId,
			kit: input.kit,
			release_id: input.releaseId,
			content_hash: input.contentHash,
			status: 'pending',
			last_error: null,
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'tenant_id,kit,release_id', ignoreDuplicates: true }
	);
	if (error) throw new Error(error.message);
	if (productId) {
		await admin.from('github_kit_repositories').update({ github_sync_status: 'pending', github_sync_error: null, github_sync_attempted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('product_id', productId).eq('kit', input.kit);
	}
}

export async function processGithubKitSyncJob(admin: SupabaseClient, jobId: string): Promise<{ sha: string }> {
	const claimedAt = new Date().toISOString();
	const claim = await admin
		.from('github_kit_sync_jobs')
		.update({ status: 'syncing', attempts: 1, started_at: claimedAt, updated_at: claimedAt, last_error: null })
		.eq('id', jobId)
		.in('status', ['pending', 'failed'])
		.select('*')
		.maybeSingle();
	if (claim.error) throw new Error(claim.error.message);
	if (!claim.data) throw new Error('Sync job is already running or complete.');
	const job = claim.data as { id: string; tenant_id: string; product_id: string | null; kit: 'docs' | 'roadmap' | 'status'; release_id: string; content_hash: string };
	let repositoryId: string | null = null;
	try {
		let repositoryQuery = admin.from('github_kit_repositories').select('*').eq('tenant_id', job.tenant_id).eq('kit', job.kit);
		if (job.product_id) repositoryQuery = repositoryQuery.eq('product_id', job.product_id);
		const { data: rows } = await repositoryQuery;
		if (!rows || rows.length !== 1) throw new Error(rows?.length ? 'Multiple repositories match this release. Choose a product before syncing.' : 'The starter-kit repository is not ready yet.');
		const repository = rows[0] as { id: string; installation_id: number | null; repo_full_name: string | null; branch: string; content_path: string; provision_status: string };
		repositoryId = repository.id;
		if (!repository.installation_id || !repository.repo_full_name || repository.provision_status !== 'ready') throw new Error('The starter-kit repository is not ready yet.');
		if (job.kit !== 'docs') throw new Error('This release has no generated mirror contract for the selected starter kit yet.');

		const { data: release } = await admin.from('docs_releases').select('document, version').eq('id', job.release_id).eq('tenant_id', job.tenant_id).maybeSingle();
		const { data: artifact } = await admin.from('docs_release_artifacts').select('markdown, llms_txt, skill_md, mcp_json, sitemap_xml').eq('release_id', job.release_id).eq('tenant_id', job.tenant_id).maybeSingle();
		if (!release || !artifact) throw new Error('Generated release artifacts are missing.');
		const files = [
			{ path: contentPath(repository.content_path, 'productclient.docs.json'), content: JSON.stringify(release.document, null, 2) + '\n' },
			{ path: contentPath(repository.content_path, 'llms.txt'), content: String(artifact.llms_txt) },
			{ path: contentPath(repository.content_path, 'llms-full.txt'), content: String(artifact.markdown) },
			{ path: contentPath(repository.content_path, 'skill.md'), content: String(artifact.skill_md) },
			{ path: contentPath(repository.content_path, 'mcp.json'), content: JSON.stringify(artifact.mcp_json, null, 2) + '\n' },
			{ path: contentPath(repository.content_path, 'sitemap.xml'), content: String(artifact.sitemap_xml) }
		];
		const commit = await commitRepositoryFiles(repository.installation_id, repository.repo_full_name, repository.branch, files, `Publish ProductClient docs v${release.version}`);
		const completedAt = new Date().toISOString();
		await admin.from('github_kit_sync_jobs').update({ status: 'succeeded', completed_at: completedAt, updated_at: completedAt, last_error: null }).eq('id', job.id);
		await admin.from('github_kit_repositories').update({ github_sync_status: 'synced', github_sync_error: null, github_synced_at: completedAt, last_sha: commit.sha, last_synced_at: completedAt, last_error: null, last_cloudflare_release_id: job.release_id, last_cloudflare_content_hash: job.content_hash, updated_at: completedAt }).eq('id', repository.id);
		return commit;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const failedAt = new Date().toISOString();
		await admin.from('github_kit_sync_jobs').update({ status: 'failed', last_error: message.slice(0, 2000), updated_at: failedAt }).eq('id', job.id);
		if (repositoryId) await admin.from('github_kit_repositories').update({ github_sync_status: 'failed', github_sync_error: message.slice(0, 1000), github_sync_attempted_at: failedAt, updated_at: failedAt }).eq('id', repositoryId);
		throw error;
	}
}
