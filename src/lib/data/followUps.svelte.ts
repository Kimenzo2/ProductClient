import { browser } from '$app/environment';
import { followUps as seedFollowUps, type FollowUpRecord } from '$lib/data/workspace';
import { supabase } from '$lib/supabaseClient';

const STORAGE_KEY = 'productclient.follow-ups.preview.v1';
const statuses: FollowUpRecord['status'][] = ['Open', 'In progress', 'Done'];
const kinds: FollowUpRecord['kind'][] = ['Help page', 'Product work', 'Customer update'];

export type FollowUpEdit = Pick<FollowUpRecord, 'status' | 'owner' | 'due'>;

function cloneRecords(records: FollowUpRecord[]): FollowUpRecord[] {
	return records.map((record) => ({ ...record }));
}

function isFollowUpRecord(value: unknown): value is FollowUpRecord {
	if (!value || typeof value !== 'object') return false;

	const record = value as Partial<FollowUpRecord>;
	return Boolean(
		typeof record.id === 'string' &&
		typeof record.incidentId === 'string' &&
		typeof record.title === 'string' &&
		typeof record.description === 'string' &&
		typeof record.owner === 'string' &&
		typeof record.due === 'string' &&
		typeof record.href === 'string' &&
		statuses.includes(record.status as FollowUpRecord['status']) &&
		kinds.includes(record.kind as FollowUpRecord['kind'])
	);
}

export const followUpPreview = $state({
	records: cloneRecords(seedFollowUps),
	hydrated: false,
	source: 'loading' as 'loading' | 'database' | 'preview',
	lastSavedAt: 0
});

function persist() {
	if (!browser) return;

	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(followUpPreview.records));
		followUpPreview.lastSavedAt = Date.now();
	} catch {
		// Session storage is an enhancement for this preview. The in-memory edit remains usable.
	}
}

export async function hydrateFollowUps(force = false) {
	if (!browser || (followUpPreview.hydrated && !force)) return;

	try {
		if (supabase) {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (token) {
				const response = await fetch('/api/incidents/work-items', { headers: { authorization: `Bearer ${token}` } });
				const payload = (await response.json().catch(() => ({}))) as { items?: Array<Record<string, unknown>> };
				const records = (payload.items ?? []).filter((item) => item.work_type === 'follow_up').map((item) => ({
					id: String(item.id),
					incidentId: String(item.incidentId ?? ''),
					title: String(item.title ?? ''),
					description: String(item.description ?? ''),
					owner: String(item.owner_name ?? 'Unassigned'),
					status: item.status as FollowUpRecord['status'],
					due: String(item.due_label ?? 'No due date'),
					kind: item.kind as FollowUpRecord['kind'],
					href: String(item.destination_href ?? '')
				}));
				if (response.ok && records.every(isFollowUpRecord)) {
					followUpPreview.records = records;
					followUpPreview.source = 'database';
					followUpPreview.hydrated = true;
					return;
				}
			}
		}
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed: unknown = JSON.parse(stored);
			if (Array.isArray(parsed) && parsed.every(isFollowUpRecord)) {
				followUpPreview.records = cloneRecords(parsed);
			}
		}
		followUpPreview.source = 'preview';
	} catch {
		// A malformed preview should fall back to the shipped fixtures.
		followUpPreview.source = 'preview';
	} finally {
		followUpPreview.hydrated = true;
	}
}

export function updateFollowUp(id: string, changes: Partial<FollowUpEdit>): boolean {
	const record = followUpPreview.records.find((item) => item.id === id);
	if (!record) return false;

	followUpPreview.records = followUpPreview.records.map((item) => (item.id === id ? { ...item, ...changes } : item));
	persist();
	void persistRemote(followUpPreview.records.find((item) => item.id === id));
	return true;
}

async function persistRemote(record: FollowUpRecord | undefined) {
	if (!browser || !record || !supabase) return;
	try {
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (!token) return;
		await fetch('/api/incidents/work-items', {
			method: 'PATCH',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify({ id: record.id, incidentId: record.incidentId, status: record.status, owner: record.owner, due: record.due })
		});
	} catch {
		// The local preview remains responsive if the database is temporarily unavailable.
	}
}

export function resetFollowUps() {
	followUpPreview.records = cloneRecords(seedFollowUps);
	followUpPreview.source = 'preview';
	if (browser) {
		try {
			sessionStorage.removeItem(STORAGE_KEY);
		} catch {
			// The in-memory reset still succeeds when storage is unavailable.
		}
	}
	followUpPreview.lastSavedAt = Date.now();
}

export function followUpsForIncident(incidentId: string): FollowUpRecord[] {
	return followUpPreview.records.filter((followUp) => followUp.incidentId === incidentId);
}
