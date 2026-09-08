import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { findTenantForUser } from '$lib/server/tenantAccess';
import type { RequestHandler } from './$types';

type PublicStatusState = 'operational' | 'degraded' | 'outage' | 'unknown';
type PublicIncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

const serviceStates = new Set<PublicStatusState>(['operational', 'degraded', 'outage', 'unknown']);
const incidentStates = new Set<PublicIncidentStatus>(['investigating', 'identified', 'monitoring', 'resolved']);
const incidentStatusRank: Record<PublicIncidentStatus, number> = {
	investigating: 1,
	identified: 2,
	monitoring: 3,
	resolved: 4
};
const incidentModes = new Set(['Active', 'Retrospective', 'Test']);
const incidentSeverities = new Set(['Critical', 'High impact', 'Medium impact']);
const MAX_SERVICES = 100;
const MAX_INCIDENTS = 200;
const MAX_UPDATES_PER_INCIDENT = 100;

function readText(value: unknown, field: string, issues: string[], maxLength: number, required = true): string {
	if (typeof value !== 'string') {
		issues.push(`${field} must be a string.`);
		return '';
	}
	const text = value.trim();
	if (required && !text) issues.push(`${field} is required.`);
	if (text.length > maxLength) issues.push(`${field} must be ${maxLength} characters or fewer.`);
	return text;
}

function validTimestamp(value: string) {
	return Boolean(value) && !Number.isNaN(Date.parse(value));
}

function authenticate(request: Request, admin: ReturnType<typeof createAdminClient>) {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : '';
	if (!token) return Promise.resolve<string | null>(null);
	return admin.auth.getUser(token).then(({ data }) => data.user?.id ?? null).catch(() => null);
}

function validateDocument(value: unknown): { document?: Record<string, unknown>; issues: string[] } {
	const issues: string[] = [];
	if (!value || typeof value !== 'object' || Array.isArray(value)) return { issues: ['Status Page content must be an object.'] };
	const source = value as Record<string, unknown>;
	const pageTitle = readText(source.pageTitle, 'pageTitle', issues, 120);
	const pageDescription = readText(source.pageDescription, 'pageDescription', issues, 280);
	if (!Array.isArray(source.services)) issues.push('services must be an array.');
	if (!Array.isArray(source.incidents)) issues.push('incidents must be an array.');
	if (Array.isArray(source.services) && source.services.length > MAX_SERVICES) issues.push(`services cannot contain more than ${MAX_SERVICES} items.`);
	if (Array.isArray(source.incidents) && source.incidents.length > MAX_INCIDENTS) issues.push(`incidents cannot contain more than ${MAX_INCIDENTS} items.`);
	const serviceIds = new Set<string>();
	const services: Record<string, unknown>[] = [];

	if (Array.isArray(source.services)) {
		for (const [index, service] of source.services.entries()) {
			if (!service || typeof service !== 'object') {
				issues.push(`services[${index}] must be an object.`);
				continue;
			}
			const item = service as Record<string, unknown>;
			const id = readText(item.id, `services[${index}].id`, issues, 80);
			const name = readText(item.name, `services[${index}].name`, issues, 120);
			const description = readText(item.description, `services[${index}].description`, issues, 280);
			const uptime = readText(item.uptime, `services[${index}].uptime`, issues, 20);
			if (!serviceStates.has(item.status as PublicStatusState)) issues.push(`services[${index}].status is invalid.`);
			if (id && serviceIds.has(id)) issues.push(`services[${index}].id must be unique.`);
			if (id) serviceIds.add(id);
			services.push({ id, name, description, status: item.status, uptime });
		}
	}

	const incidents: Record<string, unknown>[] = [];
	if (Array.isArray(source.incidents)) {
		for (const [index, incident] of source.incidents.entries()) {
			if (!incident || typeof incident !== 'object') {
				issues.push(`incidents[${index}] must be an object.`);
				continue;
			}
			const item = incident as Record<string, unknown>;
			const id = readText(item.id, `incidents[${index}].id`, issues, 100);
			const title = readText(item.title, `incidents[${index}].title`, issues, 160);
			const summary = readText(item.summary, `incidents[${index}].summary`, issues, 500);
			const leadName = typeof item.leadName === 'string' && item.leadName.trim() ? item.leadName.trim().slice(0, 120) : 'Unassigned';
			const coordinationChannel = typeof item.coordinationChannel === 'string' ? item.coordinationChannel.trim().slice(0, 200) : '';
			const startedAt = readText(item.startedAt, `incidents[${index}].startedAt`, issues, 80);
			if (startedAt && !validTimestamp(startedAt)) issues.push(`incidents[${index}].startedAt must be a valid timestamp.`);
			if (!incidentStates.has(item.status as PublicIncidentStatus)) issues.push(`incidents[${index}].status is invalid.`);
			if (item.mode !== undefined && !incidentModes.has(item.mode as string)) issues.push(`incidents[${index}].mode is invalid.`);
			if (item.severity !== undefined && !incidentSeverities.has(item.severity as string)) issues.push(`incidents[${index}].severity is invalid.`);
			const affectedServices = Array.isArray(item.affectedServices) && item.affectedServices.every((serviceId) => typeof serviceId === 'string') ? item.affectedServices.map((serviceId) => String(serviceId).trim()) : [];
			if (!Array.isArray(item.affectedServices) || !item.affectedServices.every((serviceId) => typeof serviceId === 'string') || affectedServices.some((serviceId) => !serviceIds.has(serviceId))) issues.push(`incidents[${index}].affectedServices must reference existing service ids.`);
			if (!Array.isArray(item.updates)) {
				issues.push(`incidents[${index}].updates must be an array.`);
				continue;
			}
			if (!item.updates.length) issues.push(`incidents[${index}].updates must contain at least one update.`);
			if (item.updates.length > MAX_UPDATES_PER_INCIDENT) issues.push(`incidents[${index}].updates cannot contain more than ${MAX_UPDATES_PER_INCIDENT} items.`);
			const updates: Record<string, unknown>[] = [];
			for (const [updateIndex, update] of item.updates.entries()) {
				if (!update || typeof update !== 'object') {
					issues.push(`incidents[${index}].updates[${updateIndex}] must be an object.`);
					continue;
				}
				const updateItem = update as Record<string, unknown>;
				const updateId = readText(updateItem.id, `incidents[${index}].updates[${updateIndex}].id`, issues, 120);
				const publishedAt = readText(updateItem.publishedAt, `incidents[${index}].updates[${updateIndex}].publishedAt`, issues, 80);
				const message = readText(updateItem.message, `incidents[${index}].updates[${updateIndex}].message`, issues, 2000);
				if (publishedAt && !validTimestamp(publishedAt)) issues.push(`incidents[${index}].updates[${updateIndex}].publishedAt must be a valid timestamp.`);
				if (!incidentStates.has(updateItem.status as PublicIncidentStatus)) issues.push(`incidents[${index}].updates[${updateIndex}].status is invalid.`);
				updates.push({ id: updateId, status: updateItem.status, publishedAt, message });
			}
			const resolvedAt = typeof item.resolvedAt === 'string' && item.resolvedAt.trim() ? item.resolvedAt.trim() : undefined;
			if (resolvedAt && !validTimestamp(resolvedAt)) issues.push(`incidents[${index}].resolvedAt must be a valid timestamp.`);
			incidents.push({ id, title, summary, leadName, status: item.status, startedAt, ...(resolvedAt ? { resolvedAt } : {}), ...(item.mode ? { mode: item.mode } : {}), ...(item.severity ? { severity: item.severity } : {}), ...(coordinationChannel ? { coordinationChannel } : {}), affectedServices, updates });
		}
	}

	return issues.length ? { issues } : { document: { pageTitle, pageDescription, services, incidents }, issues };
}

async function getContext(request: Request) {
	const admin = createAdminClient();
	const userId = await authenticate(request, admin);
	if (!userId) return { admin, userId: null, tenant: null };

	let tenant = await findTenantForUser(admin, userId);
	if (!tenant) {
		await admin.rpc('ensure_tenant_for_user', { p_user_id: userId });
		tenant = await findTenantForUser(admin, userId);
	}
	return { admin, userId, tenant, role: tenant?.role ?? null };
}

async function syncIncidentModel(admin: ReturnType<typeof createAdminClient>, tenantId: string, userId: string, document: Record<string, unknown>) {
	const services = (document.services as Record<string, unknown>[]) ?? [];
	const incidents = (document.incidents as Record<string, unknown>[]) ?? [];
	const { data: existing, error: existingError } = await admin
		.from('incidents')
		.select('id, external_id, status, resolved_at, lead_name, lead_user_id, severity, mode, coordination_channel, updated_at')
		.eq('tenant_id', tenantId);
	if (existingError) return existingError;

	for (const incident of incidents) {
		const externalId = String(incident.id);
		const previous = (existing ?? []).find((row) => row.external_id === externalId) as Record<string, unknown> | undefined;
		const previousStatus = previous?.status as PublicIncidentStatus | undefined;
		const requestedStatus = incident.status as PublicIncidentStatus;
		const effectiveStatus = previousStatus && incidentStatusRank[previousStatus] > incidentStatusRank[requestedStatus] ? previousStatus : requestedStatus;
		if (previousStatus && effectiveStatus !== requestedStatus) {
			console.warn('[status-editor][status-integrity] prevented stale status regression', {
				tenantId,
				externalId,
				from: previousStatus,
				requested: requestedStatus,
				updatedAt: previous?.updated_at
			});
		}
		const affectedServices = Array.isArray(incident.affectedServices) ? incident.affectedServices.map(String) : [];
		const affected = services.filter((service) => affectedServices.includes(String(service.id)));
		const fallbackSeverity = affected.some((service) => service.status === 'outage') ? 'High impact' : 'Medium impact';
		const updates = (Array.isArray(incident.updates) ? incident.updates : []) as Record<string, unknown>[];
		const lastResolved = [...updates].reverse().find((update) => update.status === 'resolved');
		const resolvedAt = effectiveStatus === 'resolved'
			? (previous?.resolved_at ?? incident.resolvedAt ?? lastResolved?.publishedAt ?? new Date().toISOString())
			: null;
		const { data: row, error } = await admin.from('incidents').upsert({
			tenant_id: tenantId,
			external_id: externalId,
			title: incident.title,
			summary: incident.summary,
			status: effectiveStatus,
			severity: incident.severity ?? previous?.severity ?? fallbackSeverity,
			mode: incident.mode ?? previous?.mode ?? 'Active',
			lead_user_id: previous?.lead_user_id ?? null,
			lead_name: incident.leadName ?? previous?.lead_name ?? 'Unassigned',
			coordination_channel: incident.coordinationChannel ?? previous?.coordination_channel ?? null,
			public_message: updates.at(-1)?.message ?? incident.summary,
			started_at: incident.startedAt,
			resolved_at: resolvedAt,
			created_by: previous ? undefined : userId,
			updated_by: userId,
			updated_at: new Date().toISOString()
		}, { onConflict: 'tenant_id,external_id' }).select('id').single();
		if (error || !row) return error ?? new Error('Unable to save incident record.');

		const incidentId = row.id as string;
		const { data: existingUpdates, error: existingUpdatesError } = await admin
			.from('incident_updates')
			.select('external_id')
			.eq('incident_id', incidentId);
		if (existingUpdatesError) return existingUpdatesError;
		const existingUpdateIds = new Set((existingUpdates ?? []).map((update) => String(update.external_id)));
		const writableUpdates = previousStatus === 'resolved'
			? updates.filter((update) => existingUpdateIds.has(String(update.id)) || update.status === 'resolved')
			: updates;
		if (previousStatus === 'resolved' && writableUpdates.length !== updates.length) {
			console.warn('[status-editor][status-integrity] ignored post-resolution backward updates', {
				tenantId,
				externalId,
				ignored: updates.length - writableUpdates.length
			});
		}
		if (writableUpdates.length) {
			const { error: updateError } = await admin.from('incident_updates').upsert(
				writableUpdates.map((update) => ({
					incident_id: incidentId,
					external_id: String(update.id),
					status: update.status,
					message: update.message,
					published_at: update.publishedAt,
					created_by: userId
				})),
				{ onConflict: 'incident_id,external_id', ignoreDuplicates: true }
			);
			if (updateError) return updateError;
		}
		// Incident updates are an append-only audit trail. A stale full-page
		// snapshot must not delete a newer resolution or rewrite history.
		if (affected.length) {
			const { error: serviceError } = await admin.from('incident_services').upsert(
				affected.map((service) => ({ incident_id: incidentId, service_id: String(service.id), service_name: String(service.name) })),
				{ onConflict: 'incident_id,service_id' }
			);
			if (serviceError) return serviceError;
		}
		const { data: existingServices, error: existingServicesError } = await admin
			.from('incident_services')
			.select('incident_id, service_id')
			.eq('incident_id', incidentId);
		if (existingServicesError) return existingServicesError;
		const serviceIds = new Set(affected.map((service) => String(service.id)));
		for (const staleService of (existingServices ?? []).filter((service) => !serviceIds.has(service.service_id))) {
			const { error: staleServiceError } = await admin
				.from('incident_services')
				.delete()
				.eq('incident_id', staleService.incident_id)
				.eq('service_id', staleService.service_id);
			if (staleServiceError) return staleServiceError;
		}

		if (effectiveStatus === 'resolved') {
			const followUpExternalId = `${externalId}-root-cause-follow-up`;
			const { data: existingFollowUp, error: followUpLookupError } = await admin
				.from('incident_work_items')
				.select('id')
				.eq('incident_id', incidentId)
				.eq('work_type', 'follow_up')
				.limit(1);
			if (followUpLookupError) return followUpLookupError;
			if (!existingFollowUp?.length) {
				const { error: followUpError } = await admin.from('incident_work_items').upsert({
					incident_id: incidentId,
					external_id: followUpExternalId,
					work_type: 'follow_up',
					title: 'Capture the cause and next step',
					description: 'Record what caused this incident and the action that will prevent a repeat.',
					kind: 'Product work',
					phase: 'Documenting',
					status: 'Open',
					owner_name: incident.leadName ?? 'Unassigned',
					due_label: 'No due date',
					destination_href: `/workspace/incidents/${externalId}`,
					created_by: userId,
					updated_by: userId
				}, { onConflict: 'incident_id,external_id', ignoreDuplicates: true });
				if (followUpError) return followUpError;
			}
			const flowTasks = [
				{
					external_id: `${externalId}-timeline-review`,
					work_type: 'review_task',
					title: 'Review the incident timeline',
					description: 'Confirm detection, mitigation, and recovery are recorded before this response is closed.',
					kind: 'Timeline review',
					phase: 'Documenting'
				},
				{
					external_id: `${externalId}-customer-review`,
					work_type: 'review_task',
					title: 'Review customer communication',
					description: 'Confirm the published updates accurately explain the impact and resolution.',
					kind: 'Customer review',
					phase: 'Reviewing'
				},
				{
					external_id: `${externalId}-follow-ups-review`,
					work_type: 'review_task',
					title: 'Review follow-up work',
					description: 'Capture the remaining work with a clear owner, due date, and destination.',
					kind: 'Follow-ups',
					phase: 'Reviewing',
					destination_href: `/workspace/incidents/follow-ups?selected=${encodeURIComponent(followUpExternalId)}`
				}
			].map((task) => ({
				incident_id: incidentId,
				external_id: task.external_id,
				work_type: task.work_type,
				title: task.title,
				description: task.description,
				kind: task.kind,
				phase: task.phase,
				status: 'Open',
				owner_name: incident.leadName ?? 'Unassigned',
				due_label: 'No due date',
				destination_href: task.destination_href ?? null,
				created_by: userId,
				updated_by: userId
			}));
			const { error: taskError } = await admin.from('incident_work_items').upsert(flowTasks, { onConflict: 'incident_id,external_id', ignoreDuplicates: true });
			if (taskError) return taskError;
		}
	}
	return null;
}

async function readNormalizedIncidents(admin: ReturnType<typeof createAdminClient>, tenantId: string) {
	try {
		const { data: rows, error } = await admin.from('incidents').select('id, external_id, title, summary, status, lead_name, started_at, resolved_at').eq('tenant_id', tenantId).order('started_at', { ascending: false });
		if (error || !rows?.length) return null;
		const ids = rows.map((row) => row.id as string);
		const [{ data: updates }, { data: services }] = await Promise.all([
			admin.from('incident_updates').select('incident_id, external_id, status, message, published_at, created_at').in('incident_id', ids).order('published_at', { ascending: true }).order('created_at', { ascending: true }),
			admin.from('incident_services').select('incident_id, service_id').in('incident_id', ids)
		]);
		return rows.map((row) => ({
			id: row.external_id,
			title: row.title,
			summary: row.summary,
			leadName: row.lead_name,
			status: row.status,
			startedAt: row.started_at,
			...(row.resolved_at ? { resolvedAt: row.resolved_at } : {}),
			affectedServices: (services ?? []).filter((service) => service.incident_id === row.id).map((service) => service.service_id),
			updates: (updates ?? []).filter((update) => update.incident_id === row.id).map((update) => ({ id: update.external_id, status: update.status, publishedAt: update.published_at, message: update.message }))
		}));
	} catch {
		return null;
	}
}

export const GET: RequestHandler = async ({ request }) => {
	try {
		const { admin, tenant } = await getContext(request);
		if (!tenant) return json({ ok: true, page: null });
		const { data, error } = await admin.from('status_pages').select('page_title, page_description, services, incidents, published_at').eq('tenant_id', tenant.id).maybeSingle();
		if (error) {
			console.error('[status-editor] failed to load Supabase Status Page', error);
			return json({ ok: false, code: 'DB_ERROR', message: 'Unable to load the Status Page right now.' }, { status: 500 });
		}
		if (!data) return json({ ok: true, page: null });
		const normalizedIncidents = await readNormalizedIncidents(admin, tenant.id);
		return json({ ok: true, page: { productSlug: tenant.slug, pageTitle: data.page_title, pageDescription: data.page_description, services: data.services, incidents: normalizedIncidents ?? data.incidents }, publishedAt: data.published_at });
	} catch (error) {
		console.error('[status-editor] failed to load Status Page context', error);
		return json({ ok: false, code: 'NOT_CONFIGURED', message: 'Status Editor is not configured yet.' }, { status: 503 });
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	const contentLength = Number(request.headers.get('content-length') ?? 0);
	if (contentLength > 1_000_000) return json({ ok: false, code: 'PAYLOAD_TOO_LARGE', message: 'Status Page content is too large.' }, { status: 413 });
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}

	const { document, issues } = validateDocument(body);
	if (!document) return json({ ok: false, code: 'INVALID', issues }, { status: 422 });

	try {
		const { admin, userId, tenant, role } = await getContext(request);
		if (!userId) return json({ ok: false, code: 'UNAUTHORIZED', message: 'Sign in required.' }, { status: 401 });
		if (!tenant) return json({ ok: false, code: 'TENANT_NOT_FOUND' }, { status: 404 });
		if (role !== 'owner' && role !== 'admin') return json({ ok: false, code: 'FORBIDDEN', message: 'Manager access required.' }, { status: 403 });

		const now = new Date().toISOString();
		const incidentModelError = await syncIncidentModel(admin, tenant.id, userId, document);
		if (incidentModelError) {
			console.error('[status-editor] failed to sync normalized incident model', incidentModelError);
			return json({ ok: false, code: 'INCIDENT_MODEL_ERROR', message: 'Unable to save the connected Incident record.' }, { status: 500 });
		}
		const canonicalIncidents = await readNormalizedIncidents(admin, tenant.id);
		if (canonicalIncidents) document.incidents = canonicalIncidents;
		const { error } = await admin.from('status_pages').upsert({
			tenant_id: tenant.id,
			tenant_slug: tenant.slug,
			page_title: document.pageTitle,
			page_description: document.pageDescription,
			services: document.services,
			incidents: document.incidents,
			updated_by: userId,
			updated_at: now,
			published_at: now
		}, { onConflict: 'tenant_id' });
		if (error) {
			console.error('[status-editor] failed to save Supabase Status Page', error);
			return json({ ok: false, code: 'DB_ERROR', message: 'Unable to save the Status Page right now.' }, { status: 500 });
		}

		const edgeSynced = await mirrorToD1(tenant.slug, document, now);
		return json({ ok: true, slug: tenant.slug, publishedAt: now, edgeSynced, ...(edgeSynced ? {} : { message: 'Saved to the workspace; the hosted page is still syncing.' }) }, { status: edgeSynced ? 200 : 202 });
	} catch (error) {
		console.error('[status-editor] failed to publish Status Page', error);
		return json({ ok: false, code: 'NOT_CONFIGURED', message: 'Status Editor is not configured yet.' }, { status: 503 });
	}
};

async function mirrorToD1(slug: string, document: Record<string, unknown>, timestamp: string): Promise<boolean> {
	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const databaseId = env.CLOUDFLARE_D1_DATABASE_ID;
	const token = env.CLOUDFLARE_API_TOKEN;
	if (!accountId || !databaseId || !token) return false;

	try {
		const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify({
				sql: 'INSERT INTO status_pages (tenant_slug, page_title, page_description, services_json, incidents_json, updated_at, published_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6) ON CONFLICT(tenant_slug) DO UPDATE SET page_title=excluded.page_title, page_description=excluded.page_description, services_json=excluded.services_json, incidents_json=excluded.incidents_json, updated_at=excluded.updated_at, published_at=excluded.published_at',
				params: [slug, document.pageTitle, document.pageDescription, JSON.stringify(document.services), JSON.stringify(document.incidents), timestamp]
			})
		});
		if (!response.ok) {
			console.error('[status-editor] D1 mirror failed', response.status, await response.text());
			return false;
		}
		const payload = (await response.json().catch(() => ({}))) as { success?: boolean };
		if (payload.success === false) {
			console.error('[status-editor] D1 mirror returned an error', payload);
			return false;
		}
		return true;
	} catch {
		console.error('[status-editor] D1 mirror request failed');
		return false;
	}
}
