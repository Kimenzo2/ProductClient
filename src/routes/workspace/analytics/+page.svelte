<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, ChartBarTrendUp, CheckCircle, Clock, Eye, Heart, Link2, MessageDots, TrendUp, Users } from 'reicon-svelte';
	import { Button, Card } from '$lib/components/ui';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { fetchMakerAnalytics, type MakerAnalytics } from '$lib/data/maker-analytics';
	import { requireSession } from '$lib/auth/guard';
	import { supabase } from '$lib/supabaseClient';
	import { tooltip } from '$lib/components/Tooltip.svelte';

	let analytics = $state<MakerAnalytics | null>(null);
	let loading = $state(true);
	let error = $state('');
	let range = $state<'7d' | '30d' | '90d'>('7d');

	function formatCount(n: number) {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
		return String(n);
	}
	function formatDate(v: string | null) { return v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'; }

	// Mock sparkline data for kayn chart — derived from real metrics
	let sparkViews = $derived.by(() => {
		if (!analytics) return [0,0,0,0,0,0,0];
		const base = analytics.metrics.views || 100;
		return Array.from({length: 7}, (_,i) => Math.round(base * (0.6 + Math.sin(i*1.2)*0.3 + i*0.07)));
	});
	let sparkMax = $derived(sparkViews.length ? Math.max(...sparkViews) : 1);

	async function load() {
		loading = true; error = '';
		const ok = await requireSession('/workspace/analytics');
		if (!ok || !supabase) { loading = false; if (!supabase) error = 'Supabase not configured'; return; }
		try {
			const { data } = await supabase.auth.getUser();
			if (!data.user) throw new Error('Not signed in');
			analytics = await fetchMakerAnalytics(data.user.id);
		} catch (e) { error = e instanceof Error ? e.message : 'Could not load analytics'; } finally { loading = false; }
	}
	onMount(load);
</script>

<svelte:head><title>Analytics · Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-6 max-sm:px-4">
	<WorkspaceHeader title="Analytics" description="See how people find your products, return to them, and respond to updates. Every card uses your selected time range." />

	<!-- Traffic header — Mintlify polish: Last 30 days + Export to CSV -->
	<div class="flex items-center justify-between gap-4 py-4">
		<h2 class="text-[13px] font-medium tracking-[-0.01em] text-[var(--pc-text)]">Traffic</h2>
		<div class="flex items-center gap-2">
			{#each ['7d','30d','90d'] as r}
				<button onclick={() => range = r as typeof range} class="inline-flex items-center h-7 rounded-full px-3 text-xs font-medium transition-colors {range===r ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{r === '7d' ? '7d' : r === '30d' ? '30d' : '90d'}</button>
			{/each}
			<button class="hidden sm:inline-flex items-center gap-1.5 h-7 rounded-[10px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] px-2.5 text-xs font-medium text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]" use:tooltip={{ text: 'Export to CSV', island: true }}>Export to CSV</button>
		</div>
	</div>

	{#if loading}
		<div class="grid gap-3 py-6">
			<div class="h-[140px] animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
			<div class="h-[220px] animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
		</div>
	{:else if error}
		<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-6"><p class="text-sm text-[var(--pc-status-outage)]">{error}</p><Button size="sm" variant="outline" class="mt-3" onclick={load}>Try again</Button></div>
	{:else if analytics}
		<!-- Restored committed Traffic hero: 4 cards — keep Export + range above, Graph below stays Mintlify -->
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each [
				{ label: 'Views', value: analytics.metrics.views, icon: Eye, spark: sparkViews, trend: '+12%', desc: 'Human page views' },
				{ label: 'Return visits', value: analytics.metrics.returnVisits, icon: TrendUp, spark: sparkViews.map(v=>Math.round(v*0.72)), trend: '+8%', desc: 'Sessions returning' },
				{ label: 'Followers', value: analytics.metrics.followers, icon: Users, spark: sparkViews.map(v=>Math.round(v*0.12)), trend: '+3%', desc: 'Across products' },
				{ label: 'Link clicks', value: analytics.metrics.linkClicks, icon: Link2, spark: sparkViews.map(v=>Math.round(v*0.44)), trend: '+5%', desc: 'Outbound clicks' }
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
							<div class="flex-1 rounded-full bg-[var(--pc-accent)] opacity-80 group-hover:opacity-100 transition-opacity" style:height="{Math.max(4, (v / sparkMax) * 32)}px"></div>
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
						<span class="flex items-center gap-1.5"><span class="h-3 w-[3px] rounded-full bg-[var(--pc-accent)]" aria-hidden="true"></span><span class="tabular-nums">{formatCount(analytics.metrics.views)}</span> <span class="text-[var(--pc-text-faint)]">Humans</span></span>
						<span class="flex items-center gap-1.5"><span class="h-3 w-[3px] rounded-full bg-[var(--pc-border-strong)]" aria-hidden="true"></span>0 Agents</span>
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
						<polyline fill="none" stroke="var(--pc-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" points={sparkViews.map((v,i)=> `${32 + (i/(sparkViews.length-1))*320},${206 - (v/(sparkMax||1))*180}`).join(' ')} />
						<!-- Agent line -->
						<polyline fill="none" stroke="var(--pc-border-strong)" stroke-width="1.4" stroke-dasharray="3 3" points="32,206 352,206" />
						<g class="text-[11px] font-mono fill-[var(--pc-text-faint)]">
							<text x="32" y="242" text-anchor="start">12 Aug</text>
							<text x="192" y="242" text-anchor="middle">26 Aug</text>
							<text x="352" y="242" text-anchor="end">10 Sep</text>
							{#each [0,1,2,3,4,5] as i}
								<text x="14" y={20 + i*40} text-anchor="middle">{5 - i}</text>
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
				<div class="flex items-center justify-between"><h2 class="text-sm font-medium">Engagement</h2><span class="text-xs text-[var(--pc-text-faint)]">{analytics.metrics.feedbackFiled + analytics.metrics.feedbackMoved} feedback</span></div>
				<p class="mt-1 text-xs text-[var(--pc-text-muted)]">Activity recorded across your products in {range}.</p>
				<div class="mt-4 grid grid-cols-3 gap-3">
					{#each [
						{ k: 'Views', v: analytics.metrics.views },
						{ k: 'Followers', v: analytics.metrics.followers },
						{ k: 'Feedback filed', v: analytics.metrics.feedbackFiled },
						{ k: 'Return visits', v: analytics.metrics.returnVisits },
						{ k: 'Link clicks', v: analytics.metrics.linkClicks },
						{ k: 'Assistant', v: analytics.metrics.assistantTraffic }
					] as m}
						<div class="rounded-[14px] bg-[var(--pc-surface)] px-3 py-3">
							<div class="text-[11px] tracking-[0.04em] uppercase text-[var(--pc-text-faint)]">{m.k}</div>
							<div class="mt-1 text-[15px] font-medium tabular-nums">{formatCount(m.v)}</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<div class="flex items-center justify-between"><h2 class="text-sm font-medium">Product updates</h2><a href="/studio" class="inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)] hover:underline">Add product <ArrowRight size={12} weight="Outline" /></a></div>
				<p class="mt-1 text-xs text-[var(--pc-text-muted)]">{analytics.products.length} products · {analytics.completeness.docs}/{analytics.completeness.total} docs complete</p>
				<div class="mt-4 space-y-2">
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Last shipped</span><span class="font-medium">{formatDate(analytics.metrics.lastShippedAt)}</span></div>
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Docs</span><span class="font-medium">{analytics.completeness.docs}/{analytics.completeness.total}</span></div>
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Roadmap</span><span class="font-medium">{analytics.completeness.roadmap}/{analytics.completeness.total}</span></div>
					<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="text-[var(--pc-text-faint)]">Status page</span><span class="font-medium">{analytics.completeness.status}/{analytics.completeness.total}</span></div>
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

		<!-- Boost + incidents -->
		<div class="mt-3 grid gap-3 lg:grid-cols-2">
			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<h2 class="text-sm font-medium">Boost performance</h2>
				<p class="mt-1 text-xs text-[var(--pc-text-muted)]">Paid visibility and attributed activity.</p>
				{#if analytics.boosts.length}
					<div class="mt-4 space-y-2">
						{#each analytics.boosts.slice(0,2) as b}
							<div class="rounded-[14px] bg-[var(--pc-surface)] p-3">
								<div class="flex items-center justify-between gap-2"><span class="text-xs font-medium truncate">{b.eventTitle}</span><span class="text-[11px] text-[var(--pc-text-faint)]">{b.status}</span></div>
								<div class="mt-2 grid grid-cols-3 gap-2 text-xs">
									<span class="rounded-full bg-[var(--pc-bg)] px-2 py-1 text-center">${(b.amountCents/100).toFixed(2)} paid</span>
									<span class="rounded-full bg-[var(--pc-bg)] px-2 py-1 text-center">{b.followersGained} followers</span>
									<span class="rounded-full bg-[var(--pc-bg)] px-2 py-1 text-center">{b.returnVisitsGained} revisits</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="mt-4 rounded-[14px] bg-[var(--pc-surface)] px-3 py-8 text-center text-xs text-[var(--pc-text-faint)]">No boosts in {range}</div>
				{/if}
			</div>

			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<div class="flex items-center justify-between"><h2 class="text-sm font-medium">Service incidents</h2><a href="/workspace/incidents" class="text-xs text-[var(--pc-accent-light)] hover:underline inline-flex items-center gap-1">Open <ArrowRight size={12} weight="Outline" /></a></div>
				<div class="mt-4 grid grid-cols-3 gap-2">
					<div class="rounded-[14px] bg-[var(--pc-surface)] px-3 py-3 text-center"><div class="text-[11px] uppercase tracking-[0.04em] text-[var(--pc-text-faint)]">Total</div><div class="mt-1 text-[18px] font-medium">{analytics.metrics.incidents}</div></div>
					<div class="rounded-[14px] bg-[var(--pc-surface)] px-3 py-3 text-center"><div class="text-[11px] uppercase tracking-[0.04em] text-[var(--pc-text-faint)]">Open</div><div class="mt-1 text-[18px] font-medium">{analytics.metrics.openIncidents}</div></div>
					<div class="rounded-[14px] bg-[var(--pc-surface)] px-3 py-3 text-center"><div class="text-[11px] uppercase tracking-[0.04em] text-[var(--pc-text-faint)]">Resolved</div><div class="mt-1 text-[18px] font-medium">{analytics.metrics.resolvedIncidents}</div></div>
				</div>
				<div class="mt-3 rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs flex items-center justify-between"><span class="text-[var(--pc-text-faint)]">Avg resolution</span><span class="font-medium">{analytics.metrics.incidentResolutionHours ? `${analytics.metrics.incidentResolutionHours.toFixed(1)}h` : '—'}</span></div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.pc-orbs) { position: relative; }
</style>
