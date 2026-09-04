import { MessageDots } from 'reicon-svelte';
import { feedback } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const feedbackPanel: PanelDef = {
	label: 'Feedback',
	icon: MessageDots,
	description: 'Customer requests, bugs, and praise',
	links: [
		{ label: 'All feedback', href: '/workspace/feedback', badge: feedback.length },
		{ label: 'New', href: '/workspace/feedback', badge: feedback.filter((f) => f.status === 'New').length },
		{ label: 'Reviewed', href: '/workspace/feedback', badge: feedback.filter((f) => f.status === 'Reviewed').length },
		{ label: 'Planned', href: '/workspace/feedback', badge: feedback.filter((f) => f.status === 'Planned').length }
	],
	recent: feedback.slice(0, 3).map((f) => ({ label: f.title, subtitle: `${f.productName} · ${f.type}`, href: f.workspacePath })),
	action: { label: 'Add feedback', href: '/feedback/new' }
};
