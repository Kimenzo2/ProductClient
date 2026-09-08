import { QuoteUpSquare } from 'reicon-svelte';
import { proofs } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const proofPanel: PanelDef = {
	label: 'Proof',
	icon: QuoteUpSquare,
	description: 'Customer stories and social proof',
	links: [
		{ label: 'All stories', href: '/workspace/proof' },
		{ label: 'Approved', href: '/workspace/proof?status=Approved' },
		{ label: 'Needs review', href: '/workspace/proof?status=Needs+review' }
	],
	recent: proofs.slice(0, 3).map((p) => ({ label: p.quote.slice(0, 42) + '…', subtitle: `${p.name} · ${p.status}`, href: `/workspace/proof#${p.id}` })),
	action: { label: 'Add story', href: '/workspace/proof' }
};
