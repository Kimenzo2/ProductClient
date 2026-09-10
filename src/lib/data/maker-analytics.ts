import { supabase } from '$lib/supabaseClient';

type ProductRow = {
	id: string;
	tenant_id: string | null;
	name: string;
	slug: string;
	category: string | null;
	live_url: string | null;
	follow_count: number | null;
	created_at: string;
	launched_at: string | null;
	last_shipped_at: string | null;
	docs_nonempty: boolean;
	roadmap_or_feedback_nonempty: boolean;
	status_page_nonempty: boolean;
};

type EventRow = {
	id: string;
	product_id: string;
	type: string;
	title: string;
	published_at: string;
};

type InteractionRow = {
	product_id: string;
	event_id: string | null;
	kind: string;
	created_at: string;
};

type BoostRow = {
	id: string;
	event_id: string;
	stake_gross: number;
	started_at: string;
	ends_at: string;
	status: string;
};

type IncidentRow = {
	status: string;
	started_at: string | null;
	resolved_at: string | null;
};

export type MakerProductAnalytics = {
	id: string;
	name: string;
	slug: string;
	category: string | null;
	followers: number;
	lastShippedAt: string | null;
	completeness: {
		docs: boolean;
		roadmap: boolean;
		status: boolean;
		liveUrl: boolean;
	};
};

export type BoostPerformance = {
	id: string;
	eventTitle: string;
	amountCents: number;
	startedAt: string;
	endsAt: string;
	status: string;
	followersGained: number;
	returnVisitsGained: number;
	linkClicksGained: number;
};

export type AnalyticsRange = '7d' | '30d' | '90d';

export type ViewTrendBucket = {
	startAt: string;
	views: number;
	agentViews: number;
	returnVisits: number;
	followerGains: number;
	linkClicks: number;
	feedbackFiled: number;
	feedbackMoved: number;
	assistantTraffic: number;
};

export type AnalyticsRangeMetrics = {
	views: number;
	returnVisits: number;
	followerGains: number;
	linkClicks: number;
	feedbackFiled: number;
	feedbackMoved: number;
	assistantTraffic: number;
	previousViews: number;
	previousReturnVisits: number;
	previousFollowerGains: number;
	previousLinkClicks: number;
	previousFeedbackFiled: number;
	previousFeedbackMoved: number;
	previousAssistantTraffic: number;
	buckets: ViewTrendBucket[];
};

export type MakerAnalytics = {
	products: MakerProductAnalytics[];
	metrics: {
		views: number;
		returnVisits: number;
		followers: number;
		following: number;
		linkClicks: number;
		feedbackFiled: number;
		feedbackMoved: number;
		assistantTraffic: number;
		incidents: number;
		openIncidents: number;
		resolvedIncidents: number;
		incidentResolutionHours: number | null;
		daysSinceLastUpdate: number | null;
		lastShippedAt: string | null;
	};
	completeness: {
		docs: number;
		roadmap: number;
		status: number;
		liveUrl: number;
		total: number;
	};
	ranges: Record<AnalyticsRange, AnalyticsRangeMetrics>;
	activeBoost: BoostPerformance | null;
	boosts: BoostPerformance[];
};

const shippedEventTypes = new Set(['launch', 'release', 'changelog', 'fix']);
const rangeDays: Record<AnalyticsRange, number> = { '7d': 7, '30d': 30, '90d': 90 };
const rangeBucketCounts: Record<AnalyticsRange, number> = { '7d': 7, '30d': 10, '90d': 13 };

function emptyRangeMetrics(range: AnalyticsRange): AnalyticsRangeMetrics {
	const durationMs = rangeDays[range] * 86_400_000;
	const bucketDuration = durationMs / rangeBucketCounts[range];
	return {
		views: 0,
		returnVisits: 0,
		followerGains: 0,
		linkClicks: 0,
		feedbackFiled: 0,
		feedbackMoved: 0,
		assistantTraffic: 0,
		previousViews: 0,
		previousReturnVisits: 0,
		previousFollowerGains: 0,
		previousLinkClicks: 0,
		previousFeedbackFiled: 0,
		previousFeedbackMoved: 0,
		previousAssistantTraffic: 0,
		buckets: Array.from({ length: rangeBucketCounts[range] }, (_, index) => ({
			startAt: new Date(Date.now() - durationMs + index * bucketDuration).toISOString(),
			views: 0,
			agentViews: 0,
			returnVisits: 0,
			followerGains: 0,
			linkClicks: 0,
			feedbackFiled: 0,
			feedbackMoved: 0,
			assistantTraffic: 0
		}))
	};
}

function emptyRanges(): Record<AnalyticsRange, AnalyticsRangeMetrics> {
	return {
		'7d': emptyRangeMetrics('7d'),
		'30d': emptyRangeMetrics('30d'),
		'90d': emptyRangeMetrics('90d')
	};
}

function emptyAnalytics(): MakerAnalytics {
	return {
		products: [],
		metrics: {
			views: 0,
			returnVisits: 0,
			followers: 0,
			following: 0,
			linkClicks: 0,
			feedbackFiled: 0,
			feedbackMoved: 0,
			assistantTraffic: 0,
			incidents: 0,
			openIncidents: 0,
			resolvedIncidents: 0,
			incidentResolutionHours: null,
			daysSinceLastUpdate: null,
			lastShippedAt: null
		},
		completeness: { docs: 0, roadmap: 0, status: 0, liveUrl: 0, total: 0 },
		ranges: emptyRanges(),
		activeBoost: null,
		boosts: []
	};
}

function countInteractions(rows: InteractionRow[], kind: string, startMs: number, endMs: number): number {
	return rows.filter((row) => {
		const timestamp = Date.parse(row.created_at);
		return row.kind === kind && Number.isFinite(timestamp) && timestamp >= startMs && timestamp < endMs;
	}).length;
}

function countEvents(rows: EventRow[], type: string, startMs: number, endMs: number): number {
	return rows.filter((row) => {
		const timestamp = Date.parse(row.published_at);
		return row.type === type && Number.isFinite(timestamp) && timestamp >= startMs && timestamp < endMs;
	}).length;
}

function rangeMetrics(interactions: InteractionRow[], events: EventRow[], nowMs: number): Record<AnalyticsRange, AnalyticsRangeMetrics> {
	const ranges = {} as Record<AnalyticsRange, AnalyticsRangeMetrics>;
	for (const range of Object.keys(rangeDays) as AnalyticsRange[]) {
		const durationMs = rangeDays[range] * 86_400_000;
		const currentStart = nowMs - durationMs;
		const previousStart = currentStart - durationMs;
		const current = {
			views: countInteractions(interactions, 'human_view', currentStart, nowMs),
			returnVisits: countInteractions(interactions, 'return_visit', currentStart, nowMs),
			followerGains: countInteractions(interactions, 'follow', currentStart, nowMs),
			linkClicks: countInteractions(interactions, 'clickout_nonbounce', currentStart, nowMs),
			feedbackFiled: countInteractions(interactions, 'feedback_filed', currentStart, nowMs),
			feedbackMoved: countEvents(events, 'feedback_moved', currentStart, nowMs),
			assistantTraffic: interactions.filter((row) => (row.kind === 'agent_fetch' || row.kind === 'agent_citation') && Number.isFinite(Date.parse(row.created_at)) && Date.parse(row.created_at) >= currentStart && Date.parse(row.created_at) < nowMs).length
		};
		const previous = {
			views: countInteractions(interactions, 'human_view', previousStart, currentStart),
			returnVisits: countInteractions(interactions, 'return_visit', previousStart, currentStart),
			followerGains: countInteractions(interactions, 'follow', previousStart, currentStart),
			linkClicks: countInteractions(interactions, 'clickout_nonbounce', previousStart, currentStart),
			feedbackFiled: countInteractions(interactions, 'feedback_filed', previousStart, currentStart),
			feedbackMoved: countEvents(events, 'feedback_moved', previousStart, currentStart),
			assistantTraffic: interactions.filter((row) => (row.kind === 'agent_fetch' || row.kind === 'agent_citation') && Number.isFinite(Date.parse(row.created_at)) && Date.parse(row.created_at) >= previousStart && Date.parse(row.created_at) < currentStart).length
		};
		const bucketDuration = durationMs / rangeBucketCounts[range];
		const buckets = Array.from({ length: rangeBucketCounts[range] }, (_, index) => ({
			startAt: new Date(currentStart + index * bucketDuration).toISOString(),
			views: 0,
			agentViews: 0,
			returnVisits: 0,
			followerGains: 0,
			linkClicks: 0,
			feedbackFiled: 0,
			feedbackMoved: 0,
			assistantTraffic: 0
		}));
		const bucketIndex = (timestamp: number) => Math.min(rangeBucketCounts[range] - 1, Math.max(0, Math.floor((timestamp - currentStart) / bucketDuration)));
		for (const row of interactions) {
			const timestamp = Date.parse(row.created_at);
			if (!Number.isFinite(timestamp) || timestamp < currentStart || timestamp >= nowMs) continue;
			const bucket = buckets[bucketIndex(timestamp)];
			if (row.kind === 'human_view') bucket.views += 1;
			if (row.kind === 'agent_fetch' || row.kind === 'agent_citation') { bucket.agentViews += 1; bucket.assistantTraffic += 1; }
			if (row.kind === 'return_visit') bucket.returnVisits += 1;
			if (row.kind === 'follow') bucket.followerGains += 1;
			if (row.kind === 'clickout_nonbounce') bucket.linkClicks += 1;
			if (row.kind === 'feedback_filed') bucket.feedbackFiled += 1;
		}
		for (const event of events) {
			const timestamp = Date.parse(event.published_at);
			if (event.type === 'feedback_moved' && Number.isFinite(timestamp) && timestamp >= currentStart && timestamp < nowMs) buckets[bucketIndex(timestamp)].feedbackMoved += 1;
		}
		ranges[range] = {
			...current,
			previousViews: previous.views,
			previousReturnVisits: previous.returnVisits,
			previousFollowerGains: previous.followerGains,
			previousLinkClicks: previous.linkClicks,
			previousFeedbackFiled: previous.feedbackFiled,
			previousFeedbackMoved: previous.feedbackMoved,
			previousAssistantTraffic: previous.assistantTraffic,
			buckets
		};
	}
	return ranges;
}

function latestShippedAt(product: ProductRow, events: EventRow[]): string | null {
	const eventDate = events
		.filter((event) => shippedEventTypes.has(event.type))
		.map((event) => event.published_at)
		.sort((a, b) => Date.parse(b) - Date.parse(a))[0];
	return product.last_shipped_at ?? eventDate ?? product.launched_at ?? null;
}

function countBetween(rows: InteractionRow[], kind: string, start: string, end: string): number {
	const startMs = Date.parse(start);
	const endMs = Date.parse(end);
	return rows.filter((row) => row.kind === kind && Date.parse(row.created_at) >= startMs && Date.parse(row.created_at) <= endMs).length;
}

export async function fetchMakerAnalytics(userId: string): Promise<MakerAnalytics> {
	if (!supabase) throw new Error('Service is temporarily unavailable');

	try {
		const { data: productRows, error: productsError } = await supabase
			.from('products')
			.select('id, tenant_id, name, slug, category, live_url, follow_count, created_at, launched_at, last_shipped_at, docs_nonempty, roadmap_or_feedback_nonempty, status_page_nonempty')
			.eq('maker_id', userId)
			.is('deleted_at', null)
			.order('created_at', { ascending: true });
		if (productsError) throw productsError;

	const products = (productRows ?? []) as ProductRow[];
	if (products.length === 0) {
		const [followingResult, incidentsResult] = await Promise.all([
			supabase.from('follows').select('product_id', { count: 'exact', head: true }).eq('user_id', userId),
			supabase.from('incidents').select('status, started_at, resolved_at').eq('created_by', userId)
		]);
		if (followingResult.error) throw followingResult.error;
		if (incidentsResult.error) throw incidentsResult.error;
		const empty = emptyAnalytics();
		empty.metrics.following = followingResult.count ?? 0;
		const incidents = (incidentsResult.data ?? []) as IncidentRow[];
		applyIncidentMetrics(empty.metrics, incidents);
		return empty;
	}

	const productIds = products.map((product) => product.id);
	const tenantIds = [...new Set(products.map((product) => product.tenant_id).filter(Boolean))];
	const [eventsResult, interactionsResult, boostsResult, followingResult, incidentsResult] = await Promise.all([
		supabase.from('events').select('id, product_id, type, title, published_at').in('product_id', productIds).is('deleted_at', null).order('published_at', { ascending: false }),
		supabase.from('product_interactions').select('product_id, event_id, kind, created_at').in('product_id', productIds).order('created_at', { ascending: false }),
		supabase.from('boosts').select('id, event_id, stake_gross, started_at, ends_at, status').eq('maker_id', userId).order('created_at', { ascending: false }),
		supabase.from('follows').select('product_id', { count: 'exact', head: true }).eq('user_id', userId),
		tenantIds.length > 0
			? supabase.from('incidents').select('status, started_at, resolved_at').in('tenant_id', tenantIds)
			: Promise.resolve({ data: [], error: null })
	]);
	if (eventsResult.error) throw eventsResult.error;
	if (interactionsResult.error) throw interactionsResult.error;
	if (boostsResult.error) throw boostsResult.error;
	if (followingResult.error) throw followingResult.error;
	if (incidentsResult.error) throw incidentsResult.error;

	const events = (eventsResult.data ?? []) as EventRow[];
	const interactions = (interactionsResult.data ?? []) as InteractionRow[];
	const boosts = (boostsResult.data ?? []) as BoostRow[];
	const incidents = (incidentsResult.data ?? []) as IncidentRow[];
	const eventById = new Map(events.map((event) => [event.id, event]));
	const productEvents = new Map<string, EventRow[]>();
	for (const event of events) productEvents.set(event.product_id, [...(productEvents.get(event.product_id) ?? []), event]);

	const productAnalytics = products.map((product) => {
		const shippedAt = latestShippedAt(product, productEvents.get(product.id) ?? []);
		return {
			id: product.id,
			name: product.name,
			slug: product.slug,
			category: product.category,
			followers: product.follow_count ?? 0,
			lastShippedAt: shippedAt,
			completeness: {
				docs: product.docs_nonempty,
				roadmap: product.roadmap_or_feedback_nonempty,
				status: product.status_page_nonempty,
				liveUrl: Boolean(product.live_url)
			}
		};
	});

	const shippedDates = productAnalytics.map((product) => product.lastShippedAt).filter((date): date is string => Boolean(date));
	const lastShippedAt = shippedDates.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
	const metrics = {
		views: interactions.filter((row) => row.kind === 'human_view').length,
		returnVisits: interactions.filter((row) => row.kind === 'return_visit').length,
		followers: productAnalytics.reduce((total, product) => total + product.followers, 0),
		following: followingResult.count ?? 0,
		linkClicks: interactions.filter((row) => row.kind === 'clickout_nonbounce').length,
		feedbackFiled: interactions.filter((row) => row.kind === 'feedback_filed').length,
		feedbackMoved: events.filter((event) => event.type === 'feedback_moved').length,
		assistantTraffic: interactions.filter((row) => row.kind === 'agent_fetch' || row.kind === 'agent_citation').length,
		incidents: 0,
		openIncidents: 0,
		resolvedIncidents: 0,
		incidentResolutionHours: null as number | null,
		daysSinceLastUpdate: lastShippedAt ? Math.max(0, Math.floor((Date.now() - Date.parse(lastShippedAt)) / 86_400_000)) : null,
		lastShippedAt
	};
	applyIncidentMetrics(metrics, incidents);
	const ranges = rangeMetrics(interactions, events, Date.now());

	const performance = boosts.map((boost) => {
		const event = eventById.get(boost.event_id);
		const scoped = interactions.filter((row) => row.event_id === boost.event_id || row.product_id === event?.product_id);
		return {
			id: boost.id,
			eventTitle: event?.title ?? 'Product boost',
			amountCents: boost.stake_gross,
			startedAt: boost.started_at,
			endsAt: boost.ends_at,
			status: boost.status,
			followersGained: countBetween(scoped, 'follow', boost.started_at, boost.ends_at),
			returnVisitsGained: countBetween(scoped, 'return_visit', boost.started_at, boost.ends_at),
			linkClicksGained: countBetween(scoped, 'clickout_nonbounce', boost.started_at, boost.ends_at)
		};
	});

	return {
		products: productAnalytics,
		metrics,
		completeness: {
			docs: productAnalytics.filter((product) => product.completeness.docs).length,
			roadmap: productAnalytics.filter((product) => product.completeness.roadmap).length,
			status: productAnalytics.filter((product) => product.completeness.status).length,
			liveUrl: productAnalytics.filter((product) => product.completeness.liveUrl).length,
			total: productAnalytics.length
		},
		ranges,
		activeBoost: performance.find((boost) => ['live', 'grace'].includes(boost.status) && Date.parse(boost.endsAt) > Date.now()) ?? null,
		boosts: performance
	};
	} catch (e) {
		console.warn('[analytics] DB missing or RLS, showing empty UI', e);
		return emptyAnalytics();
	}
}

function applyIncidentMetrics(metrics: MakerAnalytics['metrics'], incidents: IncidentRow[]) {
	const resolved = incidents.filter((incident) => incident.status.toLowerCase() === 'resolved');
	const durations = resolved
		.map((incident) => {
			if (!incident.started_at || !incident.resolved_at) return null;
			const duration = Date.parse(incident.resolved_at) - Date.parse(incident.started_at);
			return Number.isFinite(duration) && duration >= 0 ? duration / 3_600_000 : null;
		})
		.filter((duration): duration is number => duration !== null);
	metrics.incidents = incidents.length;
	metrics.resolvedIncidents = resolved.length;
	metrics.openIncidents = incidents.length - resolved.length;
	metrics.incidentResolutionHours = durations.length > 0 ? durations.reduce((total, duration) => total + duration, 0) / durations.length : null;
}
