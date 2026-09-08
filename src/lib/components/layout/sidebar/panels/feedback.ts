import { MessageDots } from 'reicon-svelte';
import { feedback } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const feedbackPanel: PanelDef = {
	label: 'Feedback',
	icon: MessageDots,
	description: 'Customer requests, bugs, and praise',
	links: [
		{ label: 'All feedback', href: '/workspace/feedback' },
		{ label: 'New', href: '/workspace/feedback?status=New' },
		{ label: 'Reviewed', href: '/workspace/feedback?status=Reviewed' },
		{ label: 'Planned', href: '/workspace/feedback?status=Planned' }
	],
	recent: feedback.slice(0, 3).map((f) => ({ label: f.title, subtitle: `${f.productName} · ${f.type}`, href: f.workspacePath })),
	action: { label: 'Add feedback', href: '/feedback/new' }
};
