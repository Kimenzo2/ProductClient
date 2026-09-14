import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { findTenantForUser } from '$lib/server/tenantAccess';
import { pagePath, validateDocsDocument, type DocsDocument } from '$lib/data/docsEditor';
import { docsContentHash, mirrorDocsToD1, type DocsRedirect } from '$lib/server/docsPublish';
import { buildDocsArtifacts } from '$lib/server/docsArtifacts';
import type { RequestHandler } from './$types';

function redirectsBetween(previous: DocsDocument | null, next: DocsDocument): DocsRedirect[] {
	if (!previous) return [];
	const nextById = new Map(next.pages.map((page) => [page.id, page]));
	return previous.pages.flatMap((page) => {
		const replacement = nextById.get(page.id);
		if (!replacement) return [];
		const fromPath = pagePath(page.slug);
		const toPath = pagePath(replacement.slug);
		return fromPath !== toPath && fromPath !== '/' ? [{ fromPath, toPath }] : [];
	});
}

export const POST: RequestHandler = async ({ request }) => {
	let admin;
	try {
		admin = createAdminClient();
	} catch {
		return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });
	}
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const { data: auth } = await admin.auth.getUser(token);
	const userId = auth.user?.id;
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	const tenant = await findTenantForUser(admin, userId);
	if (!tenant) return json({ ok: false, code: 'TENANT_NOT_FOUND' }, { status: 404 });
	if (tenant.role === 'member') return json({ ok: false, code: 'FORBIDDEN', message: 'Only workspace owners and admins can roll back documentation.' }, { status: 403 });

	let body: { version?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST', message: 'Invalid JSON' }, { status: 400 });
	}
	const sourceVersion = Number(body.version ?? 0);
	if (!Number.isSafeInteger(sourceVersion) || sourceVersion < 1) return json({ ok: false, code: 'INVALID_VERSION' }, { status: 422 });

	const { data: source, error: sourceError } = await admin
		.from('docs_releases')
		.select('id, version, document, content_hash, published_at')
		.eq('tenant_id', tenant.id)
		.eq('version', sourceVersion)
		.maybeSingle();
	if (sourceError) return json({ ok: false, code: 'DB_ERROR', message: sourceError.message }, { status: 500 });
	if (!source?.document) return json({ ok: false, code: 'RELEASE_NOT_FOUND' }, { status: 404 });
	const document = source.document as DocsDocument;
	const issues = validateDocsDocument(document);
	if (issues.length) return json({ ok: false, code: 'INVALID_RELEASE', issues }, { status: 422 });

	const { data: current, error: currentError } = await admin
		.from('docs_documents')
		.select('published, published_version')
		.eq('tenant_id', tenant.id)
		.maybeSingle();
	if (currentError) return json({ ok: false, code: 'DB_ERROR', message: currentError.message }, { status: 500 });
	const currentPublished = (current as { published?: unknown; published_version?: number } | null)?.published;
	const previousPublished = currentPublished && validateDocsDocument(currentPublished).length === 0 ? currentPublished as DocsDocument : null;
	const publishedVersion = Number((current as { published_version?: number } | null)?.published_version ?? 0) + 1;
	const publishedAt = new Date().toISOString();
	const contentHash = docsContentHash(document);
	const releaseId = crypto.randomUUID();
	const redirects = redirectsBetween(previousPublished, document);

	const { data: updated, error: updateError } = await admin
		.from('docs_documents')
		.update({
			published: document,
			published_version: publishedVersion,
			published_at: publishedAt,
			published_hash: contentHash,
			published_release_id: releaseId,
			publication_state: 'syncing',
			publication_error: null,
			publication_attempted_at: publishedAt,
			updated_by: userId
		})
		.eq('tenant_id', tenant.id)
		.select('published_version')
		.maybeSingle();
	if (updateError) return json({ ok: false, code: 'DB_ERROR', message: updateError.message }, { status: 500 });
	if (!updated) return json({ ok: false, code: 'CONFLICT', message: 'The published document changed elsewhere. Reload before rolling back.' }, { status: 409 });

	const release = await admin.from('docs_releases').insert({
		id: releaseId,
		tenant_id: tenant.id,
		version: publishedVersion,
		document,
		content_hash: contentHash,
		published_at: publishedAt,
		published_by: userId,
		rollback_of_version: sourceVersion
	});
	if (release.error) {
		await admin.from('docs_documents').update({ publication_state: 'failed', publication_error: 'Release history could not be recorded.' }).eq('tenant_id', tenant.id);
		return json({ ok: false, code: 'RELEASE_RECORD_FAILED', message: 'The rollback was not recorded. Retry it.' }, { status: 503, headers: { 'retry-after': '5' } });
	}
	const artifacts = buildDocsArtifacts(document, tenant.slug, publishedVersion, contentHash);
	const artifactWrite = await admin.from('docs_release_artifacts').insert({
		release_id: releaseId,
		tenant_id: tenant.id,
		schema_version: document.schemaVersion,
		content_digest: contentHash,
		markdown: artifacts.markdown,
		llms_txt: artifacts.llmsTxt,
		skill_md: artifacts.skillMd,
		mcp_json: artifacts.mcpJson,
		sitemap_xml: artifacts.sitemapXml
	});
	if (artifactWrite.error) {
		await admin.from('docs_documents').update({ publication_state: 'failed', publication_error: 'Generated release artifacts could not be recorded.' }).eq('tenant_id', tenant.id);
		return json({ ok: false, code: 'ARTIFACT_RECORD_FAILED', message: 'The rollback artifacts could not be recorded. Retry it.' }, { status: 503, headers: { 'retry-after': '5' } });
	}
	await admin.from('docs_audit_events').insert({ tenant_id: tenant.id, actor_id: userId, event_type: 'docs.rollback_started', release_id: releaseId, version: publishedVersion, details: { rolledBackFrom: sourceVersion, contentHash, redirectCount: redirects.length } });
	if (redirects.length) {
		const redirectWrite = await admin.from('docs_redirects').upsert(redirects.map((redirect) => ({ tenant_id: tenant.id, from_path: redirect.fromPath, to_path: redirect.toPath, release_id: releaseId })), { onConflict: 'tenant_id,from_path' });
		if (redirectWrite.error) {
			await admin.from('docs_documents').update({ publication_state: 'failed', publication_error: 'Redirect history could not be recorded.' }).eq('tenant_id', tenant.id);
			return json({ ok: false, code: 'REDIRECT_RECORD_FAILED', message: 'The rollback was not completed. Retry it.' }, { status: 503, headers: { 'retry-after': '5' } });
		}
	}
	await admin.from('docs_publication_attempts').insert({ tenant_id: tenant.id, release_id: releaseId, version: publishedVersion, content_hash: contentHash, state: 'pending', attempted_at: publishedAt });

	const mirror = await mirrorDocsToD1(tenant.slug, document, publishedVersion, publishedAt, contentHash, releaseId, sourceVersion, redirects);
	if (!mirror.ok) {
		await admin.from('docs_documents').update({ publication_state: 'failed', publication_error: 'Hosted documentation sync failed.' }).eq('tenant_id', tenant.id);
		await admin.from('docs_publication_attempts').update({ state: 'failed', error_code: 'HOSTED_SYNC_FAILED', error_message: 'Hosted documentation sync failed.', completed_at: new Date().toISOString() }).eq('tenant_id', tenant.id).eq('release_id', releaseId);
		await admin.from('docs_audit_events').insert({ tenant_id: tenant.id, actor_id: userId, event_type: 'docs.rollback_failed', release_id: releaseId, version: publishedVersion, details: { rolledBackFrom: sourceVersion, code: 'HOSTED_SYNC_FAILED' } });
		return json({ ok: false, code: 'HOSTED_SYNC_FAILED', version: publishedVersion, message: 'The rollback was saved but the hosted documentation did not update. Retry publishing.' }, { status: 503, headers: { 'retry-after': '5' } });
	}
	await admin.from('docs_documents').update({ publication_state: 'published', publication_error: null }).eq('tenant_id', tenant.id);
	await admin.from('docs_publication_attempts').update({ state: 'succeeded', completed_at: new Date().toISOString() }).eq('tenant_id', tenant.id).eq('release_id', releaseId);
	await admin.from('docs_audit_events').insert({ tenant_id: tenant.id, actor_id: userId, event_type: 'docs.rollback_succeeded', release_id: releaseId, version: publishedVersion, details: { rolledBackFrom: sourceVersion, contentHash, redirectCount: redirects.length } });
	return json({ ok: true, version: publishedVersion, rolledBackFrom: sourceVersion, publishedAt });
};
