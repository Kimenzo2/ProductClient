import { browser } from '$app/environment';
import { hydrateFollowUps, followUpPreview } from '$lib/data/followUps.svelte';
import { hydratePostIncidentFlow, postIncidentFlowPreview } from '$lib/data/postIncidentFlow.svelte';
import { hydrateStatusEditor, incidentRecordsForWorkspace, statusEditorPreview } from '$lib/data/statusEditor.svelte';

/**
 * Shared attention signals for workspace navigation.
 *
 * A badge is deliberately published only from a live source. A missing
 * database binding or an unauthenticated preview must not look like pending
 * work, so those states resolve to zero instead of falling back to fixtures.
 */
export type SignalKey = 'inbox' | 'incidents' | 'postIncidentFlow' | 'followUps' | 'notifications';

// Keep each rune at the module top level. Svelte does not allow a rune call
// nested inside an object literal initializer.
const inboxCount = $derived(0);
const notificationCount = $derived(0);
const incidentCount = $derived.by(() =>
	statusEditorPreview.loadState === 'ready'
		? incidentRecordsForWorkspace().filter((incident) => incident.status !== 'Resolved').length
		: 0
);
const postIncidentFlowCount = $derived.by(() =>
	postIncidentFlowPreview.source === 'database'
		? postIncidentFlowPreview.tasks.filter((task) => task.status !== 'Done' && task.status !== 'Not doing').length
		: 0
);
const followUpCount = $derived.by(() =>
	followUpPreview.source === 'database'
		? followUpPreview.records.filter((followUp) => followUp.status !== 'Done').length
		: 0
);

export const signalRegistry = {
	inbox: { count: inboxCount },
	notifications: { count: notificationCount },
	incidents: { count: incidentCount },
	postIncidentFlow: { count: postIncidentFlowCount },
	followUps: { count: followUpCount }
};

export const signalRegistryState = $state({ loading: false, hydrated: false });

let hydrationPromise: Promise<void> | undefined;

/** Hydrate all live-backed indicators once for the application shell. */
export function hydrateSignalRegistry(): Promise<void> {
	if (!browser || signalRegistryState.hydrated) return Promise.resolve();
	if (hydrationPromise) return hydrationPromise;

	signalRegistryState.loading = true;
	hydrationPromise = Promise.all([hydrateStatusEditor(), hydrateFollowUps(), hydratePostIncidentFlow()])
		.then(() => undefined)
		.catch(() => undefined)
		.finally(() => {
			signalRegistryState.loading = false;
			signalRegistryState.hydrated = true;
		});

	return hydrationPromise;
}
