import { browser } from '$app/environment';
import { statusPageForProduct, type StatusIncident, type StatusIncidentUpdate } from '$lib/data/status';
import { incidents as workspaceIncidents } from '$lib/data/workspace';
import { getMyTenant, tenantStatusUrl } from '$lib/tenant';
import { supabase } from '$lib/supabaseClient';

/**
 * This is the deliberately small bridge between ProductClient and the public
 * Status Page kit. Keep these values aligned with src/lib/config/models.ts in
 * the separate Status Page repository.
 */
export type PublicStatusState = 'operational' | 'degraded' | 'outage' | 'unknown';
export type PublicIncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

const incidentStatusRank: Record<PublicIncidentStatus, number> = {
	investigating: 1,
	identified: 2,
	monitoring: 3,
	resolved: 4
};

export type PublicIncidentUpdate = {
	id: string;
	status: PublicIncidentStatus;
	publishedAt: string;
	message: string;
};

export type PublicIncident = {
	id: string;
	title: string;
	summary: string;
	leadName?: string;
	status: PublicIncidentStatus;
	startedAt: string;
	resolvedAt?: string;
	affectedServices: string[];
	updates: PublicIncidentUpdate[];
	mode?: 'Active' | 'Retrospective' | 'Test';
	severity?: 'Critical' | 'High impact' | 'Medium impact';
	coordinationChannel?: string;
};

export type StatusEditorService = {
	id: string;
	name: string;
	description: string;
	status: PublicStatusState;
	uptime: string;
};

export type StatusEditorPage = {
	productSlug: string;
	pageTitle: string;
	pageDescription: string;
	services: StatusEditorService[];
	incidents: PublicIncident[];
};

export type StartPublicIncidentInput = {
	title: string;
	summary: string;
	leadName: string;
	status: Extract<PublicIncidentStatus, 'investigating' | 'identified'>;
	impact: Extract<PublicStatusState, 'degraded' | 'outage'>;
	startedAt: string;
	message: string;
	affectedServices: string[];
	mode?: PublicIncident['mode'];
	severity?: PublicIncident['severity'];
	coordinationChannel?: string;
};

export type AddStatusServiceInput = {
	name: string;
	description: string;
	status?: PublicStatusState;
	uptime?: string;
};

export type AddIncidentUpdateInput = {
	status: PublicIncidentStatus;
	publishedAt: string;
	message: string;
};

export type StatusEditorLoadState = 'loading' | 'ready' | 'fallback';
export type StatusEditorSaveState = 'idle' | 'saving' | 'saved' | 'local' | 'error';
export type StatusEditorSaveResult = {
	ok: boolean;
	localOnly?: boolean;
	edgeSynced?: boolean;
	message?: string;
};

const STORAGE_KEY_PREFIX = 'productclient.status-editor.preview.v2';

const statusMap: Record<string, PublicStatusState> = {
	Operational: 'operational',
	Degraded: 'degraded',
	Outage: 'outage',
	Maintenance: 'degraded'
};

const incidentStatusMap: Record<string, PublicIncidentStatus> = {
	Investigating: 'investigating',
	Identified: 'identified',
	Monitoring: 'monitoring',
	Resolved: 'resolved'
};

function clonePage(page: StatusEditorPage): StatusEditorPage {
	return {
		...page,
		services: page.services.map((service) => ({ ...service })),
		incidents: page.incidents.map((incident) => ({
			...incident,
			affectedServices: [...incident.affectedServices],
			updates: incident.updates.map((update) => ({ ...update }))
		}))
	};
}

function displayTimestamp(value: string, fallback: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value || fallback;
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short'
	}).format(date).replace(/, (?=\d)/, ' at ');
}

function workspaceStatus(status: PublicIncidentStatus): StatusIncident['status'] {
	return status === 'identified' ? 'Identified' : status === 'monitoring' ? 'Monitoring' : status === 'resolved' ? 'Resolved' : 'Investigating';
}

function incidentSeverity(incident: PublicIncident, serviceIds: string[]): StatusIncident['severity'] {
	const services = statusEditorPreview.page.services.filter((service) => serviceIds.includes(service.id));
	if (services.some((service) => service.status === 'outage')) return 'High impact';
	if (services.some((service) => service.status === 'degraded')) return 'Medium impact';
	return workspaceIncidents.find((record) => record.id === incident.id)?.severity ?? 'Medium impact';
}


function createSeedPage(slug = 'mossbit', tenantName = 'Example Company'): StatusEditorPage {
	const seedConfig = statusPageForProduct(slug);
	return {
		productSlug: seedConfig.productSlug,
		pageTitle: `${tenantName || slug} status`,
		pageDescription: seedConfig.pageDescription,
		services: seedConfig.components.map((component) => ({
			id: component.id,
			name: component.name,
			description: component.description,
			status: statusMap[component.status] ?? 'unknown',
			uptime: component.uptime
		})),
		incidents: seedConfig.incidents.map((incident) => {
			const lastUpdate = incident.updates.at(-1);
			return {
				id: incident.id,
				title: incident.title,
				summary: incident.summary,
				leadName: incident.owner,
				status: lastUpdate ? incidentStatusMap[lastUpdate.status] ?? 'investigating' : 'investigating',
				startedAt: incident.startedAt,
				...(incident.resolvedAt ? { resolvedAt: incident.resolvedAt } : {}),
				affectedServices: [...incident.affectedComponentIds],
				updates: incident.updates.map((update) => ({
					id: update.id,
					status: incidentStatusMap[update.status] ?? 'investigating',
					publishedAt: update.timestamp,
					message: update.message
				}))
			};
		})
	};
}

function isPublicIncidentStatus(value: unknown): value is PublicIncidentStatus {
	return value === 'investigating' || value === 'identified' || value === 'monitoring' || value === 'resolved';
}

function isPublicStatusState(value: unknown): value is PublicStatusState {
	return value === 'operational' || value === 'degraded' || value === 'outage' || value === 'unknown';
}

function isStoredPage(value: unknown): value is StatusEditorPage {
	if (!value || typeof value !== 'object') return false;
	const page = value as Partial<StatusEditorPage>;
	if (typeof page.productSlug !== 'string' || typeof page.pageTitle !== 'string' || typeof page.pageDescription !== 'string' || !Array.isArray(page.services) || !Array.isArray(page.incidents)) return false;

	const servicesValid = page.services.every((service) => {
		if (!service || typeof service !== 'object') return false;
		const candidate = service as Partial<StatusEditorService>;
		return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.description === 'string' && typeof candidate.uptime === 'string' && isPublicStatusState(candidate.status);
	});

	const incidentsValid = page.incidents.every((incident) => {
		if (!incident || typeof incident !== 'object') return false;
		const candidate = incident as Partial<PublicIncident>;
		return typeof candidate.id === 'string' && typeof candidate.title === 'string' && typeof candidate.summary === 'string' && typeof candidate.startedAt === 'string' && isPublicIncidentStatus(candidate.status) && Array.isArray(candidate.affectedServices) && Array.isArray(candidate.updates);
	});

	return servicesValid && incidentsValid;
}

export const statusEditorPreview = $state({
	page: createSeedPage(),
	hydrated: false,
	loadState: 'loading' as StatusEditorLoadState,
	loadError: '',
	saveState: 'idle' as StatusEditorSaveState,
	saveError: '',
	lastSavedAt: 0,
	lastPublishedAt: '',
	edgeSynced: true
});

/**
 * Internal Incident surfaces read this projection instead of a second fixture.
 * The editor remains the source of truth for the customer-facing incident, while
 * workspace-only fields fall back to the original incident record when present.
 */
export function incidentRecordsForWorkspace(): StatusIncident[] {
	const page = statusEditorPreview.page;
	const productName = page.pageTitle.replace(/\s+status$/i, '');
	return page.incidents.map((incident) => {
		const original = workspaceIncidents.find((record) => record.id === incident.id);
		return {
			id: incident.id,
			title: incident.title,
			summary: incident.summary,
			status: workspaceStatus(incident.status),
			severity: original?.severity ?? incidentSeverity(incident, incident.affectedServices),
			productSlug: page.productSlug,
			productName: original?.productName ?? productName,
			startedAt: displayTimestamp(incident.startedAt, original?.startedAt ?? 'Unknown'),
			...(incident.resolvedAt ? { resolvedAt: displayTimestamp(incident.resolvedAt, incident.resolvedAt) } : {}),
			owner: incident.leadName?.trim() || original?.owner || 'Unassigned',
			publicPath: original?.publicPath ?? tenantStatusUrl(page.productSlug),
			workspacePath: `/workspace/incidents/${incident.id}`,
			affectedComponentIds: [...incident.affectedServices],
			updates: incident.updates.map((update): StatusIncidentUpdate => ({
				id: update.id,
				status: update.status === 'investigating' ? 'Investigating' : update.status === 'identified' ? 'Identified' : update.status === 'monitoring' ? 'Monitoring' : 'Resolved',
				timestamp: displayTimestamp(update.publishedAt, update.publishedAt),
				message: update.message
			}))
		};
	});
}

type StoredPreview = { page: StatusEditorPage; savedAt: number };

let storageKey = `${STORAGE_KEY_PREFIX}.guest.mossbit`;
// Enterprise: Click Publish is the only source of truth — no debounced auto-save.
// Draft lives in memory + sessionStorage until the user clicks Publish (single transaction).
let publishedSnapshot: StatusEditorPage | null = null;
let publishInFlight = false;

function getStorageKey(userId: string | undefined, slug: string) {
	return `${STORAGE_KEY_PREFIX}.${userId ?? 'guest'}.${slug || 'default'}`;
}

function readStoredPreview(): StoredPreview | null {
	if (!browser) return null;
	try {
		const parsed: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
		if (!parsed || typeof parsed !== 'object') return null;
		const candidate = parsed as { page?: unknown; savedAt?: unknown };
		if (!isStoredPage(candidate.page) || typeof candidate.savedAt !== 'number') return null;
		return { page: clonePage(candidate.page), savedAt: candidate.savedAt };
	} catch {
		return null;
	}
}

function setSaveState(result: StatusEditorSaveResult) {
	if (result.ok) {
		statusEditorPreview.saveState = result.localOnly ? 'local' : 'saved';
		statusEditorPreview.saveError = result.message ?? '';
		statusEditorPreview.edgeSynced = result.edgeSynced !== false;
	} else {
		statusEditorPreview.saveState = 'error';
		statusEditorPreview.saveError = result.message ?? 'Unable to publish changes.';
	}
}

async function writeRemote(snapshot: StatusEditorPage): Promise<StatusEditorSaveResult> {
	if (!browser || !supabase) return { ok: true, localOnly: true, message: 'Saved in this browser only.' };
	try {
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (!token) return { ok: false, message: 'Sign in to publish changes to the hosted Status Page.' };
		const response = await fetch('/api/status/editor', {
			method: 'PUT',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify(snapshot)
		});
		const payload = (await response.json().catch(() => ({}))) as { message?: string; edgeSynced?: boolean };
		if (!response.ok) return { ok: false, message: payload.message ?? 'Unable to publish changes. Try again.' };
		return {
			ok: true,
			edgeSynced: payload.edgeSynced !== false,
			message: payload.edgeSynced === false ? 'Saved to the workspace; the hosted page is still syncing.' : 'Published to the hosted Status Page.'
		};
	} catch {
		return { ok: false, message: 'Unable to reach the publishing service. Check your connection and try again.' };
	}
}

function persistLocal() {
	if (!browser) return;
	try {
		sessionStorage.setItem(storageKey, JSON.stringify({ page: statusEditorPreview.page, savedAt: Date.now() } satisfies StoredPreview));
		statusEditorPreview.lastSavedAt = Date.now();
	} catch {
		// The in-memory preview remains useful if storage is unavailable.
	}
}

export function isStatusEditorDirty(): boolean {
	if (!publishedSnapshot) return false;
	try {
		return JSON.stringify(statusEditorPreview.page) !== JSON.stringify(publishedSnapshot);
	} catch {
		return true;
	}
}

export async function hydrateStatusEditor() {
	if (!browser || statusEditorPreview.hydrated) return;

	let loadedRemote = false;
	let remotePublishedAt = 0;
	try {
		if (supabase) {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			const tenant = await getMyTenant();
			storageKey = getStorageKey(data.session?.user.id, tenant?.slug ?? 'mossbit');
			if (!token) statusEditorPreview.saveState = 'local';
			if (token) {
				const response = await fetch('/api/status/editor', { headers: { authorization: `Bearer ${token}` } });
				const payload = (await response.json()) as { page?: unknown; publishedAt?: string; message?: string };
				if (response.ok && isStoredPage(payload.page)) {
					statusEditorPreview.page = clonePage(payload.page);
					publishedSnapshot = clonePage(payload.page as StatusEditorPage);
					remotePublishedAt = payload.publishedAt ? Date.parse(payload.publishedAt) : 0;
					loadedRemote = true;
				} else if (!response.ok) {
					statusEditorPreview.loadError = payload.message ?? 'Unable to load the saved Status Page.';
				}
				if (!loadedRemote && tenant) {
					const seeded = createSeedPage(tenant.slug, tenant.name);
					statusEditorPreview.page = seeded;
					publishedSnapshot = clonePage(seeded);
				} else if (!loadedRemote && !tenant) {
					publishedSnapshot = clonePage(statusEditorPreview.page);
				}
			} else if (tenant) {
				const seeded = createSeedPage(tenant.slug, tenant.name);
				statusEditorPreview.page = seeded;
				publishedSnapshot = clonePage(seeded);
			} else {
				publishedSnapshot = clonePage(statusEditorPreview.page);
			}
		}
		const stored = readStoredPreview();
		if (stored && (!loadedRemote || stored.savedAt > remotePublishedAt)) {
			statusEditorPreview.page = stored.page;
			// Do NOT auto-publish — draft stays local until explicit Publish click
		} else if (loadedRemote) {
			// Ensure snapshot matches what we hydrated from server
			publishedSnapshot = clonePage(statusEditorPreview.page);
		}
		statusEditorPreview.loadState = loadedRemote ? 'ready' : 'fallback';
	} catch {
		statusEditorPreview.loadState = 'fallback';
		statusEditorPreview.loadError = 'Unable to load the saved Status Page. You are editing a local preview.';
		if (!publishedSnapshot) publishedSnapshot = clonePage(statusEditorPreview.page);
	} finally {
		statusEditorPreview.hydrated = true;
	}
}

export async function saveStatusEditor(): Promise<StatusEditorSaveResult> {
	// Enterprise guard: single Publish click at a time — no debounce queue
	if (publishInFlight) return { ok: false, message: 'Publishing in progress…' };
	publishInFlight = true;
	statusEditorPreview.saveState = 'saving';
	statusEditorPreview.saveError = '';
	try {
		const snapshot = clonePage(statusEditorPreview.page);
		const result = await writeRemote(snapshot);
		if (result.ok) {
			publishedSnapshot = clonePage(snapshot);
			try {
				sessionStorage.removeItem(storageKey);
			} catch {}
			statusEditorPreview.lastPublishedAt = new Date().toISOString();
			statusEditorPreview.edgeSynced = result.edgeSynced !== false;
		}
		setSaveState(result);
		return result;
	} finally {
		publishInFlight = false;
	}
}

export function updateServiceStatus(id: string, status: PublicStatusState): boolean {
	if (!statusEditorPreview.page.services.some((service) => service.id === id)) return false;
	statusEditorPreview.page.services = statusEditorPreview.page.services.map((service) => (service.id === id ? { ...service, status } : service));
	persistLocal();
	return true;
}

export function addStatusService(input: AddStatusServiceInput): string | null {
	const name = input.name.trim();
	const description = input.description.trim();
	if (!name || !description) return null;

	const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'service';
	let id = baseId;
	let suffix = 2;
	while (statusEditorPreview.page.services.some((service) => service.id === id)) id = `${baseId}-${suffix++}`;

	statusEditorPreview.page.services = [
		...statusEditorPreview.page.services,
		{ id, name, description, status: input.status ?? 'operational', uptime: input.uptime ?? '100.00%' }
	];
	persistLocal();
	return id;
}

export function updateStatusPageDetails(pageTitle: string, pageDescription: string): boolean {
	const title = pageTitle.trim();
	const description = pageDescription.trim();
	if (!title || !description) return false;
	statusEditorPreview.page = { ...statusEditorPreview.page, pageTitle: title, pageDescription: description };
	persistLocal();
	return true;
}

export function startPublicIncident(input: StartPublicIncidentInput): string | null {
	const parsedStartedAt = new Date(input.startedAt);
	if (Number.isNaN(parsedStartedAt.getTime()) || !input.title.trim() || !input.summary.trim() || !input.message.trim()) return null;
	const id = `status-incident-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(36)}`;
	const startedAt = parsedStartedAt.toISOString();
	const incident: PublicIncident = {
		id,
		title: input.title.trim(),
		summary: input.summary.trim(),
		leadName: input.leadName.trim() || 'Unassigned',
		status: input.status,
		startedAt,
		affectedServices: [...input.affectedServices],
		...(input.mode ? { mode: input.mode } : {}),
		...(input.severity ? { severity: input.severity } : {}),
		...(input.coordinationChannel?.trim() ? { coordinationChannel: input.coordinationChannel.trim() } : {}),
		updates: [{
			id: `${id}-update-1`,
			status: input.status,
			publishedAt: startedAt,
			message: input.message.trim()
		}]
	};

	statusEditorPreview.page.incidents = [incident, ...statusEditorPreview.page.incidents];
	statusEditorPreview.page.services = statusEditorPreview.page.services.map((service) => input.affectedServices.includes(service.id) ? { ...service, status: input.impact } : service);
	persistLocal();
	return id;
}

export function appendIncidentUpdate(incidentId: string, input: AddIncidentUpdateInput): boolean {
	const message = input.message.trim();
	const publishedAt = new Date(input.publishedAt);
	const incident = statusEditorPreview.page.incidents.find((record) => record.id === incidentId);
	if (!incident || !message || Number.isNaN(publishedAt.getTime())) return false;
	if (incidentStatusRank[input.status] < incidentStatusRank[incident.status]) {
		console.warn('[status-editor][status-integrity] blocked backward incident transition', {
			incidentId,
			from: incident.status,
			to: input.status
		});
		return false;
	}

	const timestamp = publishedAt.toISOString();
	incident.updates = [
		...incident.updates,
		{ id: `${incidentId}-update-${incident.updates.length + 1}`, status: input.status, publishedAt: timestamp, message }
	];
	incident.status = input.status;
	if (input.status === 'resolved') incident.resolvedAt = timestamp;
	else delete incident.resolvedAt;
	persistLocal();
	return true;
}

export function resetStatusEditor() {
	statusEditorPreview.page = createSeedPage();
	publishedSnapshot = clonePage(statusEditorPreview.page);
	statusEditorPreview.lastSavedAt = Date.now();
	if (!browser) return;
	try {
		sessionStorage.removeItem(storageKey);
	} catch {
		// The in-memory reset still succeeds when storage is unavailable.
	}
}
