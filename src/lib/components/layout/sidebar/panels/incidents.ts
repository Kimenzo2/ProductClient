import { AlertTriangle, Edit, History } from 'reicon-svelte';
import type { PanelDef } from '../types';

export const incidentsPanel: PanelDef = {
	label: 'Incidents',
	icon: AlertTriangle,
	description: 'Track, respond, and learn from service problems',
	links: [
		{ label: 'Incidents', href: '/workspace/incidents', icon: AlertTriangle },
		{ label: 'Post-incident flow', href: '/workspace/incidents/post-incident-flow', icon: History, signalKey: 'postIncidentFlow' },
		{ label: 'Follow-ups', href: '/workspace/incidents/follow-ups', icon: History, signalKey: 'followUps' },
		{ label: 'Status editor', href: '/workspace/status', icon: Edit }
	],
	recent: []
};
