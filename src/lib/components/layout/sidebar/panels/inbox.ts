import { Inbox } from 'reicon-svelte';
import { feedback } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const inboxPanel: PanelDef = {
	label: 'Inbox',
	icon: Inbox,
	description: 'Triage incoming items',
	links: [
		{ label: 'Inbox', href: '/workspace/inbox', badge: 6 },
		{ label: 'Feedback', href: '/workspace/feedback' },
		{ label: 'Incidents', href: '/workspace/incidents' }
	],
	recent: feedback.slice(0, 3).map((f) => ({ label: f.title, subtitle: f.productName, href: f.workspacePath })),
	action: { label: 'Open inbox', href: '/workspace/inbox' }
};
