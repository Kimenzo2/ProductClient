<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, ChartBarTrendUp, CheckCircle, Clock, Eye, Heart, Link2, MessageDots, TrendUp, Users } from 'reicon-svelte';
	import { Button, Card } from '$lib/components/ui';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { fetchMakerAnalytics, type BoostPerformance, type MakerAnalytics } from '$lib/data/maker-analytics';
	import { requireSession } from '$lib/auth/guard';
	import { supabase } from '$lib/supabaseClient';
	import { analyticsRange } from '$lib/data/analytics-range.svelte';

	let analytics = $state<MakerAnalytics | null>(null);
	let loading = $state(true);
	let error = $state('');
	let range = $derived(analyticsRange.value);
	let boostPreview = $state(false);

	function previewAnalytics(): MakerAnalytics {
		const now = Date.now();
		const boost: BoostPerformance = {
			id: 'preview-boost',
			eventTitle: 'Product launch boost',
			amountCents: 4900,
			startedAt: new Date(now - 3 * 86_400_000).toISOString(),
			endsAt: new Date(now + 4 * 86_400_000).toISOString(),
			status: 'live',
			followersGained: 18,
			returnVisitsGained: 74,
			linkClicksGained: 31
		};
		const rangeSnapshot = {
			views: 142,
			returnVisits: 74,
			followerGains: 18,
			linkClicks: 31,
			feedbackFiled: 6,
			feedbackMoved: 3,
			assistantTraffic: 12,
			previousViews: 118,
			previousReturnVisits: 61,
			previousFollowerGains: 12,
			previousLinkClicks: 26,
			previousFeedbackFiled: 4,
			previousFeedbackMoved: 2,
			previousAssistantTraffic: 9,
			buckets: [18, 24, 16, 29, 21, 17, 17].map((views, index) => ({ startAt: new Date(now - (6 - index) * 86_400_000).toISOString(), views, agentViews: [1, 2, 1, 3, 2, 1, 2][index], returnVisits: [8, 13, 9, 16, 12, 7, 9][index], followerGains: [2, 3, 1, 4, 3, 2, 3][index], linkClicks: [4, 5, 3, 8, 4, 3, 4][index], feedbackFiled: 1, feedbackMoved: index === 3 ? 1 : 0, assistantTraffic: [1, 2, 1, 3, 2, 1, 2][index] }))
		};
		return {
			products: [],
			metrics: { views: 0, returnVisits: 0, followers: 0, following: 0, linkClicks: 0, feedbackFiled: 0, feedbackMoved: 0, assistantTraffic: 0, incidents: 0, openIncidents: 0, resolvedIncidents: 0, incidentResolutionHours: null, daysSinceLastUpdate: null, lastShippedAt: null },
			completeness: { docs: 0, roadmap: 0, status: 0, liveUrl: 0, total: 0 },
			ranges: { '7d': rangeSnapshot, '30d': rangeSnapshot, '90d': rangeSnapshot },
			activeBoost: boost,
			boosts: [boost]
		};
	}

	function formatCount(n: number) {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
		return String(n);
	}
	function formatDate(v: string | null) { return v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'; }
	function formatAxisDate(v: string) { return new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
	function formatTrend(current: number, previous: number) {
		if (previous === 0) return current > 0 ? 'New' : '—';
		const change = Math.round(((current - previous) / previous) * 100);
		return `${change >= 0 ? '+' : ''}${change}%`;
	}
	function formatWindow(start: string, end: string) { return `${formatDate(start)} – ${formatDate(end)}`; }
	function formatRemaining(end: string) {
		const minutes = Math.max(0, Math.floor((Date.parse(end) - Date.now()) / 60_000));
		if (minutes < 60) return `${minutes}m remaining`;
		const hours = Math.floor(minutes / 60);
		return hours < 48 ? `${hours}h remaining` : `${Math.floor(hours / 24)}d remaining`;
	}
	function boostEfficiency(boost: MakerAnalytics['boosts'][number]) {
		const paid = boost.amountCents / 100;
		if (boost.followersGained > 0) return `${boost.followersGained} follower${boost.followersGained === 1 ? '' : 's'} / $${paid.toFixed(2)}`;
		const actions = boost.returnVisitsGained + boost.linkClicksGained;
		return actions > 0 ? `${actions} tracked actions / $${paid.toFixed(2)}` : 'No attributed activity';
	}

	// Mock sparkline data for kayn chart — derived from real metrics
	let sparkViews = $derived.by(() => {
		return analytics?.ranges[range].buckets.map((bucket) => bucket.views) ?? [];
	});
	let sparkAgents = $derived.by(() => analytics?.ranges[range].buckets.map((bucket) => bucket.agentViews) ?? []);
	let sparkMax = $derived(Math.max(...sparkViews, ...sparkAgents, 1));

	async function load() {
		loading = true; error = '';
		boostPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'boost';
		if (boostPreview) {
			analytics = previewAnalytics();
			loading = false;
			return;
		}
		const ok = await requireSession('/workspace/analytics');
		if (!ok || !supabase) { loading = false; if (!supabase) error = 'Service is temporarily unavailable'; return; }
		try {
			const { data } = await supabase.auth.getUser();
			if (!data.user) throw new Error('Not signed in');
			analytics = await fetchMakerAnalytics(data.user.id);
		} catch (e) { error = e instanceof Error ? e.message : 'Could not load analytics'; } finally { loading = false; }
	}
	onMount(load);
</script>

<svelte:head><title>Analytics · Product Client</title></svelte:head>

<div class="py-4">
	<WorkspaceHeader title="Analytics" description="See how people find your products, return to them, and respond to updates. Every card uses your selected time range." />
	{#if boostPreview}<div class="border-b border-[var(--pc-border-strong)] py-2 text-[11px] text-[var(--pc-text-faint)]" role="status">Development preview · sample Boost data only</div>{/if}

	{#if loading}
		<div class="grid gap-3 py-6">
			<div class="h-[140px] animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
			<div class="h-[220px] animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
		</div>
	{:else if error}
		<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-6"><p class="text-sm text-[var(--pc-status-outage)]">{error}</p><Button size="sm" variant="outline" class="mt-3" onclick={load}>Try again</Button></div>
	{:else if analytics}
		{@const period = analytics.ranges[range]}
		<!-- Restored committed Traffic hero: 4 cards — keep Export + range above, Graph below stays Mintlify -->
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each [
				{ label: 'Views', value: period.views, icon: Eye, spark: period.buckets.map(b => b.views), max: Math.max(...period.buckets.map(b => b.views), 1), trend: formatTrend(period.views, period.previousViews), desc: 'Human page views' },
				{ label: 'Return visits', value: period.returnVisits, icon: TrendUp, spark: period.buckets.map(b => b.returnVisits), max: Math.max(...period.buckets.map(b => b.returnVisits), 1), trend: formatTrend(period.returnVisits, period.previousReturnVisits), desc: 'Sessions returning' },
				{ label: 'Followers', value: analytics.metrics.followers, icon: Users, spark: period.buckets.map(b => b.followerGains), max: Math.max(...period.buckets.map(b => b.followerGains), 1), trend: period.followerGains ? `+${period.followerGains}` : '—', desc: 'Current total' },
				{ label: 'Link clicks', value: period.linkClicks, icon: Link2, spark: period.buckets.map(b => b.linkClicks), max: Math.max(...period.buckets.map(b => b.linkClicks), 1), trend: formatTrend(period.linkClicks, period.previousLinkClicks), desc: 'Outbound clicks' }
			] as card}
				{@const Icon = card.icon}
				<div class="group relative overflow-hidden rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-4 transition-colors hover:bg-[var(--pc-surface)]">
					<div class="flex items-center justify-between">
						<span class="flex items-center gap-1.5 text-xs font-medium tracking-[0.04em] uppercase text-[var(--pc-text-faint)]"><Icon size={12} weight="Outline" aria-hidden="true" />{card.label}</span>
						<span class="rounded-full bg-[var(--pc-accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--pc-accent)]">{card.trend}</span>
					</div>
					<div class="mt-2 flex items-baseline gap-2"><span class="text-[24px] font-medium tracking-tight">{formatCount(card.value)}</span><span class="text-xs text-[var(--pc-text-faint)]">{card.desc}</span></div>
					<div class="mt-3 flex items-end gap-1 h-[36px]">
						{#each card.spark as v}
							<div class="flex-1 rounded-full bg-[var(--pc-accent)] opacity-80 group-hover:opacity-100 transition-opacity" style:height="{Math.max(4, (v / card.max) * 32)}px"></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Views over time + Rankings — Mintlify chart grid -->
		<div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
			<div class="flex flex-col gap-4 rounded-xl border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] px-4 pt-5 pb-4 md:col-span-2">
				<div class="flex items-center justify-between gap-4">
					<h3 class="text-xs font-medium tracking-[-0.01em] text-[var(--pc-text)]">Views over time</h3>
					<div class="flex items-center gap-4 text-xs">
						<span class="flex items-center gap-1.5"><span class="h-3 w-[3px] rounded-full bg-[var(--pc-accent)]" aria-hidden="true"></span><span class="tabular-nums">{formatCount(period.views)}</span> <span class="text-[var(--pc-text-faint)]">Humans</span></span>
						<span class="flex items-center gap-1.5"><span class="h-3 w-[3px] rounded-full bg-[var(--pc-border-strong)]" aria-hidden="true"></span><span class="tabular-nums">{formatCount(sparkAgents.reduce((total, value) => total + value, 0))}</span> Agents</span>
					</div>
				</div>
				<div class="relative flex-1 min-h-[260px] w-full select-none">
					<svg viewBox="0 0 360 260" class="h-full w-full" role="img" aria-label="Views over time" preserveAspectRatio="none">
						<g stroke="var(--pc-border-strong)" opacity="0.5">
							{#each [0,1,2,3,4,5] as i}
								<line x1="32" x2="352" y1={16 + i*40} y2={16 + i*40} stroke-width="0.5" />
							{/each}
						</g>
						<line x1="32" x2="352" y1="216" y2="216" stroke="var(--pc-border-strong)" stroke-width="0.7" />
						<!-- Human line — now fills vertical 16→216 (200px) not 150px -->
						<polyline fill="none" stroke="var(--pc-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" points={sparkViews.length > 1 ? sparkViews.map((v,i)=> `${32 + (i/(sparkViews.length-1))*320},${206 - (v/(sparkMax||1))*180}`).join(' ') : '32,206'} />
						<!-- Agent line -->
						<polyline fill="none" stroke="var(--pc-border-strong)" stroke-width="1.4" stroke-dasharray="3 3" points={sparkAgents.length > 1 ? sparkAgents.map((v,i)=> `${32 + (i/(sparkAgents.length-1))*320},${206 - (v/(sparkMax||1))*180}`).join(' ') : '32,206'} />
						<g class="text-[11px] font-mono fill-[var(--pc-text-faint)]">
							<text x="32" y="242" text-anchor="start">{period.buckets.length ? formatAxisDate(period.buckets[0].startAt) : '—'}</text>
							<text x="192" y="242" text-anchor="middle">{period.buckets.length ? formatAxisDate(period.buckets[Math.floor(period.buckets.length / 2)].startAt) : '—'}</text>
							<text x="352" y="242" text-anchor="end">{period.buckets.length ? formatAxisDate(period.buckets[period.buckets.length - 1].startAt) : '—'}</text>
							{#each [0,1,2,3,4,5] as i}
								<text x="14" y={20 + i*40} text-anchor="middle">{formatCount(Math.round((sparkMax * (5 - i)) / 5))}</text>
							{/each}
						</g>
					</svg>
				</div>
			</div>
			<div class="flex flex-col overflow-hidden rounded-xl border border-[var(--pc-border-strong)] bg-[var(--pc-surface)] p-1">
				<div class="flex items-center justify-between px-3 py-2">
					<h3 class="text-xs font-medium text-[var(--pc-text-faint)]">Rankings</h3>
					<span class="text-[11px] text-[var(--pc-text-faint)]">Human views</span>
				</div>
				<div class="flex-1 overflow-auto rounded-lg bg-[var(--pc-bg)]">
					{#each analytics.products.slice(0,5) as p, idx}
						<div class="flex items-center gap-3 px-4 py-3 border-b border-[var(--pc-border-strong)] last:border-0">
							<span class="w-4 text-right font-mono text-xs text-[var(--pc-text-faint)]">{idx+1}</span>
							<span class="flex-1 truncate text-xs font-medium text-[var(--pc-text)]">{p.slug}</span>
							<span class="font-mono text-xs text-[var(--pc-text-muted)] tabular-nums">{p.followers}</span>
						</div>
					{:else}
						<div class="px-4 py-8 text-center text-xs text-[var(--pc-text-faint)]">No pages yet</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Second row: engagement + product updates -->
		<div class="mt-6 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<div class="flex items-center justify-between"><h2 class="text-sm font-medium">Engagement</h2><span class="text-xs text-[var(--pc-text-faint)]">{period.feedbackFiled + period.feedbackMoved} feedback</span></div>
				<p class="mt-1 text-xs text-[var(--pc-text-muted)]">Activity recorded across your products in {range}.</p>
				<div class="mt-4 grid grid-cols-3 gap-3">
					{#each [
						{ k: 'Views', v: period.views },
						{ k: 'Followers', v: analytics.metrics.followers },
						{ k: 'Feedback filed', v: period.feedbackFiled },
						{ k: 'Return visits', v: period.returnVisits },
						{ k: 'Link clicks', v: period.linkClicks },
						{ k: 'Feedback moved', v: period.feedbackMoved },
						{ k: 'Assistant traffic', v: period.assistantTraffic }
					] as m}
						<div class="rounded-[14px] bg-[var(--pc-surface)] px-3 py-3">
							<div class="text-[11px] tracking-[0.04em] uppercase text-[var(--pc-text-faint)]">{m.k}</div>
							<div class="mt-1 text-[15px] font-medium tabular-nums">{formatCount(m.v)}</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<div class="flex items-center justify-between"><h2 class="text-sm font-medium">Product updates</h2><a href="/submit" class="inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)] hover:underline">Add product <ArrowRight size={12} weight="Outline" /></a></div>
				<p class="mt-1 text-xs text-[var(--pc-text-muted)]">{analytics.products.length} products · {analytics.completeness.docs}/{analytics.completeness.total} docs complete</p>
				<div class="mt-4 space-y-2">
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Last shipped</span><span class="font-medium">{formatDate(analytics.metrics.lastShippedAt)}</span></div>
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Days since update</span><span class="font-medium">{analytics.metrics.daysSinceLastUpdate ?? '—'}</span></div>
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Docs</span><span class="font-medium">{analytics.completeness.docs}/{analytics.completeness.total}</span></div>
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Roadmap</span><span class="font-medium">{analytics.completeness.roadmap}/{analytics.completeness.total}</span></div>
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Status page</span><span class="font-medium">{analytics.completeness.status}/{analytics.completeness.total}</span></div>
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Live URL</span><span class="font-medium">{analytics.completeness.liveUrl}/{analytics.completeness.total}</span></div>
				</div>
				{#if analytics.products.length}
					<div class="mt-4 grid gap-2">
						{#each analytics.products.slice(0,3) as p}
							<div class="flex items-center gap-2 rounded-[12px] bg-[var(--pc-surface)] px-3 py-2">
								<span class="size-2 rounded-full bg-[var(--pc-accent)]" aria-hidden="true"></span>
								<span class="text-xs font-medium truncate">{p.name}</span>
								<span class="ml-auto text-xs text-[var(--pc-text-faint)]">{p.followers} · {formatDate(p.lastShippedAt)}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Boost performance -->
		<div class="mt-3">
			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<h2 class="text-sm font-medium">Boost performance</h2>
				<p class="mt-1 text-xs text-[var(--pc-text-muted)]">Paid visibility and attributed activity.</p>
				{#if analytics.activeBoost}<div class="mt-3 flex items-center justify-between rounded-[12px] bg-[var(--pc-accent-soft)] px-3 py-2 text-xs"><span class="font-medium text-[var(--pc-accent-light)]">Active boost</span><span class="text-[var(--pc-accent-light)]">Visibility remaining: {formatRemaining(analytics.activeBoost.endsAt)}</span></div>{/if}
				{#if analytics.boosts.length}
					<div class="mt-4 space-y-2">
						{#each analytics.boosts.slice(0,2) as b}
							<div class="rounded-[14px] bg-[var(--pc-surface)] p-3">
								<div class="flex min-w-0 items-center justify-between gap-2"><span class="min-w-0 flex-1 truncate text-xs font-medium">{b.eventTitle}</span><span class="shrink-0 text-[11px] text-[var(--pc-text-faint)]">{b.status}</span></div>
								<div class="mt-1 text-[11px] text-[var(--pc-text-faint)]">{formatWindow(b.startedAt, b.endsAt)}</div>
								<div class="mt-2 grid grid-cols-3 gap-2 text-xs">
									<span class="rounded-full bg-[var(--pc-bg)] px-2 py-1 text-center">${(b.amountCents/100).toFixed(2)} paid</span>
									<span class="rounded-full bg-[var(--pc-bg)] px-2 py-1 text-center">{b.followersGained} followers</span>
									<span class="rounded-full bg-[var(--pc-bg)] px-2 py-1 text-center">{b.returnVisitsGained} revisits</span>
								</div>
								<div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--pc-text-faint)]"><span>{b.linkClicksGained} link clicks</span><span>Efficiency: {boostEfficiency(b)}</span></div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="mt-4 rounded-[14px] bg-[var(--pc-surface)] px-3 py-8 text-center text-xs text-[var(--pc-text-faint)]">
						<p>No boosts in {range}</p>
						<p class="mx-auto mt-2 max-w-[46ch] text-[11px] leading-relaxed text-[var(--pc-text-faint)]">When a boost runs, this area shows its paid amount, window, followers, return visits, link clicks, and efficiency.</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.pc-orbs) { position: relative; }
</style>
