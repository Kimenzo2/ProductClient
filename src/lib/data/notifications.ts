import { supabase } from '$lib/supabaseClient';
import { loadInboxIncidents, timeAgo } from '$lib/data/feedbackInbox';

// Live notifications — there is no notifications table. The feed derives from
// what the user already has: public launch events on followed products plus
// incidents on owned tenants. Read/unread persists per browser.

export type LiveNotification = {
	id: string;
	type: 'launch' | 'incident';
	productSlug: string;
	productName: string;
	productAvatar: string;
	message: string;
	time: string;
	read: boolean;
	createdAt: string;
};

type RawNotification = Omit<LiveNotification, 'read'>;

const READ_KEY = 'pc-notifications-read-v1';
const MAX_READ_IDS = 300;
const MAX_ITEMS = 40;

async function sessionUserId(): Promise<string | null> {
	// Local session read, no network.
	try {
		if (!supabase) return null;
		const { data } = await supabase.auth.getSession();
		return data.session?.user.id ?? null;
	} catch {
		return null;
	}
}

function readIds(userId: string): Set<string> {
	try {
		const raw = localStorage.getItem(`${READ_KEY}:${userId}`);
		const parsed: unknown = JSON.parse(raw ?? '[]');
		return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []);
	} catch {
		return new Set();
	}
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
	try {
		const userId = await sessionUserId();
		if (!userId) return;
		const merged = [...new Set([...ids, ...readIds(userId)])].slice(0, MAX_READ_IDS);
		localStorage.setItem(`${READ_KEY}:${userId}`, JSON.stringify(merged));
	} catch {
		// Private mode — read state stays in memory for this session only.
	}
}

async function loadFollowedEvents(): Promise<RawNotification[]> {
	if (!supabase) return [];
	try {
		const { data: follows, error: followsError } = await supabase.from('follows').select('product_id');
		if (followsError || !follows?.length) return [];
		const productIds = [...new Set((follows as Array<{ product_id: string }>).map((f) => f.product_id).filter(Boolean))];
		if (productIds.length === 0) return [];
		// Public launch feed — world-readable for published events, so makers
		// see activity on products they follow but don't own.
		const { data, error } = await supabase
			.from('events')
			.select('id, type, title, published_at, products(slug, name, avatar)')
			.in('product_id', productIds)
			.lte('published_at', new Date().toISOString())
			.is('deleted_at', null)
			.is('hidden_at', null)
			.order('published_at', { ascending: false })
			.limit(30);
		if (error || !data) return [];
		return ((data ?? []) as Array<Record<string, unknown>>).flatMap((row) => {
			const product = (Array.isArray(row.products) ? row.products[0] : row.products) as
				| { slug?: string | null; name?: string | null; avatar?: string | null }
				| null
				| undefined;
			if (typeof row.id !== 'string' || typeof row.title !== 'string') return [];
			return [
				{
					id: `event:${row.id}`,
					type: 'launch' as const,
					productSlug: product?.slug ?? '',
					productName: product?.name ?? 'Product',
					productAvatar: product?.avatar ?? '',
					message: row.title,
					time: timeAgo(typeof row.published_at === 'string' ? row.published_at : null),
					createdAt: typeof row.published_at === 'string' ? row.published_at : ''
				}
			];
		});
	} catch {
		return [];
	}
}

async function loadOwnedIncidents(): Promise<RawNotification[]> {
	try {
		const { rows } = await loadInboxIncidents();
		return rows.slice(0, 10).map((row) => ({
			id: `incident:${row.id}`,
			type: 'incident' as const,
			productSlug: '',
			productName: 'Service status',
			productAvatar: '',
			message: `${row.title} — ${row.status.toLowerCase()}`,
			time: row.startedAt,
			createdAt: row.startedAtIso
		}));
	} catch {
		return [];
	}
}

export async function loadNotifications(): Promise<{ items: LiveNotification[]; error: string | null }> {
	if (!supabase) return { items: [], error: 'Service is temporarily unavailable' };
	try {
		// Signed-out viewers get an empty feed with zero network calls.
		const userId = await sessionUserId();
		if (!userId) return { items: [], error: null };
		const read = readIds(userId);
		const [events, incidents] = await Promise.all([loadFollowedEvents(), loadOwnedIncidents()]);
		const items = [...events, ...incidents];
		items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
		return {
			items: items.slice(0, MAX_ITEMS).map((item) => ({ ...item, read: read.has(item.id) })),
			error: null
		};
	} catch {
		return { items: [], error: 'Could not load notifications — check your connection.' };
	}
}
