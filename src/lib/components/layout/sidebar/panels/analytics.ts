import { ChartBarTrendUp } from 'reicon-svelte';
import { searchGaps } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const analyticsPanel: PanelDef = {
	label: 'Analytics',
	icon: ChartBarTrendUp,
	description: 'See how people find your products, return to them, and respond to updates',
	links: [
		{ label: 'Overview', href: '/workspace/analytics' },
		{ label: 'Documentation', href: '/workspace/analytics/docs' },
		{ label: 'Feedback', href: '/workspace/analytics/feedback' },
		{ label: 'Roadmap', href: '/workspace/analytics/roadmap' },
		{ label: 'Incidents', href: '/workspace/analytics/incidents' },
		{ label: 'Status page', href: '/workspace/analytics/status' }
	],
	recent: searchGaps.slice(0, 3).map((g) => ({ label: g.query, subtitle: `${g.searches} searches · ${g.status}`, href: '/workspace/analytics' })),
	action: { label: 'View analytics', href: '/workspace/analytics' }
};
