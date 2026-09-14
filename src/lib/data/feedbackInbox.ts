import { supabase } from '$lib/supabaseClient';

// Live reads for /workspace/feedback and /workspace/inbox.
// RLS scopes every query to products the signed-in maker owns; the optional
// active-product id is only a view filter, never the security boundary.

export type FeedbackBucket = 'New' | 'Reviewed' | 'Planned' | 'Resolved';

export type FeedbackItemView = {
	id: string;
	title: string;
	body: string;
	kind: string;
	typeLabel: string;
	status: FeedbackBucket;
	source: string;
	productSlug: string;
	productName: string;
	from: string;
	postedAt: string;
	createdAt: string;
};

export type InboxThreadView = {
	id: string;
	title: string;
	preview: string;
	status: string;
	unread: boolean;
	productSlug: string;
	productName: string;
	lastMessageAt: string;
	href: string;
	githubIssueUrl: string | null;
	githubIssueNumber: number | null;
};

// DB pipeline vocabulary (feedback_items.status CHECK) mapped onto the five
// workspace filter buckets. in_progress/shipped/closed all read as Resolved —
// the badge keeps the bucket; the raw status stays in the DB row.
const BUCKET_BY_STATUS: Record<string, FeedbackBucket> = {
	new: 'New',
	reviewing: 'Reviewed',
	planned: 'Planned',
	in_progress: 'Resolved',
	shipped: 'Resolved',
	closed: 'Resolved'
};

const LABEL_BY_KIND: Record<string, string> = {
	idea: 'Request',
	bug: 'Bug',
	question: 'Question',
	praise: 'Praise'
};

const BUCKET_RANK: Record<FeedbackBucket, number> = { New: 0, Reviewed: 1, Planned: 2, Resolved: 3 };

export function timeAgo(iso: string | null | undefined): string {
	if (!iso) return '';
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return '';
	const diff = then - Date.now();
	const abs = Math.abs(diff);
	if (abs < 60_000) return 'just now';
	let unit: Intl.RelativeTimeFormatUnit = 'year';
	let divisor = 31_557_600_000;
	if (abs < 3_600_000) {
		unit = 'minute';
		divisor = 60_000;
	} else if (abs < 86_400_000) {
		unit = 'hour';
		divisor = 3_600_000;
	} else if (abs < 604_800_000) {
		unit = 'day';
		divisor = 86_400_000;
	} else if (abs < 2_629_800_000) {
		unit = 'week';
		divisor = 604_800_000;
	} else if (abs < 31_557_600_000) {
		unit = 'month';
		divisor = 2_629_800_000;
	}
	return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(diff / divisor), unit);
}

function embeddedName(products: unknown): string {
	if (Array.isArray(products)) return ((products[0] as { name?: string | null } | undefined)?.name ?? '');
	return ((products as { name?: string | null } | null)?.name ?? '');
}

function firstLine(text: string, max = 90): string {
	const line = text.trim().split('\n')[0] ?? '';
	return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

function authorLabel(authorName: string | null, authorEmail: string | null): string {
	const name = authorName?.trim();
	return name || authorEmail || 'Someone';
}

type FeedbackRow = {
	id: string;
	product_id: string;
	source: string;
	kind: string;
	title: string | null;
	body: string;
	status: string;
	author_name: string | null;
	author_email: string | null;
	created_at: string;
	products?: unknown;
};

function toFeedbackItemView(row: FeedbackRow): FeedbackItemView {
	return {
		id: row.id,
		title: row.title?.trim() || firstLine(row.body),
		body: row.body,
		kind: row.kind,
		typeLabel: LABEL_BY_KIND[row.kind] ?? 'Request',
		status: BUCKET_BY_STATUS[row.status] ?? 'New',
		source: row.source,
		productSlug: (row.products as { slug?: string | null } | null)?.slug ?? '',
		productName: embeddedName(row.products) || 'Product',
		from: authorLabel(row.author_name, row.author_email),
		postedAt: timeAgo(row.created_at),
		createdAt: row.created_at
	};
}

export async function loadFeedbackItems(
	activeProductId: string | null
): Promise<{ items: FeedbackItemView[]; error: string | null }> {
	if (!supabase) return { items: [], error: 'Service is temporarily unavailable' };
	let query = supabase
		.from('feedback_items')
		.select('id, product_id, source, kind, title, body, status, author_name, author_email, created_at, products(slug, name)')
		.order('created_at', { ascending: false })
		.limit(200);
	if (activeProductId) query = query.eq('product_id', activeProductId);
	const { data, error } = await query;
	if (error) return { items: [], error: error.message };
	const items = ((data ?? []) as FeedbackRow[]).map(toFeedbackItemView);
	items.sort(
		(a, b) => BUCKET_RANK[a.status] - BUCKET_RANK[b.status] || b.createdAt.localeCompare(a.createdAt)
	);
	return { items, error: null };
}

export type FeedbackItemDetail = {
	item: FeedbackItemView;
	product: { slug: string; name: string; avatar: string | null; publicPath: string; workspacePath: string } | null;
};

export async function loadFeedbackItemById(id: string): Promise<FeedbackItemDetail | null> {
	if (!supabase) return null;
	const { data, error } = await supabase
		.from('feedback_items')
		.select('id, product_id, source, kind, title, body, status, author_name, author_email, created_at, products(slug, name, avatar)')
		.eq('id', id)
		.maybeSingle();
	if (error || !data) return null;
	const row = data as FeedbackRow & { products?: { slug?: string | null; name?: string | null; avatar?: string | null } | null };
	const product = row.products?.slug
		? {
				slug: row.products.slug as string,
				name: row.products.name ?? 'Product',
				avatar: row.products.avatar ?? null,
				publicPath: `/p/${row.products.slug}`,
				workspacePath: `/workspace/products/${row.products.slug}`
			}
		: null;
	return { item: toFeedbackItemView(row), product };
}

type ThreadRow = {
	id: string;
	subject_type: string;
	subject_id: string | null;
	title: string | null;
	status: string;
	last_message_at: string;
	last_preview: string | null;
	unread_maker: boolean;
	products?: unknown;
};

export async function loadInboxThreads(
	activeProductId: string | null
): Promise<{ threads: InboxThreadView[]; error: string | null }> {
	if (!supabase) return { threads: [], error: 'Service is temporarily unavailable' };
	let query = supabase
		.from('inbox_threads')
		.select('id, subject_type, subject_id, title, status, last_message_at, last_preview, unread_maker, products(slug, name)')
		.order('last_message_at', { ascending: false })
		.limit(200);
	if (activeProductId) query = query.eq('product_id', activeProductId);
	const { data, error } = await query;
	if (error) return { threads: [], error: error.message };
	const feedbackIds = ((data ?? []) as ThreadRow[]).filter((row) => row.subject_type === 'feedback' && row.subject_id).map((row) => row.subject_id as string);
	const issueByFeedback = new Map<string, { url: string | null; number: number | null }>();
	if (feedbackIds.length) {
		const { data: feedbackRows } = await supabase.from('feedback_items').select('id, github_issue_url, github_issue_number').in('id', feedbackIds);
		for (const row of (feedbackRows ?? []) as Array<{ id: string; github_issue_url?: string | null; github_issue_number?: number | null }>) issueByFeedback.set(row.id, { url: row.github_issue_url ?? null, number: row.github_issue_number ?? null });
	}
	const threads = ((data ?? []) as ThreadRow[]).map((row) => {
		const preview = row.last_preview?.trim() ?? '';
		const issue = row.subject_id ? issueByFeedback.get(row.subject_id) : undefined;
		return {
			id: row.id,
			title: row.title?.trim() || firstLine(preview) || 'Feedback message',
			preview,
			status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
			unread: row.unread_maker,
			productSlug: (row.products as { slug?: string | null } | null)?.slug ?? '',
			productName: embeddedName(row.products) || 'Product',
			lastMessageAt: timeAgo(row.last_message_at),
			// Only feedback subjects have a workspace detail page today; the
			// visitor-reply flow and other subject types arrive with the widget.
				href:
					row.subject_type === 'feedback' && row.subject_id
						? `/workspace/feedback/${row.subject_id}`
						: '/workspace/feedback',
				githubIssueUrl: issue?.url ?? null,
				githubIssueNumber: issue?.number ?? null
		} satisfies InboxThreadView;
	});
	return { threads, error: null };
}

// Incidents are tenant-scoped (member-select RLS), not product-scoped, so the
// inbox keeps them visible regardless of the active-product filter.
export type IncidentRowView = {
	id: string;
	title: string;
	summary: string;
	status: string;
	severity: string;
	owner: string;
	startedAt: string;
	resolvedAt: string | null;
};

export async function loadInboxIncidents(): Promise<{ rows: IncidentRowView[]; error: string | null }> {
	if (!supabase) return { rows: [], error: 'Service is temporarily unavailable' };
	const { data, error } = await supabase
		.from('incidents')
		.select('id, title, summary, status, severity, lead_name, started_at, resolved_at')
		.order('started_at', { ascending: false })
		.limit(50);
	if (error) return { rows: [], error: error.message };
	const rows = ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
		id: row.id as string,
		title: row.title as string,
		summary: row.summary as string,
		status: (row.status as string).charAt(0).toUpperCase() + (row.status as string).slice(1),
		severity: row.severity as string,
		owner: (row.lead_name as string) || 'Unassigned',
		startedAt: timeAgo(row.started_at as string),
		resolvedAt: (row.resolved_at as string | null) ?? null
	}));
	return { rows, error: null };
}
