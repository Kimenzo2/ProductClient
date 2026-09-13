import { env } from '$env/dynamic/private';
import { createHash, randomUUID } from 'node:crypto';
import type { DocsDocument } from '$lib/data/docsEditor';

function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
	}
	return value;
}

export function docsContentHash(document: DocsDocument): string {
	return createHash('sha256').update(JSON.stringify(canonicalize(document))).digest('hex');
}

type D1Result = { success?: boolean; errors?: { message?: string }[] } | null;

export type DocsRedirect = { fromPath: string; toPath: string };

async function runD1Query(accountId: string, databaseId: string, token: string, sql: string, params: unknown[]): Promise<{ ok: boolean; message?: string }> {
	try {
		const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify({ sql, params })
		});
		const result = (await response.json().catch(() => null)) as D1Result;
		if (!response.ok || result?.success === false) return { ok: false, message: result?.errors?.[0]?.message ?? 'Cloudflare D1 publish failed' };
		return { ok: true };
	} catch (error) {
		return { ok: false, message: error instanceof Error ? error.message : 'Cloudflare D1 publish failed' };
	}
}

export async function mirrorDocsToD1(
	slug: string,
	document: DocsDocument,
	version: number,
	publishedAt: string,
	contentHash = docsContentHash(document),
	releaseId: string = randomUUID(),
	rollbackOfVersion: number | null = null,
	redirects: DocsRedirect[] = []
): Promise<{ ok: boolean; message?: string; contentHash: string; releaseId: string }> {
	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const databaseId = env.CLOUDFLARE_D1_DATABASE_ID;
	const token = env.CLOUDFLARE_API_TOKEN;
	const failed = (message: string) => ({ ok: false, message, contentHash, releaseId });
	if (!accountId || !databaseId || !token) return failed('Cloudflare D1 is not configured');

	const release = await runD1Query(
		accountId,
		databaseId,
		token,
		`INSERT OR IGNORE INTO published_doc_releases (id, tenant_slug, document, version, content_hash, published_at, rollback_of_version, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?6)`,
		[releaseId, slug, JSON.stringify(document), version, contentHash, publishedAt, rollbackOfVersion]
	);
	if (!release.ok) return failed(release.message ?? 'Cloudflare D1 release record failed');

	const current = await runD1Query(
		accountId,
		databaseId,
		token,
		`INSERT INTO published_docs (tenant_slug, document, version, content_hash, release_id, published_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6) ON CONFLICT(tenant_slug) DO UPDATE SET document=excluded.document, version=excluded.version, content_hash=excluded.content_hash, release_id=excluded.release_id, published_at=excluded.published_at, updated_at=excluded.updated_at`,
		[slug, JSON.stringify(document), version, contentHash, releaseId, publishedAt]
	);
	if (!current.ok) return failed(current.message ?? 'Cloudflare D1 publish failed');
	for (const redirect of redirects) {
		const redirectResult = await runD1Query(
			accountId,
			databaseId,
			token,
			`INSERT INTO doc_redirects (tenant_slug, from_path, to_path, release_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(tenant_slug, from_path) DO UPDATE SET to_path=excluded.to_path, release_id=excluded.release_id, created_at=excluded.created_at`,
			[slug, redirect.fromPath, redirect.toPath, releaseId, publishedAt]
		);
		if (!redirectResult.ok) return failed(redirectResult.message ?? 'Cloudflare D1 redirect update failed');
	}
	return { ok: true, contentHash, releaseId };
}
