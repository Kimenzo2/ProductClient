import { browser } from '$app/environment';
import { postIncidentTasks as seedTasks, type PostIncidentTask } from '$lib/data/workspace';

const STORAGE_KEY = 'productclient.post-incident-flow.preview.v1';
const statuses: PostIncidentTask['status'][] = ['Open', 'In progress', 'Done'];
const kinds: PostIncidentTask['kind'][] = ['Timeline review', 'Customer review', 'Debrief', 'Post-mortem decision'];

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
		kinds.includes(task.kind as PostIncidentTask['kind'])
	);
}

export const postIncidentFlowPreview = $state({
	tasks: cloneTasks(seedTasks),
	hydrated: false,
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

export function hydratePostIncidentFlow() {
	if (!browser || postIncidentFlowPreview.hydrated) return;
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed: unknown = JSON.parse(stored);
			if (Array.isArray(parsed) && parsed.every(isTask)) {
				postIncidentFlowPreview.tasks = cloneTasks(parsed);
			}
		}
	} catch {
		// A malformed preview falls back to the shipped fixtures.
	} finally {
		postIncidentFlowPreview.hydrated = true;
	}
}

export function updatePostIncidentTask(id: string, changes: Partial<PostIncidentTaskEdit>): boolean {
	const task = postIncidentFlowPreview.tasks.find((item) => item.id === id);
	if (!task) return false;
	postIncidentFlowPreview.tasks = postIncidentFlowPreview.tasks.map((item) => (item.id === id ? { ...item, ...changes } : item));
	persist();
	return true;
}

export function resetPostIncidentFlow() {
	postIncidentFlowPreview.tasks = cloneTasks(seedTasks);
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
