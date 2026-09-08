import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { findTenantForUser } from '$lib/server/tenantAccess';
import { followUps as seedFollowUps, postIncidentTasks as seedPostIncidentTasks } from '$lib/data/workspace';
import type { RequestHandler } from './$types';

async function getContext(request: Request) {
	const admin = createAdminClient();
	const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
	if (!token) return { admin, userId: null, tenant: null };
	const { data } = await admin.auth.getUser(token);
	const userId = data.user?.id ?? null;
	if (!userId) return { admin, userId: null, tenant: null };
	const tenant = await findTenantForUser(admin, userId);
	return { admin, userId, tenant };
}

async function seedDemoWorkItems(admin: ReturnType<typeof createAdminClient>, tenantId: string, userId: string) {
	const { data: incidents, error: incidentError } = await admin.from('incidents').select('id, external_id').eq('tenant_id', tenantId);
	if (incidentError) return incidentError;
	const byExternalId = new Map((incidents ?? []).map((incident) => [incident.external_id as string, incident.id as string]));
	const rows = [
		...seedFollowUps.flatMap((item) => {
			const incidentId = byExternalId.get(item.incidentId);
			return incidentId ? [{ incident_id: incidentId, external_id: item.id, work_type: 'follow_up', title: item.title, description: item.description, kind: item.kind, phase: 'Documenting', status: item.status, owner_name: item.owner, due_label: item.due, destination_href: item.href, created_by: userId, updated_by: userId }] : [];
		}),
		...seedPostIncidentTasks.flatMap((item) => {
			const incidentId = byExternalId.get(item.incidentId);
			return incidentId ? [{ incident_id: incidentId, external_id: item.id, work_type: 'review_task', title: item.title, description: item.description, kind: item.kind, phase: item.phase, status: item.status, owner_name: item.owner, due_label: item.due, destination_href: item.href ?? null, created_by: userId, updated_by: userId }] : [];
		})
	];
	if (!rows.length) return null;
	const { error } = await admin.from('incident_work_items').upsert(rows, { onConflict: 'incident_id,external_id', ignoreDuplicates: true });
	return error ?? null;
}

async function ensureResolvedFlowTasks(admin: ReturnType<typeof createAdminClient>, tenantId: string, userId: string) {
	const { data: resolved, error } = await admin.from('incidents').select('id, external_id, lead_name').eq('tenant_id', tenantId).eq('status', 'resolved');
	if (error) return error;
	const resolvedIds = (resolved ?? []).map((incident) => incident.id as string);
	const { data: existingFollowUps, error: followUpError } = resolvedIds.length
		? await admin.from('incident_work_items').select('incident_id').in('incident_id', resolvedIds).eq('work_type', 'follow_up')
		: { data: [], error: null };
	if (followUpError) return followUpError;
	const followUpIncidentIds = new Set((existingFollowUps ?? []).map((item) => item.incident_id as string));
	const rows = (resolved ?? []).flatMap((incident) => [
		...(followUpIncidentIds.has(incident.id as string) ? [] : [{
			external_id: `${incident.external_id}-root-cause-follow-up`,
			work_type: 'follow_up',
			title: 'Capture the cause and next step',
			description: 'Record what caused this incident and the action that will prevent a repeat.',
			kind: 'Product work',
			phase: 'Documenting',
			status: 'Open',
			owner_name: incident.lead_name ?? 'Unassigned',
			due_label: 'No due date',
			destination_href: `/workspace/incidents/${incident.external_id}`
		}]),
		{ external_id: `${incident.external_id}-timeline-review`, title: 'Review the incident timeline', description: 'Confirm detection, mitigation, and recovery are recorded before this response is closed.', kind: 'Timeline review', phase: 'Documenting' },
		{ external_id: `${incident.external_id}-customer-review`, title: 'Review customer communication', description: 'Confirm the published updates accurately explain the impact and resolution.', kind: 'Customer review', phase: 'Reviewing' },
		{ external_id: `${incident.external_id}-follow-ups-review`, title: 'Review follow-up work', description: 'Capture the remaining work with a clear owner, due date, and destination.', kind: 'Follow-ups', phase: 'Reviewing', destination_href: `/workspace/incidents/follow-ups?selected=${encodeURIComponent(`${incident.external_id}-root-cause-follow-up`)}` }
	].map((task) => ({
		incident_id: incident.id,
		external_id: task.external_id,
		work_type: 'review_task',
		title: task.title,
		description: task.description,
		kind: task.kind,
		phase: task.phase,
		status: task.status ?? 'Open',
		owner_name: task.owner_name ?? incident.lead_name ?? 'Unassigned',
		due_label: task.due_label ?? 'No due date',
		destination_href: task.destination_href ?? null,
		created_by: userId,
		updated_by: userId
	})));
	if (!rows.length) return null;
	const { error: taskError } = await admin.from('incident_work_items').upsert(rows, { onConflict: 'incident_id,external_id', ignoreDuplicates: true });
	return taskError ?? null;
}

export const GET: RequestHandler = async ({ request }) => {
	try {
		const { admin, userId, tenant } = await getContext(request);
		if (!userId) return json({ ok: true, source: 'fixtures', items: [] });
		if (!tenant) return json({ ok: true, source: 'database', items: [] });
		const seedError = await seedDemoWorkItems(admin, tenant.id, userId);
		if (seedError) throw seedError;
		const flowError = await ensureResolvedFlowTasks(admin, tenant.id, userId);
		if (flowError) throw flowError;
		const { data: incidents, error: incidentError } = await admin.from('incidents').select('id, external_id, title, product_name:tenant_id').eq('tenant_id', tenant.id);
		if (incidentError) throw incidentError;
		const incidentIds = (incidents ?? []).map((incident) => incident.id as string);
		if (!incidentIds.length) return json({ ok: true, source: 'database', items: [] });
		const { data: items, error } = await admin.from('incident_work_items').select('id, incident_id, external_id, work_type, title, description, kind, phase, status, owner_name, due_label, destination_href').in('incident_id', incidentIds).order('created_at', { ascending: true });
		if (error) throw error;
		const incidentsById = new Map((incidents ?? []).map((incident) => [incident.id as string, incident]));
		return json({
			ok: true,
			source: 'database',
			items: (items ?? []).map((item) => {
				const incident = incidentsById.get(item.incident_id as string) as { external_id?: string; title?: string } | undefined;
				return { ...item, id: item.external_id, incidentId: incident?.external_id ?? '', incidentTitle: incident?.title ?? '' };
			})
		});
	} catch (error) {
		console.error('[incident-work-items] failed to load work items', error);
		return json({ ok: false, code: 'DB_ERROR', message: 'Unable to load Incident work right now.' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const { admin, userId, tenant } = await getContext(request);
		if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
		if (!tenant) return json({ ok: false, code: 'TENANT_NOT_FOUND' }, { status: 404 });
		const body = (await request.json()) as { id?: string; incidentId?: string; status?: string; owner?: string; due?: string };
		if (!body.id || !body.incidentId) return json({ ok: false, code: 'INVALID' }, { status: 422 });
		const { data: incident } = await admin.from('incidents').select('id').eq('tenant_id', tenant.id).eq('external_id', body.incidentId).maybeSingle();
		if (!incident) return json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
		const changes = {
			...(body.status ? { status: body.status } : {}),
			...(body.owner ? { owner_name: body.owner.trim().slice(0, 120) } : {}),
			...(body.due ? { due_label: body.due.trim().slice(0, 80) } : {}),
			updated_by: userId,
			updated_at: new Date().toISOString()
		};
		const { error } = await admin.from('incident_work_items').update(changes).eq('incident_id', incident.id).eq('external_id', body.id);
		if (error) throw error;
		return json({ ok: true });
	} catch (error) {
		console.error('[incident-work-items] failed to update work item', error);
		return json({ ok: false, code: 'DB_ERROR', message: 'Unable to save Incident work right now.' }, { status: 500 });
	}
};
