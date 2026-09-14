import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchFileContent, getRepoTree } from '$lib/server/githubApp';
import { validateDocsDocument, type DocsDocument } from '$lib/data/docsEditor';

type SourceLink = {
	 id: string;
	 product_id: string;
	 installation_id: number;
	 repo_full_name: string;
	 docs_path?: string | null;
};

export type GithubDocsSyncResult =
	| { ok: true; sha: string; files: number; imported: boolean; tenantId: string | null }
	| { ok: false; sha: string; files: number; imported: false; code: string; message: string; tenantId: string | null };

/**
 * Import the canonical ProductClient manifest from a GitHub source repository.
 * Push webhooks, manual Sync now, and a successful direct Docs deploy all use
 * this function so they cannot drift into three different document pipelines.
 */
export async function syncDocsFromGithub(
	admin: SupabaseClient,
	link: SourceLink,
	branch: string,
	sha: string,
	): Promise<GithubDocsSyncResult> {
	const { data: product } = await admin.from('products').select('tenant_id').eq('id', link.product_id).maybeSingle();
	const tenantId = (product as { tenant_id?: string | null } | null)?.tenant_id ?? null;
	const docsPath = String(link.docs_path ?? '/');
	const tree = await getRepoTree(link.installation_id, link.repo_full_name, branch, docsPath);
	const cleanPath = docsPath.replace(/^\/+|\/+$/g, '');
	const manifestPath = cleanPath ? `${cleanPath}/productclient.docs.json` : 'productclient.docs.json';
	const manifest = tree.files.find((file) => file.path === manifestPath);
	let imported: DocsDocument | null = null;
	let invalidMessage: string | null = null;

	if (manifest) {
		try {
			const parsed = JSON.parse(await fetchFileContent(link.installation_id, link.repo_full_name, manifest.path, branch)) as DocsDocument;
			const issues = validateDocsDocument(parsed);
			if (!issues.length) imported = parsed;
			else invalidMessage = issues.slice(0, 3).join('; ');
		} catch (error) {
			invalidMessage = error instanceof Error ? error.message : String(error);
		}
	}

	if (imported && tenantId) {
		const { data: current } = await admin.from('docs_documents').select('draft_version').eq('tenant_id', tenantId).maybeSingle();
		await admin
			.from('docs_documents')
			.update({
				draft: imported,
				draft_version: Number((current as { draft_version?: number } | null)?.draft_version ?? 0) + 1,
				publication_state: 'unpublished',
				publication_error: null,
				updated_at: new Date().toISOString()
			})
			.eq('tenant_id', tenantId);
	}

	if (imported) {
		await admin.from('github_repo_links').update({
			last_sha: sha,
			last_synced_at: new Date().toISOString(),
			last_error: null,
			sync_status: 'synced',
			sync_error_code: null
		}).eq('id', link.id);
		return { ok: true, sha, files: tree.files.length, imported: true, tenantId };
	}

	const code = manifest ? 'INVALID_DOCS_MANIFEST' : 'DOCS_MANIFEST_NOT_FOUND';
	const message = invalidMessage ?? `Expected ${manifestPath} in the configured documentation path.`;
	await admin.from('github_repo_links').update({
		last_sha: sha,
		last_synced_at: new Date().toISOString(),
		last_error: message,
		sync_status: 'tracked',
		sync_error_code: code
	}).eq('id', link.id);
	return { ok: false, sha, files: tree.files.length, imported: false, code, message, tenantId };
}
