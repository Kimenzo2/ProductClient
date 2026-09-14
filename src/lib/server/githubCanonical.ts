import type { SupabaseClient } from '@supabase/supabase-js';

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
