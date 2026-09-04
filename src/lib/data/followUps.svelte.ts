import { browser } from '$app/environment';
import { followUps as seedFollowUps, type FollowUpRecord } from '$lib/data/workspace';

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

export function hydrateFollowUps() {
	if (!browser || followUpPreview.hydrated) return;

	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed: unknown = JSON.parse(stored);
			if (Array.isArray(parsed) && parsed.every(isFollowUpRecord)) {
				followUpPreview.records = cloneRecords(parsed);
			}
		}
	} catch {
		// A malformed preview should fall back to the shipped fixtures.
	} finally {
		followUpPreview.hydrated = true;
	}
}

export function updateFollowUp(id: string, changes: Partial<FollowUpEdit>): boolean {
	const record = followUpPreview.records.find((item) => item.id === id);
	if (!record) return false;

	followUpPreview.records = followUpPreview.records.map((item) => (item.id === id ? { ...item, ...changes } : item));
	persist();
	return true;
}

export function resetFollowUps() {
	followUpPreview.records = cloneRecords(seedFollowUps);
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
