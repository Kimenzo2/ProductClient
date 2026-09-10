import { Box } from 'reicon-svelte';
import { products } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const productsPanel: PanelDef = {
	label: 'Products',
	icon: Box,
	description: 'Public pages and workspace for each product',
	links: [
		{ label: 'All products', href: '/workspace/products' },
		{ label: 'Live', href: '/workspace/products?status=Live' },
		{ label: 'Beta', href: '/workspace/products?status=Beta' },
		{ label: 'Roadmap', href: '/workspace/roadmap' }
	],
	recent: products.slice(0, 4).map((p) => ({ label: p.name, subtitle: `${p.makerName} · ${p.category ?? 'Product'}`, href: p.workspacePath })),
	action: { label: 'Add product', href: '/submit' }
};
