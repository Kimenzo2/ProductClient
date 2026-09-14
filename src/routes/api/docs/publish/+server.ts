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
	if (tenant.role === 'member') return json({ ok: false, code: 'FORBIDDEN', message: 'Only workspace owners and admins can publish documentation.' }, { status: 403 });

	let body: { version?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST', message: 'Invalid JSON' }, { status: 400 });
	}
	const expectedVersion = Number(body.version ?? 0);
	if (!Number.isInteger(expectedVersion) || expectedVersion < 1) return json({ ok: false, code: 'INVALID_VERSION' }, { status: 422 });

	const { data: row, error } = await admin
		.from('docs_documents')
		.select('draft, draft_version, published, published_version, published_at, publication_state, publication_error, published_hash, published_release_id')
		.eq('tenant_id', tenant.id)
		.maybeSingle();
	if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
	const current = row as {
		draft?: unknown;
		draft_version?: number;
		published?: unknown;
		published_version?: number;
		published_at?: string | null;
		publication_state?: 'unpublished' | 'syncing' | 'published' | 'failed';
		publication_error?: string | null;
		published_hash?: string | null;
		published_release_id?: string | null;
	} | null;
	if (!current?.draft || current.draft_version !== expectedVersion) return json({ ok: false, code: 'CONFLICT', message: 'Save the latest draft before publishing.' }, { status: 409 });
	const issues = validateDocsDocument(current.draft);
	if (issues.length) return json({ ok: false, code: 'INVALID', issues }, { status: 422 });

	// A failed D1 mirror is retryable without creating a fake new release.
	if (current.publication_state === 'failed' && current.published && current.published_at && current.published_release_id && current.published_version && validateDocsDocument(current.published).length === 0) {
		const published = current.published as DocsDocument;
		const contentHash = current.published_hash ?? docsContentHash(published);
		const existingRelease = await admin.from('docs_releases').select('id').eq('tenant_id', tenant.id).eq('version', current.published_version).maybeSingle();
		if (existingRelease.error) return json({ ok: false, code: 'DB_ERROR', message: existingRelease.error.message }, { status: 500 });
		if (!existingRelease.data) {
			const releaseRepair = await admin.from('docs_releases').insert({ id: current.published_release_id, tenant_id: tenant.id, version: current.published_version, document: published, content_hash: contentHash, published_at: current.published_at, published_by: userId });
			if (releaseRepair.error) return json({ ok: false, code: 'RELEASE_RECORD_FAILED', message: 'The release history is incomplete. Retry publishing.' }, { status: 503, headers: { 'retry-after': '5' } });
		}
		const retryArtifacts = buildDocsArtifacts(published, tenant.slug, current.published_version, contentHash);
		const retryArtifactWrite = await admin.from('docs_release_artifacts').upsert({
			release_id: current.published_release_id,
			tenant_id: tenant.id,
			schema_version: published.schemaVersion,
			content_digest: contentHash,
			markdown: retryArtifacts.markdown,
			llms_txt: retryArtifacts.llmsTxt,
			skill_md: retryArtifacts.skillMd,
			mcp_json: retryArtifacts.mcpJson,
			sitemap_xml: retryArtifacts.sitemapXml
		}, { onConflict: 'release_id' });
		if (retryArtifactWrite.error) return json({ ok: false, code: 'ARTIFACT_RECORD_FAILED', message: 'The release artifacts are incomplete. Retry publishing.' }, { status: 503, headers: { 'retry-after': '5' } });
		const mirror = await mirrorDocsToD1(tenant.slug, published, current.published_version, current.published_at, contentHash, current.published_release_id);
		if (!mirror.ok) {
			await admin.from('docs_documents').update({ publication_state: 'failed', publication_error: 'Hosted documentation sync failed.', publication_attempted_at: new Date().toISOString() }).eq('tenant_id', tenant.id);
			await admin.from('docs_publication_attempts').update({ state: 'failed', error_code: 'HOSTED_SYNC_FAILED', error_message: 'Hosted documentation sync failed.', completed_at: new Date().toISOString() }).eq('tenant_id', tenant.id).eq('release_id', current.published_release_id);
			await admin.from('docs_audit_events').insert({ tenant_id: tenant.id, actor_id: userId, event_type: 'docs.publish_retry_failed', release_id: current.published_release_id, version: current.published_version, details: { code: 'HOSTED_SYNC_FAILED' } });
			return json({ ok: false, code: 'HOSTED_SYNC_FAILED', version: current.published_version, message: 'The hosted documentation is still unavailable. Retry publishing.' }, { status: 503, headers: { 'retry-after': '5' } });
		}
		await admin.from('docs_documents').update({ publication_state: 'published', publication_error: null, publication_attempted_at: new Date().toISOString() }).eq('tenant_id', tenant.id);
		await admin.from('docs_publication_attempts').update({ state: 'succeeded', completed_at: new Date().toISOString() }).eq('tenant_id', tenant.id).eq('release_id', current.published_release_id);
		await admin.from('docs_audit_events').insert({ tenant_id: tenant.id, actor_id: userId, event_type: 'docs.publish_retry_succeeded', release_id: current.published_release_id, version: current.published_version, details: { contentHash } });
		return json({ ok: true, version: current.published_version, publishedAt: current.published_at, retried: true });
	}

	const publishedAt = new Date().toISOString();
	const publishedVersion = (current.published_version ?? 0) + 1;
	const published = current.draft as DocsDocument;
	const contentHash = docsContentHash(published);
	const releaseId = crypto.randomUUID();
	const previousPublished = current.published && validateDocsDocument(current.published).length === 0 ? current.published as DocsDocument : null;
	const redirects = redirectsBetween(previousPublished, published);
	const { data: updated, error: updateError } = await admin
		.from('docs_documents')
		.update({
			published,
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
		.eq('draft_version', expectedVersion)
		.eq('published_version', current.published_version ?? 0)
		.select('published_version')
		.maybeSingle();
	if (updateError) return json({ ok: false, code: 'DB_ERROR', message: updateError.message }, { status: 500 });
	if (!updated) return json({ ok: false, code: 'CONFLICT', message: 'This document changed elsewhere. Reload it before publishing.' }, { status: 409 });

	const release = await admin.from('docs_releases').insert({
		id: releaseId,
		tenant_id: tenant.id,
		version: publishedVersion,
		document: published,
		content_hash: contentHash,
		published_at: publishedAt,
		published_by: userId
	});
	if (release.error) {
		await admin.from('docs_documents').update({ publication_state: 'failed', publication_error: 'Release history could not be recorded.' }).eq('tenant_id', tenant.id);
		return json({ ok: false, code: 'RELEASE_RECORD_FAILED', message: 'The release was not recorded. Retry publishing.' }, { status: 503, headers: { 'retry-after': '5' } });
	}
	const artifacts = buildDocsArtifacts(published, tenant.slug, publishedVersion, contentHash);
	const artifactWrite = await admin.from('docs_release_artifacts').insert({
		release_id: releaseId,
		tenant_id: tenant.id,
		schema_version: published.schemaVersion,
		content_digest: contentHash,
		markdown: artifacts.markdown,
		llms_txt: artifacts.llmsTxt,
		skill_md: artifacts.skillMd,
		mcp_json: artifacts.mcpJson,
		sitemap_xml: artifacts.sitemapXml
	});
	if (artifactWrite.error) {
		await admin.from('docs_documents').update({ publication_state: 'failed', publication_error: 'Generated release artifacts could not be recorded.' }).eq('tenant_id', tenant.id);
		return json({ ok: false, code: 'ARTIFACT_RECORD_FAILED', message: 'The release artifacts could not be recorded. Retry publishing.' }, { status: 503, headers: { 'retry-after': '5' } });
	}
	await admin.from('docs_audit_events').insert({ tenant_id: tenant.id, actor_id: userId, event_type: 'docs.publish_started', release_id: releaseId, version: publishedVersion, details: { contentHash, redirectCount: redirects.length } });
	if (redirects.length) {
		const redirectRows = redirects.map((redirect) => ({ tenant_id: tenant.id, from_path: redirect.fromPath, to_path: redirect.toPath, release_id: releaseId }));
		const redirectWrite = await admin.from('docs_redirects').upsert(redirectRows, { onConflict: 'tenant_id,from_path' });
		if (redirectWrite.error) {
			await admin.from('docs_documents').update({ publication_state: 'failed', publication_error: 'Redirect history could not be recorded.' }).eq('tenant_id', tenant.id);
			return json({ ok: false, code: 'REDIRECT_RECORD_FAILED', message: 'The release was not completed. Retry publishing.' }, { status: 503, headers: { 'retry-after': '5' } });
		}
	}
	await admin.from('docs_publication_attempts').insert({ tenant_id: tenant.id, release_id: releaseId, version: publishedVersion, content_hash: contentHash, state: 'pending', attempted_at: publishedAt });

	const mirror = await mirrorDocsToD1(tenant.slug, published, publishedVersion, publishedAt, contentHash, releaseId, null, redirects);
	if (!mirror.ok) {
		console.error('[docs/publish] hosted sync failed', {
			tenant: tenant.slug,
			version: publishedVersion,
			message: mirror.message ?? 'unknown error'
		});
		await admin.from('docs_documents').update({ publication_state: 'failed', publication_error: 'Hosted documentation sync failed.' }).eq('tenant_id', tenant.id);
		await admin.from('docs_publication_attempts').update({ state: 'failed', error_code: 'HOSTED_SYNC_FAILED', error_message: 'Hosted documentation sync failed.', completed_at: new Date().toISOString() }).eq('tenant_id', tenant.id).eq('release_id', releaseId);
		await admin.from('docs_audit_events').insert({ tenant_id: tenant.id, actor_id: userId, event_type: 'docs.publish_failed', release_id: releaseId, version: publishedVersion, details: { code: 'HOSTED_SYNC_FAILED' } });
		return json(
			{
				ok: false,
				code: 'HOSTED_SYNC_FAILED',
				version: publishedVersion,
				message: 'The draft was saved, but the hosted documentation did not update. Retry publishing.'
			},
			{ status: 503, headers: { 'retry-after': '5' } }
		);
	}
	await admin.from('docs_documents').update({ publication_state: 'published', publication_error: null }).eq('tenant_id', tenant.id);
	await admin.from('docs_publication_attempts').update({ state: 'succeeded', completed_at: new Date().toISOString() }).eq('tenant_id', tenant.id).eq('release_id', releaseId);
	await admin.from('docs_audit_events').insert({ tenant_id: tenant.id, actor_id: userId, event_type: 'docs.publish_succeeded', release_id: releaseId, version: publishedVersion, details: { contentHash, redirectCount: redirects.length } });
	return json({ ok: true, version: publishedVersion, publishedAt });
};
