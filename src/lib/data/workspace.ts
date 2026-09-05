import { makers, mockStates, preLaunchProducts, reviews } from '$lib/data/mockStates';
import { hostedDocsPage, hostedStatusPage } from '$lib/config/tenant';
import type { SearchKind, SearchRecord } from '$lib/search/types';

export type LifecycleStatus = 'Live' | 'Beta' | 'Planned' | 'Resolved' | 'In progress' | 'Draft';

export type ProductRecord = {
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
	status: LifecycleStatus;
	publicPath: string;
	workspacePath: string;
};

export type ReleaseRecord = {
	id: string;
	title: string;
	type: string;
	productSlug: string;
	productName: string;
	productAvatar: string;
	makerHandle: string;
	makerName: string;
	description: string;
	postedAt: string;
	reads: string;
	status: LifecycleStatus;
	publicPath: string;
	workspacePath: string;
};

export type FeedbackRecord = {
	id: string;
	title: string;
	body: string;
	type: 'Request' | 'Bug' | 'Praise' | 'Testimonial';
	status: 'New' | 'Reviewed' | 'Planned' | 'Resolved';
	productSlug: string;
	productName: string;
	from: string;
	postedAt: string;
	priority: 'Low' | 'Medium' | 'High';
	publicPath: string;
	workspacePath: string;
};

export type RoadmapRecord = {
	id: string;
	title: string;
	description: string;
	status: 'Now' | 'Next' | 'Later' | 'Shipped';
	productSlug: string;
	productName: string;
	feedbackCount: number;
	owner: string;
	area?: string;
	confidence?: 'High' | 'Medium' | 'Low';
	audience?: 'Internal' | 'Customer preview';
	targetWindow?: string;
	deliveryStatus?: 'Exploring' | 'Planned' | 'In progress' | 'Ready to share' | 'Shipped';
};

export type ProblemRecord = {
	id: string;
	title: string;
	statement: string;
	affectedAudience: string;
	productArea: string;
	workaround: string;
	costOfInaction: string;
	status: 'Needs context' | 'Ready for decision' | 'Planned' | 'Resolved';
	productSlug: string;
	productName: string;
	owner: string;
	updatedAt: string;
	feedbackIds: string[];
	incidentIds?: string[];
	docSlugs?: string[];
	decisionId?: string;
	workspacePath: string;
};

export type DocRecord = {
	slug: string;
	title: string;
	description: string;
	section: string;
	productSlug: string;
	productName: string;
	updatedAt: string;
	publicPath: string;
	workspacePath: string;
};

export type IncidentRecord = {
	id: string;
	title: string;
	summary: string;
	status: 'Investigating' | 'Monitoring' | 'Resolved';
	severity: 'Critical' | 'High impact' | 'Medium impact';
	productSlug: string;
	productName: string;
	startedAt: string;
	resolvedAt?: string;
	owner: string;
	publicPath: string;
	workspacePath: string;
};

export type ProofRecord = {
	id: string;
	quote: string;
	name: string;
	role: string;
	avatar: string;
	source: 'Review' | 'Customer call' | 'Imported';
	status: 'Approved' | 'Needs review' | 'Archived';
	productSlug: string;
	productName: string;
	tags: string[];
	consent?: 'Confirmed' | 'Needs confirmation';
	allowedUses?: string[];
	featured?: boolean;
	outcome?: string;
};

export type ThreadRelation = {
	kind: SearchKind;
	title: string;
	detail: string;
	href: string;
	status?: string;
};

export type DecisionOption = {
	id: string;
	label: string;
	summary: string;
	tradeoff: string;
	impact: 'High' | 'Medium' | 'Low';
	effort: 'High' | 'Medium' | 'Low';
	risk: 'High' | 'Medium' | 'Low';
	chosen?: boolean;
};

export type DecisionThread = {
	id: string;
	title: string;
	problem: string;
	outcome: string;
	productSlug: string;
	productName: string;
	owner: string;
	updatedAt: string;
	status: 'In decision' | 'Planned' | 'Shipped';
	confidence: 'High' | 'Medium' | 'Low';
	visibility: 'Internal' | 'Public preview';
	feedbackCount?: number;
	relations: ThreadRelation[];
	problemId?: string;
	goal?: string;
	affectedAudience?: string;
	workaround?: string;
	costOfInaction?: string;
	reviewDate?: string;
	assumptions?: string[];
	dissent?: string;
	options?: DecisionOption[];
	decisionLog?: Array<{ label: string; detail: string; date: string }>;
};

export type FollowUpRecord = {
	id: string;
	incidentId: string;
	title: string;
	description: string;
	owner: string;
	status: 'Open' | 'In progress' | 'Done';
	due: string;
	kind: 'Help page' | 'Product work' | 'Customer update';
	href: string;
};

export type PostIncidentTask = {
	id: string;
	incidentId: string;
	title: string;
	description: string;
	owner: string;
	status: 'Open' | 'Done' | 'Not doing';
	due: string;
	phase: 'Documenting' | 'Reviewing';
	kind: 'Timeline review' | 'Customer review' | 'Debrief' | 'Follow-ups' | 'Post-mortem decision';
	href?: string;
};

export type SearchGapRecord = {
	id: string;
	query: string;
	searches: number;
	lastSeen: string;
	status: 'Needs help' | 'In progress' | 'Answered';
	owner: string;
	productSlug?: string;
	productName?: string;
	linkedDocSlug?: string;
};

export type DocFeedbackRecord = {
	id: string;
	docSlug: string;
	productSlug: string;
	comment: string;
	helpful: boolean;
	status: 'New' | 'Reviewed' | 'Fixed';
	postedAt: string;
	linkedProblemId?: string;
};

function numericReads(reads: string): number {
	if (reads.includes('M')) return parseFloat(reads) * 1_000_000;
	if (reads.includes('K')) return parseFloat(reads) * 1_000;
	return parseInt(reads, 10) || 0;
}

function formatReads(reads: number): string {
	if (reads >= 1_000_000) return `${(reads / 1_000_000).toFixed(1)}M`;
	if (reads >= 1_000) return `${(reads / 1_000).toFixed(1)}K`;
	return String(reads);
}

const productSeeds = [...new Map(mockStates.map((state) => [state.product.slug, state.product])).values()];

export const products: ProductRecord[] = productSeeds.map((product) => {
	const state = mockStates.find((item) => item.product.slug === product.slug);
	const maker = makers.find((item) => item.handle === state?.maker.handle);
	return {
		...product,
		makerHandle: state?.maker.handle ?? 'product-client',
		makerName: maker?.name ?? state?.maker.name ?? 'Product Client',
		status: product.slug === 'bento' ? 'Beta' : 'Live',
		publicPath: `/p/${product.slug}`,
		workspacePath: `/workspace/products/${product.slug}`
	};
});

export const releases: ReleaseRecord[] = mockStates.map((state) => ({
	id: state.id,
	title: state.title,
	type: state.type,
	productSlug: state.product.slug,
	productName: state.product.name,
	productAvatar: state.product.avatar,
	makerHandle: state.maker.handle,
	makerName: state.maker.name,
	description: state.description,
	postedAt: state.postedAt,
	reads: state.reads,
	status: state.type === 'incident' ? 'Resolved' : 'Live',
	publicPath: `/update/${state.id}`,
	workspacePath: `/workspace/releases/${state.id}`
}));

export const feedback: FeedbackRecord[] = [
	{
		id: 'fb-1',
		title: 'Add a way to compare two releases',
		body: 'I want to understand what changed between the last two updates without opening several tabs.',
		type: 'Request',
		status: 'Reviewed',
		productSlug: 'linear',
		productName: 'Linear',
		from: 'Maya Okafor',
		postedAt: '18 min ago',
		priority: 'Medium',
		publicPath: '/feedback/fb-1',
		workspacePath: '/workspace/feedback/fb-1'
	},
	{
		id: 'fb-2',
		title: 'Some people cannot sign in',
		body: 'Two people were sent back to the sign-in page after trying to log in.',
		type: 'Bug',
		status: 'New',
		productSlug: 'vercel',
		productName: 'Vercel',
		from: 'Daniel Kim',
		postedAt: '42 min ago',
		priority: 'High',
		publicPath: '/feedback/fb-2',
		workspacePath: '/workspace/feedback/fb-2'
	},
	{
		id: 'fb-3',
		title: 'The new voice mode feels natural',
		body: 'The handoff between speaking and typing is finally quick enough for daily work.',
		type: 'Praise',
		status: 'Resolved',
		productSlug: 'chatgpt',
		productName: 'ChatGPT',
		from: 'Sarah Chen',
		postedAt: 'Yesterday',
		priority: 'Low',
		publicPath: '/feedback/fb-3',
		workspacePath: '/workspace/feedback/fb-3'
	},
	{
		id: 'fb-4',
		title: 'File uploads now fail less often',
		body: 'A customer approved this quote for use in a public customer story.',
		type: 'Testimonial',
		status: 'Planned',
		productSlug: 'supabase',
		productName: 'Supabase',
		from: 'Priya Sharma',
		postedAt: '2 days ago',
		priority: 'Medium',
		publicPath: '/feedback/fb-4',
		workspacePath: '/workspace/feedback/fb-4'
	}
];

export const roadmapItems: RoadmapRecord[] = [
	{ id: 'road-1', title: 'See what changed between releases', description: 'Compare what changed, what people said, and how each release was received.', status: 'Now', productSlug: 'linear', productName: 'Linear', feedbackCount: 14, owner: 'Maya Okafor', area: 'Product updates', confidence: 'High', audience: 'Customer preview', targetWindow: 'This month', deliveryStatus: 'In progress' },
	{ id: 'road-2', title: 'Explain past service problems', description: 'Give customers a clear history of resolved service problems.', status: 'Now', productSlug: 'vercel', productName: 'Vercel', feedbackCount: 8, owner: 'Daniel Kim', area: 'Service status', confidence: 'Medium', audience: 'Customer preview', targetWindow: 'This month', deliveryStatus: 'Planned' },
	{ id: 'road-3', title: 'Fix missing answers in help docs', description: 'Turn searches with no clear answer into helpful docs.', status: 'Next', productSlug: 'chatgpt', productName: 'ChatGPT', feedbackCount: 21, owner: 'Nina Volkov', area: 'Help content', confidence: 'Medium', audience: 'Internal', targetWindow: 'Next month', deliveryStatus: 'Planned' },
	{ id: 'road-4', title: 'Organize customer stories', description: 'Group approved customer quotes by use and by who they are for.', status: 'Later', productSlug: 'supabase', productName: 'Supabase', feedbackCount: 5, owner: 'Priya Sharma', area: 'Customer stories', confidence: 'Low', audience: 'Internal', targetWindow: 'Later', deliveryStatus: 'Exploring' },
	{ id: 'road-5', title: 'Invite-only launch rooms', description: 'Give launch teams a private place to prepare assets and replies.', status: 'Shipped', productSlug: 'bento', productName: 'Bento', feedbackCount: 11, owner: 'Lorenze', area: 'Launches', confidence: 'High', audience: 'Customer preview', targetWindow: 'Shipped', deliveryStatus: 'Shipped' }
];

export const docs: DocRecord[] = [
	// The mock workspace has no tenant-published hostname yet, so every public
	// document points to the neutral hosted preview. A real publishing response
	// replaces this value with the tenant's published documentation URL.
	{ slug: 'getting-started', title: 'Getting started', description: 'The fastest path from account creation to the first useful result.', section: 'Start here', productSlug: 'bento', productName: 'Bento', updatedAt: 'Today', publicPath: hostedDocsPage.href, workspacePath: '/workspace/docs' },
	{ slug: 'release-notes', title: 'Release notes', description: 'A clear record of what shipped and why it matters.', section: 'Product updates', productSlug: 'bento', productName: 'Bento', updatedAt: 'Yesterday', publicPath: hostedDocsPage.href, workspacePath: '/workspace/docs' },
	{ slug: 'api-reference', title: 'API guide', description: 'How developers connect their apps, send requests, and read answers.', section: 'Developer guide', productSlug: 'supabase', productName: 'Supabase', updatedAt: 'Aug 27', publicPath: hostedDocsPage.href, workspacePath: '/workspace/docs' },
	{ slug: 'status-and-incidents', title: 'Status and service problems', description: 'How we report product health and explain service problems.', section: 'Service guide', productSlug: 'vercel', productName: 'Vercel', updatedAt: 'Aug 26', publicPath: hostedDocsPage.href, workspacePath: '/workspace/docs' },
	{ slug: 'feedback-loop', title: 'How feedback becomes a product update', description: 'How customer feedback becomes a choice, a release, and a follow-up.', section: 'Team guide', productSlug: 'linear', productName: 'Linear', updatedAt: 'Aug 22', publicPath: hostedDocsPage.href, workspacePath: '/workspace/docs' }
];

export const incidents: IncidentRecord[] = [
	{ id: 'inc-1', title: 'Some requests were slow', summary: 'Requests were slower than usual in one region. Things are back to normal, and the team is reviewing what happened.', status: 'Resolved', severity: 'High impact', productSlug: 'vercel', productName: 'Vercel', startedAt: 'Yesterday, 08:14', resolvedAt: 'Yesterday, 10:02', owner: 'Daniel Kim', publicPath: hostedStatusPage.href, workspacePath: '/workspace/incidents/inc-1' },
	{ id: 'inc-2', title: 'Some messages arrived late', summary: 'A backlog delayed updates for some teams.', status: 'Monitoring', severity: 'Medium impact', productSlug: 'stripe', productName: 'Stripe', startedAt: 'Today, 07:32', owner: 'Amara Mensah', publicPath: hostedStatusPage.href, workspacePath: '/workspace/incidents/inc-2' },
	{ id: 'inc-3', title: 'Some people could not sign in', summary: 'New reports suggest a deployment problem. The team is investigating.', status: 'Investigating', severity: 'High impact', productSlug: 'vercel', productName: 'Vercel', startedAt: 'Today, 11:06', owner: 'Daniel Kim', publicPath: hostedStatusPage.href, workspacePath: '/workspace/incidents/inc-3' }
];

export const problems: ProblemRecord[] = [
	{
		id: 'problem-compare-releases',
		title: 'People cannot compare product changes',
		statement: 'People want one clear place to see what changed, who it helps, and what to read next.',
		affectedAudience: 'Customers and product teams',
		productArea: 'Product updates',
		workaround: 'Open several updates and compare them by hand, or ask someone on the team.',
		costOfInaction: 'People miss useful changes and support teams repeat the same explanation.',
		status: 'Ready for decision',
		productSlug: 'linear',
		productName: 'Linear',
		owner: 'Maya Okafor',
		updatedAt: '18 min ago',
		feedbackIds: ['fb-1'],
		docSlugs: ['feedback-loop'],
		decisionId: 'thread-release-comparison',
		workspacePath: '/workspace/problems/problem-compare-releases'
	},
	{
		id: 'problem-sign-in',
		title: 'Some people cannot sign in',
		statement: 'People are sent back to the sign-in page instead of entering the product.',
		affectedAudience: 'People trying to use Vercel today',
		productArea: 'Sign-in',
		workaround: 'Try again later or ask the team for help.',
		costOfInaction: 'People cannot reach their work and may stop trusting the service.',
		status: 'Needs context',
		productSlug: 'vercel',
		productName: 'Vercel',
		owner: 'Daniel Kim',
		updatedAt: '42 min ago',
		feedbackIds: ['fb-2'],
		incidentIds: ['inc-3'],
		docSlugs: ['status-and-incidents'],
		workspacePath: '/workspace/problems/problem-sign-in'
	},
	{
		id: 'problem-missing-answers',
		title: 'People cannot find clear help answers',
		statement: 'Searches show where people get stuck, but the right answer is not connected to a help page yet.',
		affectedAudience: 'Customers learning how to use ChatGPT',
		productArea: 'Help content',
		workaround: 'Read several pages or ask another person to explain it.',
		costOfInaction: 'People lose time and the same questions keep coming back.',
		status: 'Planned',
		productSlug: 'chatgpt',
		productName: 'ChatGPT',
		owner: 'Nina Volkov',
		updatedAt: 'Yesterday',
		feedbackIds: ['fb-3'],
		docSlugs: ['getting-started'],
		decisionId: 'thread-docs-gap',
		workspacePath: '/workspace/problems/problem-missing-answers'
	}
];

export const followUps: FollowUpRecord[] = [
	{ id: 'follow-up-1', incidentId: 'inc-1', title: 'Explain what caused the slow requests', description: 'Add a plain-language explanation to the service status page.', owner: 'Daniel Kim', status: 'In progress', due: 'Tomorrow', kind: 'Customer update', href: hostedStatusPage.href },
	{ id: 'follow-up-2', incidentId: 'inc-1', title: 'Check the help page', description: 'Make sure the help page explains what customers should do when this happens.', owner: 'Nina Volkov', status: 'Open', due: 'Friday', kind: 'Help page', href: '/docs/vercel/status-and-incidents' },
	{ id: 'follow-up-3', incidentId: 'inc-3', title: 'Find why sign-in sends people back', description: 'Review the sign-in change and record the cause when it is known.', owner: 'Daniel Kim', status: 'Open', due: 'Today', kind: 'Product work', href: '/workspace/problems/problem-sign-in' }
];

export const postIncidentTasks: PostIncidentTask[] = [
	{ id: 'post-incident-1', incidentId: 'inc-1', title: 'Review the incident timeline', description: 'Confirm the sequence of detection, mitigation, and recovery before the record is closed.', owner: 'Daniel Kim', status: 'Done', due: 'Today', phase: 'Documenting', kind: 'Timeline review', href: '/workspace/incidents/inc-1' },
	{ id: 'post-incident-2', incidentId: 'inc-1', title: 'Review follow-ups', description: 'Confirm the remaining work has a clear owner, due date, and destination after this incident.', owner: 'Daniel Kim', status: 'Open', due: 'Tomorrow', phase: 'Documenting', kind: 'Follow-ups', href: '/workspace/incidents/follow-ups?selected=follow-up-1' },
	{ id: 'post-incident-3', incidentId: 'inc-1', title: 'Decide whether a post-mortem is needed', description: 'Use the impact and response record to agree on the right learning step for this incident.', owner: 'Daniel Kim', status: 'Open', due: 'Friday', phase: 'Documenting', kind: 'Post-mortem decision' },
	{ id: 'post-incident-4', incidentId: 'inc-1', title: 'Review the customer update', description: 'Confirm the public update explains the customer impact and what changed in plain language.', owner: 'Nina Volkov', status: 'Open', due: 'Tomorrow', phase: 'Reviewing', kind: 'Customer review', href: hostedStatusPage.href },
	{ id: 'post-incident-5', incidentId: 'inc-1', title: 'Schedule a response debrief', description: 'Invite the responders to review what helped, what slowed the response, and what to change next time.', owner: 'Amara Mensah', status: 'Open', due: 'Next week', phase: 'Reviewing', kind: 'Debrief' }
];

export const searchGaps: SearchGapRecord[] = [
	{ id: 'gap-1', query: 'compare releases', searches: 21, lastSeen: 'Today, 09:14', status: 'Needs help', owner: 'Nina Volkov', productSlug: 'linear', productName: 'Linear', linkedDocSlug: 'feedback-loop' },
	{ id: 'gap-2', query: 'why was my request slow', searches: 12, lastSeen: 'Yesterday, 16:40', status: 'In progress', owner: 'Daniel Kim', productSlug: 'vercel', productName: 'Vercel', linkedDocSlug: 'status-and-incidents' },
	{ id: 'gap-3', query: 'use voice mode', searches: 7, lastSeen: 'Yesterday, 11:02', status: 'Answered', owner: 'Nina Volkov', productSlug: 'chatgpt', productName: 'ChatGPT', linkedDocSlug: 'getting-started' }
];

export const docFeedback: DocFeedbackRecord[] = [
	{ id: 'doc-feedback-1', docSlug: 'getting-started', productSlug: 'chatgpt', comment: 'I could not find the steps for using voice mode.', helpful: false, status: 'New', postedAt: 'Yesterday', linkedProblemId: 'problem-missing-answers' },
	{ id: 'doc-feedback-2', docSlug: 'status-and-incidents', productSlug: 'vercel', comment: 'This explains the current status, but not what caused the last problem.', helpful: false, status: 'Reviewed', postedAt: '2 days ago', linkedProblemId: 'problem-sign-in' }
];

export const proofs: ProofRecord[] = [
	{ id: 'proof-1', quote: 'The new product updates save me 30 minutes every day.', name: 'Julia Park', role: 'Product lead', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', source: 'Review', status: 'Approved', productSlug: 'linear', productName: 'Linear', tags: ['Productivity', 'Teams'], consent: 'Confirmed', allowedUses: ['Customer stories', 'Product page'], featured: true, outcome: 'Less time spent looking for changes.' },
	{ id: 'proof-2', quote: 'The new file uploads are exactly what our team needed.', name: 'Priya Sharma', role: 'Founder', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', source: 'Customer call', status: 'Approved', productSlug: 'supabase', productName: 'Supabase', tags: ['File uploads', 'Technical teams'], consent: 'Confirmed', allowedUses: ['Customer stories', 'Product update'], outcome: 'Fewer interrupted uploads.' },
	{ id: 'proof-3', quote: 'Figma Sites changed how we ship landing pages. From design to live in two clicks.', name: 'Dev Patel', role: 'Marketing lead', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', source: 'Imported', status: 'Needs review', productSlug: 'figma', productName: 'Figma', tags: ['Design', 'Marketing'], consent: 'Needs confirmation', allowedUses: ['Internal review'], outcome: 'A faster path from design to a live page.' },
	{ id: 'proof-4', quote: 'Keeping my work saved while I edit is a big improvement for large projects.', name: 'Alex Rivera', role: 'Staff engineer', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', source: 'Review', status: 'Approved', productSlug: 'cursor', productName: 'Cursor', tags: ['Code', 'AI'], consent: 'Confirmed', allowedUses: ['Customer stories'], featured: true, outcome: 'Less worry about losing work.' }
];

export const decisionThreads: DecisionThread[] = [
	{
		id: 'thread-release-comparison',
		title: 'See what changed between releases',
		problem: 'People open several tabs to see what changed, who it helps, and what to read next.',
		outcome: 'One product story that explains the change, the customer feedback behind it, and the help page in under two minutes.',
		productSlug: 'linear',
		productName: 'Linear',
		owner: 'Maya Okafor',
		updatedAt: '18 min ago',
		status: 'In decision',
		confidence: 'High',
		visibility: 'Public preview',
		feedbackCount: 14,
		problemId: 'problem-compare-releases',
		goal: 'Help people understand product changes in less than two minutes.',
		affectedAudience: 'Customers and product teams that follow releases',
		workaround: 'Open several updates and compare them by hand.',
		costOfInaction: 'People miss useful changes and support teams repeat the same explanation.',
		reviewDate: 'Tomorrow',
		assumptions: ['People want a quick comparison of nearby updates.', 'A clear summary is more useful than another report.'],
		dissent: 'Developers may still want the full technical release detail.',
		options: [
			{ id: 'compare-summary', label: 'One clear comparison page', summary: 'Show the old and new update together with a short explanation.', tradeoff: 'Needs a little more work when a release is written.', impact: 'High', effort: 'Medium', risk: 'Low', chosen: true },
			{ id: 'compare-tool', label: 'A separate comparison tool', summary: 'Let people choose any two updates and compare them.', tradeoff: 'Adds another screen for people to learn.', impact: 'High', effort: 'High', risk: 'Medium' },
			{ id: 'compare-links', label: 'Link to each update', summary: 'Keep the current update pages and add more links between them.', tradeoff: 'People still need to compare the pages themselves.', impact: 'Low', effort: 'Low', risk: 'Low' }
		],
		decisionLog: [
			{ label: 'Feedback received', detail: '14 customer comments point to the same problem.', date: 'Today' },
			{ label: 'Problem described', detail: 'The need is clearer than the original request for a comparison button.', date: 'Today' },
			{ label: 'Options added', detail: 'The team is comparing three ways to explain changes.', date: 'Today' }
		],
		relations: [
			{ kind: 'Feedback', title: 'Add a way to compare two releases', detail: 'Maya Okafor · Reviewed · 14 customer comments', href: '/workspace/feedback/fb-1', status: 'Reviewed' },
			{ kind: 'Roadmap', title: 'See what changed between releases', detail: 'Now · 14 customer comments · Maya Okafor', href: '/workspace/roadmap#road-1', status: 'Now' },
			{ kind: 'Release', title: 'Clearer product updates', detail: 'Linear · latest public update', href: '/workspace/releases/r2', status: 'Live' },
			{ kind: 'Doc', title: 'How feedback becomes a product update', detail: 'Team guide · updated Aug 22', href: '/docs/linear/feedback-loop', status: 'Published' }
		]
	},
	{
		id: 'thread-incident-history',
		title: 'Explain past service problems',
		problem: 'Customers can see an update during a service problem, but they also need to know what happened and what changed afterwards.',
		outcome: 'A clear history of service problems that links the public update, the fix, and the help page.',
		productSlug: 'vercel',
		productName: 'Vercel',
		owner: 'Daniel Kim',
		updatedAt: '46 min ago',
		status: 'Planned',
		confidence: 'Medium',
		visibility: 'Public preview',
		feedbackCount: 8,
		problemId: 'problem-sign-in',
		goal: 'Help customers understand what happened after a service problem.',
		affectedAudience: 'Customers who were affected by a service problem',
		workaround: 'Read the latest update or ask support what happened.',
		costOfInaction: 'People may see the next problem as a surprise.',
		reviewDate: 'Friday',
		assumptions: ['Customers want a short explanation after the service is working again.'],
		options: [
			{ id: 'history-page', label: 'A clear history page', summary: 'Show past service problems, what happened, and what changed.', tradeoff: 'Someone must keep the explanation current.', impact: 'High', effort: 'Medium', risk: 'Low', chosen: true },
			{ id: 'status-only', label: 'Keep the status page only', summary: 'Show the current problem and close the page when it is fixed.', tradeoff: 'Customers cannot learn from older problems.', impact: 'Medium', effort: 'Low', risk: 'Medium' }
		],
		decisionLog: [
			{ label: 'Service problem resolved', detail: 'The public update says when the service returned to normal.', date: 'Yesterday' },
			{ label: 'Follow-up opened', detail: 'The team is deciding how much history customers need.', date: 'Today' }
		],
		relations: [
			{ kind: 'Incident', title: 'Some requests were slow', detail: 'High impact · Resolved yesterday', href: '/workspace/incidents/inc-1', status: 'Resolved' },
			{ kind: 'Roadmap', title: 'Explain past service problems', detail: 'Now · 8 customer comments · Daniel Kim', href: '/workspace/roadmap#road-2', status: 'Now' },
			{ kind: 'Doc', title: 'Status and service problems', detail: 'Service guide · updated Aug 26', href: '/docs/vercel/status-and-incidents', status: 'Published' },
			{ kind: 'Release', title: 'Fewer slow requests', detail: 'Vercel · follow-up update', href: '/workspace/releases/r3', status: 'Live' }
		]
	},
	{
		id: 'thread-docs-gap',
		title: 'Fix missing answers in help docs',
		problem: 'Searches show where people get stuck, but those questions are not yet connected to a help page we can improve.',
		outcome: 'A list of missing answers that helps the team write better help pages and connect each answer to the right product area.',
		productSlug: 'chatgpt',
		productName: 'ChatGPT',
		owner: 'Nina Volkov',
		updatedAt: 'Yesterday',
		status: 'Planned',
		confidence: 'Medium',
		visibility: 'Internal',
		feedbackCount: 21,
		problemId: 'problem-missing-answers',
		goal: 'Help people find a clear answer before they need to ask the team.',
		affectedAudience: 'Customers learning how to use the product',
		workaround: 'Read several pages or ask another person to explain it.',
		costOfInaction: 'People lose time and the same questions keep coming back.',
		reviewDate: 'Next week',
		assumptions: ['Unanswered searches are a useful starting point for new help pages.'],
		dissent: 'Some questions may need a product change, not a new help page.',
		options: [
			{ id: 'answer-pages', label: 'Write the missing help pages', summary: 'Turn common unanswered searches into short, linked answers.', tradeoff: 'The team needs to check that the answer matches the product.', impact: 'High', effort: 'Medium', risk: 'Low', chosen: true },
			{ id: 'ask-team', label: 'Send people to the team', summary: 'Let people ask for help when search does not find an answer.', tradeoff: 'The team answers the same question more than once.', impact: 'Medium', effort: 'Low', risk: 'High' }
		],
		decisionLog: [
			{ label: 'Search gap found', detail: '21 searches did not lead to a clear answer.', date: 'Yesterday' },
			{ label: 'Question grouped', detail: 'The searches point to the same help-content problem.', date: 'Today' }
		],
		relations: [
			{ kind: 'Roadmap', title: 'Fix missing answers in help docs', detail: 'Next · 21 unanswered questions · Nina Volkov', href: '/workspace/roadmap#road-3', status: 'Next' },
			{ kind: 'Release', title: 'ChatGPT 6 update', detail: 'Latest release · 2 hours ago', href: '/workspace/releases/r1', status: 'Live' },
			{ kind: 'Feedback', title: 'The new voice mode feels natural', detail: 'Sarah Chen · Praise · resolved', href: '/workspace/feedback/fb-3', status: 'Resolved' }
		]
	}
];

export const workspaceActivity = [
	{ id: 'activity-1', label: 'Release published', detail: 'ChatGPT 6 update', time: '2 hours ago', href: '/update/1', kind: 'Release' },
	{ id: 'activity-2', label: 'Feedback reviewed', detail: 'Add a way to compare two releases', time: '18 min ago', href: '/feedback/fb-1', kind: 'Feedback' },
	{ id: 'activity-3', label: 'Service problem is being watched', detail: 'Some messages arrived late', time: '46 min ago', href: hostedStatusPage.href, kind: 'Incident' },
	{ id: 'activity-4', label: 'Customer story approved', detail: 'The new file uploads are exactly what our team needed.', time: 'Yesterday', href: '/workspace/proof', kind: 'Proof' }
];

export const preLaunches = preLaunchProducts;
export const reviewRecords = reviews;

export function productBySlug(slug: string): ProductRecord | undefined {
	return products.find((product) => product.slug === slug);
}

export function decisionThreadById(id: string): DecisionThread | undefined {
	return decisionThreads.find((thread) => thread.id === id);
}

export function problemById(id: string): ProblemRecord | undefined {
	return problems.find((problem) => problem.id === id);
}

export function problemsForFeedback(feedbackId: string): ProblemRecord[] {
	return problems.filter((problem) => problem.feedbackIds.includes(feedbackId));
}


export function makerByHandle(handle: string) {
	return makers.find((maker) => maker.handle === handle);
}

export function releasesForProduct(slug: string): ReleaseRecord[] {
	return releases.filter((release) => release.productSlug === slug);
}

export function feedbackForProduct(slug: string): FeedbackRecord[] {
	return feedback.filter((item) => item.productSlug === slug);
}

export function incidentForProduct(slug: string): IncidentRecord[] {
	return incidents.filter((incident) => incident.productSlug === slug);
}

export function productReadCount(slug: string): string {
	return formatReads(releasesForProduct(slug).reduce((total, release) => total + numericReads(release.reads), 0));
}

export function buildSearchRecords(): SearchRecord[] {
	return [
		...products.map((product) => ({
			id: product.slug,
			kind: 'Product' as const,
			title: product.name,
			subtitle: `${product.category ?? 'Product'} · ${product.makerName}`,
			description: product.tagline ?? 'Product workspace and public profile',
			href: product.publicPath,
			publicHref: product.publicPath,
			workspaceHref: product.workspacePath,
			status: product.status,
			keywords: [product.name, product.slug, product.category ?? '', ...(product.tags ?? []), product.makerName]
		})),
		...releases.map((release) => ({
			id: release.id,
			kind: 'Release' as const,
			title: release.title,
			subtitle: `${release.productName} · ${release.type} · ${release.postedAt}`,
			description: release.description,
			href: release.publicPath,
			publicHref: release.publicPath,
			workspaceHref: release.workspacePath,
			status: release.status,
			keywords: [release.title, release.description, release.productName, release.type, release.makerName]
		})),
		...feedback.map((item) => ({
			id: item.id,
			kind: 'Feedback' as const,
			title: item.title,
			subtitle: `${item.productName} · ${item.type} · ${item.status}`,
			description: item.body,
			href: item.publicPath,
			publicHref: item.publicPath,
			workspaceHref: item.workspacePath,
			status: item.status,
			keywords: [item.title, item.body, item.productName, item.type, item.status, item.from],
			relationPreview: problemsForFeedback(item.id)[0]?.title
		})),
		...problems.map((problem) => ({
			id: problem.id,
			kind: 'Problem' as const,
			title: problem.title,
			subtitle: `${problem.productName} · ${problem.productArea} · ${problem.status}`,
			description: problem.statement,
			href: problem.workspacePath,
			workspaceHref: problem.workspacePath,
			status: problem.status,
			keywords: [problem.title, problem.statement, problem.affectedAudience, problem.productArea, problem.workaround, problem.costOfInaction, problem.owner],
			relationPreview: problem.decisionId ? decisionThreadById(problem.decisionId)?.title : undefined
		})),
		...roadmapItems.map((item) => ({
			id: item.id,
			kind: 'Roadmap' as const,
			title: item.title,
			subtitle: `${item.productName} · ${item.status} · ${item.owner}`,
			description: item.description,
			href: `/workspace/roadmap#${item.id}`,
			workspaceHref: `/workspace/roadmap#${item.id}`,
			status: item.status,
			keywords: [item.title, item.description, item.productName, item.status, item.owner, item.area ?? ''],
			relationPreview: decisionThreads.find((thread) => thread.relations.some((relation) => relation.kind === 'Roadmap' && relation.title === item.title))?.title
		})),
		...decisionThreads.map((thread) => ({
			id: thread.id,
			kind: 'Decision' as const,
			title: thread.title,
			subtitle: `${thread.productName} · ${thread.status} · ${thread.owner}`,
			description: thread.problem,
			href: `/workspace/decisions/${thread.id}`,
			workspaceHref: `/workspace/decisions/${thread.id}`,
			status: thread.status,
			keywords: [thread.title, thread.problem, thread.outcome, thread.productName, thread.status, thread.owner, ...thread.relations.map((relation) => relation.title)]
		})),
		...docs.map((doc) => ({
			id: `${doc.productSlug}-${doc.slug}`,
			kind: 'Doc' as const,
			title: doc.title,
			subtitle: `${doc.productName} · ${doc.section} · ${doc.updatedAt}`,
			description: doc.description,
			href: doc.publicPath,
			publicHref: doc.publicPath,
			workspaceHref: doc.workspacePath,
			status: 'Published',
			keywords: [doc.title, doc.description, doc.productName, doc.section]
		})),
		...incidents.map((incident) => ({
			id: incident.id,
			kind: 'Incident' as const,
			title: incident.title,
			subtitle: `${incident.productName} · ${incident.severity} · ${incident.status}`,
			description: incident.summary,
			href: incident.publicPath,
			publicHref: incident.publicPath,
			workspaceHref: incident.workspacePath,
			status: incident.status,
			keywords: [incident.title, incident.summary, incident.productName, incident.severity, incident.status, incident.owner]
		})),
		...proofs.map((proof) => ({
			id: proof.id,
			kind: 'Proof' as const,
			title: proof.quote,
			subtitle: `${proof.productName} · ${proof.name} · ${proof.status}`,
			description: proof.role,
			href: `/workspace/proof#${proof.id}`,
			publicHref: proof.status === 'Approved' ? `/wall/${proof.productSlug}` : undefined,
			workspaceHref: `/workspace/proof#${proof.id}`,
			status: proof.status,
			keywords: [proof.quote, proof.name, proof.role, proof.productName, ...proof.tags]
		})),
		...makers.map((maker) => ({
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
