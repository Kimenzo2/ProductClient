import { browser } from '$app/environment';
import { postIncidentTasks as seedTasks, type PostIncidentTask } from '$lib/data/workspace';
import { supabase } from '$lib/supabaseClient';

const STORAGE_KEY = 'productclient.post-incident-flow.preview.v1';
const statuses: PostIncidentTask['status'][] = ['Open', 'Done', 'Not doing'];
const phases: PostIncidentTask['phase'][] = ['Documenting', 'Reviewing'];
const kinds: PostIncidentTask['kind'][] = ['Timeline review', 'Customer review', 'Debrief', 'Follow-ups', 'Post-mortem decision'];

export type PostIncidentTaskEdit = Pick<PostIncidentTask, 'status' | 'owner' | 'due'>;

function cloneTasks(tasks: PostIncidentTask[]): PostIncidentTask[] {
	return tasks.map((task) => ({ ...task }));
}

function isTask(value: unknown): value is PostIncidentTask {
	if (!value || typeof value !== 'object') return false;
	const task = value as Partial<PostIncidentTask>;
	return Boolean(
		typeof task.id === 'string' &&
		typeof task.incidentId === 'string' &&
		typeof task.title === 'string' &&
		typeof task.description === 'string' &&
		typeof task.owner === 'string' &&
		typeof task.due === 'string' &&
		(typeof task.href === 'string' || task.href === undefined) &&
		statuses.includes(task.status as PostIncidentTask['status']) &&
		phases.includes(task.phase as PostIncidentTask['phase']) &&
		kinds.includes(task.kind as PostIncidentTask['kind'])
	);
}

export const postIncidentFlowPreview = $state({
	tasks: cloneTasks(seedTasks),
	hydrated: false,
	source: 'loading' as 'loading' | 'database' | 'preview',
	lastSavedAt: 0
});

function persist() {
	if (!browser) return;
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(postIncidentFlowPreview.tasks));
		postIncidentFlowPreview.lastSavedAt = Date.now();
	} catch {
		// Session storage is an enhancement for this preview. The in-memory edit remains usable.
	}
}

export async function hydratePostIncidentFlow(force = false) {
	if (!browser || (postIncidentFlowPreview.hydrated && !force)) return;
	try {
		if (supabase) {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (token) {
				const response = await fetch('/api/incidents/work-items', { headers: { authorization: `Bearer ${token}` } });
				const payload = (await response.json().catch(() => ({}))) as { items?: Array<Record<string, unknown>> };
				const tasks = (payload.items ?? []).filter((item) => item.work_type === 'review_task').map((item) => ({
					id: String(item.id),
					incidentId: String(item.incidentId ?? ''),
					title: String(item.title ?? ''),
					description: String(item.description ?? ''),
					owner: String(item.owner_name ?? 'Unassigned'),
					status: item.status as PostIncidentTask['status'],
					due: String(item.due_label ?? 'No due date'),
					phase: item.phase as PostIncidentTask['phase'],
					kind: item.kind as PostIncidentTask['kind'],
					href: typeof item.destination_href === 'string' ? item.destination_href : undefined
				}));
				if (response.ok && tasks.every(isTask)) {
					postIncidentFlowPreview.tasks = tasks;
					postIncidentFlowPreview.source = 'database';
					postIncidentFlowPreview.hydrated = true;
					return;
				}
			}
		}
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed: unknown = JSON.parse(stored);
			if (Array.isArray(parsed) && parsed.every(isTask)) {
				postIncidentFlowPreview.tasks = cloneTasks(parsed);
			}
		}
		postIncidentFlowPreview.source = 'preview';
	} catch {
		// A malformed preview falls back to the shipped fixtures.
		postIncidentFlowPreview.source = 'preview';
	} finally {
		postIncidentFlowPreview.hydrated = true;
	}
}

export function updatePostIncidentTask(id: string, changes: Partial<PostIncidentTaskEdit>): boolean {
	const task = postIncidentFlowPreview.tasks.find((item) => item.id === id);
	if (!task) return false;
	postIncidentFlowPreview.tasks = postIncidentFlowPreview.tasks.map((item) => (item.id === id ? { ...item, ...changes } : item));
	persist();
	void persistRemote(postIncidentFlowPreview.tasks.find((item) => item.id === id));
	return true;
}

async function persistRemote(task: PostIncidentTask | undefined) {
	if (!browser || !task || !supabase) return;
	try {
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (!token) return;
		await fetch('/api/incidents/work-items', {
			method: 'PATCH',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify({ id: task.id, incidentId: task.incidentId, status: task.status, owner: task.owner, due: task.due })
		});
	} catch {
		// The local preview remains responsive if the database is temporarily unavailable.
	}
}

export function resetPostIncidentFlow() {
	postIncidentFlowPreview.tasks = cloneTasks(seedTasks);
	postIncidentFlowPreview.source = 'preview';
	if (browser) {
		try {
			sessionStorage.removeItem(STORAGE_KEY);
		} catch {
			// The in-memory reset still succeeds when storage is unavailable.
		}
	}
	postIncidentFlowPreview.lastSavedAt = Date.now();
}

export function postIncidentTasksForIncident(incidentId: string): PostIncidentTask[] {
	return postIncidentFlowPreview.tasks.filter((task) => task.incidentId === incidentId);
}
