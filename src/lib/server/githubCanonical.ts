import type { SupabaseClient } from '@supabase/supabase-js';
import { buildDocsArtifacts, docsArtifactFiles } from '$lib/server/docsArtifacts';
import { docsContentHash } from '$lib/server/docsPublish';
import { commitFiles, createBranch, createPullRequest, getRepositoryBranch, GithubApiError } from '$lib/server/githubApp';
import type { DocsDocument } from '$lib/data/docsEditor';

export const GITHUB_CONTRACT_ID = 'productclient.github.v1' as const;

export type GithubLinkRole = 'source' | 'context';
export type GithubRepoLink = {
	id: string;
	product_id: string;
	installation_id: number;
	repo_full_name: string;
	role: GithubLinkRole;
	branch: string;
	deploy_branch?: string | null;
	docs_path: string;
	last_sha: string | null;
	last_synced_at: string | null;
	last_error: string | null;
};

export type GithubReference = {
	kind: 'pull_request' | 'issue';
	repo: string;
	number: number;
	url: string;
};

export function githubRepositoryUrl(repo: string): string {
	return `https://github.com/${repo}`;
}

export function parseGithubReference(input: string): GithubReference | null {
	const value = input.trim();
	let repo = '';
	let kind: GithubReference['kind'];
	let number = 0;
	let url = value;
	const shorthand = value.match(/^([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)#(\d+)$/);
	if (shorthand) {
		repo = shorthand[1];
		number = Number(shorthand[2]);
		kind = 'issue';
		url = `https://github.com/${repo}/issues/${number}`;
	} else {
		try {
			const parsed = new URL(value);
			if (parsed.hostname !== 'github.com' || parsed.protocol !== 'https:') return null;
			const parts = parsed.pathname.split('/').filter(Boolean);
			if (parts.length !== 4 || !['issues', 'pull'].includes(parts[2])) return null;
			repo = `${parts[0]}/${parts[1]}`;
			number = Number(parts[3]);
			kind = parts[2] === 'pull' ? 'pull_request' : 'issue';
			url = `https://github.com/${repo}/${parts[2]}/${number}`;
		} catch {
			return null;
		}
	}
	if (!Number.isSafeInteger(number) || number < 1 || !/^[^/]+\/[^/]+$/.test(repo)) return null;
	return { kind, repo, number, url };
}

export function joinGithubPath(root: string, file: string): string {
	const cleanRoot = root.trim().replace(/^\/+|\/+$/g, '');
	return cleanRoot ? `${cleanRoot}/${file}` : file;
}

export async function getOwnedProductGithubLink(
	admin: SupabaseClient,
	productId: string,
	userId: string,
	role: GithubLinkRole = 'source'
): Promise<{ product: { id: string; maker_id: string; tenant_id: string | null; slug: string; name: string }; link: GithubRepoLink | null } | null> {
	const { data: product } = await admin.from('products').select('id, maker_id, tenant_id, slug, name').eq('id', productId).maybeSingle();
	if (!product || product.maker_id !== userId) return null;
	const { data: link } = await admin.from('github_repo_links').select('*').eq('product_id', productId).eq('role', role).maybeSingle();
	return { product, link: link as GithubRepoLink | null };
}

export async function recordGithubAudit(
	admin: SupabaseClient,
	productId: string,
	eventType: string,
	data: Record<string, unknown>,
	actorId?: string | null,
	repoFullName?: string | null
): Promise<void> {
	await admin.from('github_audit_events').insert({ product_id: productId, actor_id: actorId ?? null, event_type: eventType, repo_full_name: repoFullName ?? null, details: data });
}

export function docsDeploymentFiles(document: DocsDocument, tenantSlug: string, version: number, docsPath: string): Array<{ path: string; content: string }> {
	const digest = docsContentHash(document);
	const artifacts = buildDocsArtifacts(document, tenantSlug, version, digest);
	return docsArtifactFiles(document, artifacts).map((file) => ({ ...file, path: joinGithubPath(docsPath, file.path) }));
}

export async function deployDocsToGithub(options: {
	link: GithubRepoLink;
	document: DocsDocument;
	tenantSlug: string;
	version: number;
	productName: string;
	productClientUrl: string;
}): Promise<{ mode: 'commit' | 'pull_request'; sha: string; branch: string; pullRequestUrl?: string; pullRequestNumber?: number }> {
	const { link, document, tenantSlug, version, productName, productClientUrl } = options;
	const files = docsDeploymentFiles(document, tenantSlug, version, link.docs_path);
	const targetBranch = link.deploy_branch?.trim() || link.branch;
	const branchInfo = await getRepositoryBranch(link.installation_id, link.repo_full_name, targetBranch);
	const message = `Publish ${productName} documentation v${version}`;
	const commit = async (branch: string) => commitFiles(link.installation_id, link.repo_full_name, branch, message, files);
	const openPr = async (branch: string, base: string, sha: string) => {
		const pr = await createPullRequest(
			link.installation_id,
			link.repo_full_name,
			base,
			branch,
			`Publish ${productName} documentation v${version}`,
			`ProductClient documentation deployment for release v${version}.\n\nProductClient: ${productClientUrl}\nContent digest: ${docsContentHash(document)}`
		);
		return { mode: 'pull_request' as const, sha, branch, pullRequestUrl: pr.html_url, pullRequestNumber: pr.number };
	};

	if (branchInfo.protected || targetBranch !== link.branch) {
		const branch = `productclient/docs/${Date.now().toString(36)}`;
		await createBranch(link.installation_id, link.repo_full_name, branch, branchInfo.sha);
		const commitResult = await commit(branch);
		return openPr(branch, targetBranch, commitResult.sha);
	}
	try {
		const commitResult = await commit(targetBranch);
		return { mode: 'commit', sha: commitResult.sha, branch: targetBranch };
	} catch (error) {
		if (!(error instanceof GithubApiError) || error.status !== 403) throw error;
		const branch = `productclient/docs/${Date.now().toString(36)}`;
		await createBranch(link.installation_id, link.repo_full_name, branch, branchInfo.sha);
		const commitResult = await commit(branch);
		return openPr(branch, targetBranch, commitResult.sha);
	}
}
