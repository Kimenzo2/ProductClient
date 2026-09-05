import { AlertTriangle, History } from 'reicon-svelte';
import { hostedStatusPage } from '$lib/config/tenant';
import { followUps, incidents, postIncidentTasks } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const incidentsPanel: PanelDef = {
	label: 'Incidents',
	icon: AlertTriangle,
	description: 'Track, respond, and learn from service problems',
	links: [
		{ label: 'Incidents', href: '/workspace/incidents', icon: AlertTriangle, badge: incidents.length },
		{ label: 'Post-incident flow', href: '/workspace/incidents/post-incident-flow', icon: History, badge: postIncidentTasks.filter((item) => item.status !== 'Done').length },
		{ label: 'Follow-ups', href: '/workspace/incidents/follow-ups', icon: History, badge: followUps.filter((item) => item.status !== 'Done').length },
		{ label: 'Declare incident', href: '/workspace/incidents/new', icon: AlertTriangle },
		{ label: 'Status page', href: hostedStatusPage.href, icon: History, external: true }
	],
	recent: [],
	action: { label: 'Report a problem', href: '/workspace/incidents/new' }
};
