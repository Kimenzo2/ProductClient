import { makers, mockStates, preLaunchProducts, reviews, type MakerProfile, type MockState, type Review } from '$lib/data/mockStates';
import type { SearchRecord } from '$lib/search/types';

export type PublicProductRecord = {
	slug: string;
	name: string;
	avatar: string;
	verified: boolean;
	category?: string;
	tags?: string[];
	tagline?: string;
	website?: string;
	makerHandle: string;
	makerName: string;
	status: 'Live' | 'Beta';
	publicPath: string;
};

export type PublicReleaseRecord = {
	id: string;
	title: string;
	type: string;
	productSlug: string;
	productName: string;
	description: string;
	postedAt: string;
	reads: string;
	status: 'Live' | 'Resolved';
	publicPath: string;
};

export type PublicFeedbackRecord = {
	id: string;
	title: string;
	body: string;
	type: 'Request' | 'Bug' | 'Praise' | 'Testimonial';
	status: 'New' | 'Reviewed' | 'Planned' | 'Resolved';
	productSlug: string;
	productName: string;
	from: string;
	postedAt: string;
	publicPath: string;
};

export type PublicDocRecord = {
	slug: string;
	title: string;
	description: string;
	section: string;
	productSlug: string;
	productName: string;
	updatedAt: string;
	publicPath: string;
};

export type PublicIncidentRecord = {
	id: string;
	title: string;
	summary: string;
	status: 'Investigating' | 'Monitoring' | 'Resolved';
	severity: 'Critical' | 'High impact' | 'Medium impact';
	productSlug: string;
	productName: string;
	startedAt: string;
	resolvedAt?: string;
	publicPath: string;
};

export type PublicProofRecord = {
	id: string;
	quote: string;
	name: string;
	role: string;
	avatar: string;
	productSlug: string;
	productName: string;
	tags: string[];
};

export type PublicProductStory = {
	productSlug: string;
	title: string;
	outcome: string;
	updatedAt: string;
};

const publicProductSeeds = [...new Map(mockStates.map((state) => [state.product.slug, state.product])).values()];

export const publicProducts: PublicProductRecord[] = publicProductSeeds.map((product) => {
	const state = mockStates.find((item) => item.product.slug === product.slug);
	const maker = makers.find((item) => item.handle === state?.maker.handle);
	return {
		...product,
		makerHandle: state?.maker.handle ?? 'product-client',
		makerName: maker?.name ?? state?.maker.name ?? 'Product Client',
		status: product.slug === 'bento' ? 'Beta' : 'Live',
		publicPath: `/p/${product.slug}`
	};
});

export const publicReleases: PublicReleaseRecord[] = mockStates.map((state) => ({
	id: state.id,
	title: state.title,
	type: state.type,
	productSlug: state.product.slug,
	productName: state.product.name,
	description: state.description,
	postedAt: state.postedAt,
	reads: state.reads,
	status: state.type === 'incident' ? 'Resolved' : 'Live',
	publicPath: `/update/${state.id}`
}));

export const publicFeedback: PublicFeedbackRecord[] = [
	{ id: 'fb-1', title: 'Add a way to compare two releases', body: 'I want to understand what changed between the last two updates without opening several tabs.', type: 'Request', status: 'Reviewed', productSlug: 'linear', productName: 'Linear', from: 'Maya Okafor', postedAt: '18 min ago', publicPath: '/feedback/fb-1' },
	{ id: 'fb-2', title: 'Some people cannot sign in', body: 'Two people were sent back to the sign-in page after trying to log in.', type: 'Bug', status: 'New', productSlug: 'vercel', productName: 'Vercel', from: 'Daniel Kim', postedAt: '42 min ago', publicPath: '/feedback/fb-2' },
	{ id: 'fb-3', title: 'The new voice mode feels natural', body: 'The handoff between speaking and typing is finally quick enough for daily work.', type: 'Praise', status: 'Resolved', productSlug: 'chatgpt', productName: 'ChatGPT', from: 'Sarah Chen', postedAt: 'Yesterday', publicPath: '/feedback/fb-3' },
	{ id: 'fb-4', title: 'File uploads now fail less often', body: 'A customer approved this quote for use in a public customer story.', type: 'Testimonial', status: 'Planned', productSlug: 'supabase', productName: 'Supabase', from: 'Priya Sharma', postedAt: '2 days ago', publicPath: '/feedback/fb-4' }
];

export const publicDocs: PublicDocRecord[] = [
	{ slug: 'getting-started', title: 'Getting started', description: 'The fastest path from account creation to the first useful result.', section: 'Start here', productSlug: 'bento', productName: 'Bento', updatedAt: 'Today', publicPath: '/docs/bento/getting-started' },
	{ slug: 'release-notes', title: 'Release notes', description: 'A clear record of what shipped and why it matters.', section: 'Product updates', productSlug: 'bento', productName: 'Bento', updatedAt: 'Yesterday', publicPath: '/docs/bento/release-notes' },
	{ slug: 'api-reference', title: 'API guide', description: 'How developers connect their apps, send requests, and read answers.', section: 'Developer guide', productSlug: 'supabase', productName: 'Supabase', updatedAt: 'Aug 27', publicPath: '/docs/supabase/api-reference' },
	{ slug: 'status-and-incidents', title: 'Status and service problems', description: 'How we report product health and explain service problems.', section: 'Service guide', productSlug: 'vercel', productName: 'Vercel', updatedAt: 'Aug 26', publicPath: '/docs/vercel/status-and-incidents' },
	{ slug: 'feedback-loop', title: 'How feedback becomes a product update', description: 'How customer feedback becomes a choice, a release, and a follow-up.', section: 'Team guide', productSlug: 'linear', productName: 'Linear', updatedAt: 'Aug 22', publicPath: '/docs/linear/feedback-loop' }
];

export const publicIncidents: PublicIncidentRecord[] = [
	{ id: 'inc-1', title: 'Some requests were slow', summary: 'Requests were slower than usual in one region. Things are back to normal, and the team is reviewing what happened.', status: 'Resolved', severity: 'High impact', productSlug: 'vercel', productName: 'Vercel', startedAt: 'Yesterday, 08:14', resolvedAt: 'Yesterday, 10:02', publicPath: '/status/vercel' },
	{ id: 'inc-2', title: 'Some messages arrived late', summary: 'A backlog delayed updates for some teams.', status: 'Monitoring', severity: 'Medium impact', productSlug: 'stripe', productName: 'Stripe', startedAt: 'Today, 07:32', publicPath: '/status/stripe' },
	{ id: 'inc-3', title: 'Some people could not sign in', summary: 'New reports suggest a deployment problem. The team is investigating.', status: 'Investigating', severity: 'High impact', productSlug: 'vercel', productName: 'Vercel', startedAt: 'Today, 11:06', publicPath: '/status/vercel' }
];

export const publicProofs: PublicProofRecord[] = [
	{ id: 'proof-1', quote: 'The new product updates save me 30 minutes every day.', name: 'Julia Park', role: 'Product lead', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', productSlug: 'linear', productName: 'Linear', tags: ['Productivity', 'Teams'] },
	{ id: 'proof-2', quote: 'The new file uploads are exactly what our team needed.', name: 'Priya Sharma', role: 'Founder', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', productSlug: 'supabase', productName: 'Supabase', tags: ['File uploads', 'Technical teams'] },
	{ id: 'proof-4', quote: 'Keeping my work saved while I edit is a big improvement for large projects.', name: 'Alex Rivera', role: 'Staff engineer', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', productSlug: 'cursor', productName: 'Cursor', tags: ['Code', 'AI'] }
];

export const publicProductStories: PublicProductStory[] = [
	{ productSlug: 'linear', title: 'See what changed between releases', outcome: 'One product story that explains the change, the customer feedback behind it, and the help page in under two minutes.', updatedAt: '18 min ago' },
	{ productSlug: 'vercel', title: 'Explain past service problems', outcome: 'A clear history of service problems that links the public update, the fix, and the help page.', updatedAt: '46 min ago' }
];

export const publicMakers: MakerProfile[] = makers;
export const publicStates: MockState[] = mockStates;
export const publicReviews: Review[] = reviews;
export const publicPreLaunchProducts = preLaunchProducts;

export function publicProductBySlug(slug: string): PublicProductRecord | undefined {
	return publicProducts.find((product) => product.slug === slug);
}

export function buildPublicSearchRecords(): SearchRecord[] {
	return [
		...publicProducts.map((product) => ({
			id: product.slug,
			kind: 'Product' as const,
			title: product.name,
			subtitle: `${product.category ?? 'Product'} · ${product.makerName}`,
			description: product.tagline ?? 'Product profile and published updates',
			href: product.publicPath,
			publicHref: product.publicPath,
			status: product.status,
			keywords: [product.name, product.slug, product.category ?? '', ...(product.tags ?? []), product.makerName]
		})),
		...publicReleases.map((release) => ({
			id: release.id,
			kind: 'Release' as const,
			title: release.title,
			subtitle: `${release.productName} · ${release.type} · ${release.postedAt}`,
			description: release.description,
			href: release.publicPath,
			publicHref: release.publicPath,
			status: release.status,
			keywords: [release.title, release.description, release.productName, release.type]
		})),
		...publicFeedback.map((item) => ({
			id: item.id,
			kind: 'Feedback' as const,
			title: item.title,
			subtitle: `${item.productName} · ${item.type} · ${item.status}`,
			description: item.body,
			href: item.publicPath,
			publicHref: item.publicPath,
			status: item.status,
			keywords: [item.title, item.body, item.productName, item.type, item.status, item.from]
		})),
		...publicDocs.map((doc) => ({
			id: `${doc.productSlug}-${doc.slug}`,
			kind: 'Doc' as const,
			title: doc.title,
			subtitle: `${doc.productName} · ${doc.section} · ${doc.updatedAt}`,
			description: doc.description,
			href: doc.publicPath,
			publicHref: doc.publicPath,
			status: 'Published',
			keywords: [doc.title, doc.description, doc.productName, doc.section]
		})),
		...publicIncidents.map((incident) => ({
			id: incident.id,
			kind: 'Incident' as const,
			title: incident.title,
			subtitle: `${incident.productName} · ${incident.severity} · ${incident.status}`,
			description: incident.summary,
			href: incident.publicPath,
			publicHref: incident.publicPath,
			status: incident.status,
			keywords: [incident.title, incident.summary, incident.productName, incident.severity, incident.status]
		})),
		...publicProofs.map((proof) => ({
			id: proof.id,
			kind: 'Proof' as const,
			title: proof.quote,
			subtitle: `${proof.productName} · ${proof.name}`,
			description: proof.role,
			href: `/wall/${proof.productSlug}`,
			publicHref: `/wall/${proof.productSlug}`,
			status: 'Approved',
			keywords: [proof.quote, proof.name, proof.role, proof.productName, ...proof.tags]
		})),
		...publicMakers.map((maker) => ({
			id: maker.handle,
			kind: 'Maker' as const,
			title: maker.name,
			subtitle: `@${maker.handle} · ${maker.products} products`,
			description: maker.bio,
			href: `/m/${maker.handle}`,
			publicHref: `/m/${maker.handle}`,
			status: maker.verified ? 'Verified' : undefined,
			keywords: [maker.name, maker.handle, maker.bio]
		}))
	];
}
