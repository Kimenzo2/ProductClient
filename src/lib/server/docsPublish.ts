import { env } from '$env/dynamic/private';
import type { DocsDocument } from '$lib/data/docsEditor';

export async function mirrorDocsToD1(
	slug: string,
	document: DocsDocument,
	version: number,
	publishedAt: string
): Promise<{ ok: boolean; message?: string }> {
	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const databaseId = env.CLOUDFLARE_D1_DATABASE_ID;
	const token = env.CLOUDFLARE_API_TOKEN;
	if (!accountId || !databaseId || !token) return { ok: false, message: 'Cloudflare D1 is not configured' };

	try {
		const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify({
				sql: `INSERT INTO published_docs (tenant_slug, document, version, published_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4) ON CONFLICT(tenant_slug) DO UPDATE SET document=excluded.document, version=excluded.version, published_at=excluded.published_at, updated_at=excluded.updated_at`,
				params: [slug, JSON.stringify(document), version, publishedAt]
			})
		});
		const result = (await response.json().catch(() => null)) as { success?: boolean; errors?: { message?: string }[] } | null;
		if (!response.ok || result?.success === false) return { ok: false, message: result?.errors?.[0]?.message ?? 'Cloudflare D1 publish failed' };
		return { ok: true };
	} catch (error) {
		return { ok: false, message: error instanceof Error ? error.message : 'Cloudflare D1 publish failed' };
	}
}
