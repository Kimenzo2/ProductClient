import { Headset } from 'reicon-svelte';
import type { PanelDef } from '../types';

export const agentPanel: PanelDef = {
	label: 'Agent',
	icon: Headset,
	description: 'Answer visitors from this product\u2019s own pages',
	links: [
		{ label: 'Overview', href: '/workspace/agent' },
		{ label: 'Tools', href: '/workspace/agent?tab=tools' },
		{ label: 'Conversations', href: '/workspace/inbox' },
		{ label: 'Misses', href: '/workspace/agent?tab=misses' }
	],
	recent: [],
	action: { label: 'Open inbox', href: '/workspace/inbox' }
};
