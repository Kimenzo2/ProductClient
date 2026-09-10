<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight } from 'reicon-svelte';
	import { fetchDocsAnalytics, type DocsAnalytics } from '$lib/data/docs-analytics';
	import { requireSession } from '$lib/auth/guard';
	import { supabase } from '$lib/supabaseClient';
	import { analyticsRange } from '$lib/data/analytics-range.svelte';
	import { tooltip } from '$lib/components/Tooltip.svelte';

	let data = $state<DocsAnalytics | null>(null);
	let loading = $state(true);
	let error = $state('');
	let range = $derived(analyticsRange.value);

	async function load() {
		loading = true; error = '';
		const ok = await requireSession('/workspace/analytics/docs');
		if (!ok || !supabase) { loading = false; if (!supabase) error = 'Service is temporarily unavailable'; return; }
		try {
			const { data: u } = await supabase.auth.getUser();
			if (!u.user) throw new Error('Not signed in');
			data = await fetchDocsAnalytics(u.user.id, range);
		} catch (e) { error = e instanceof Error ? e.message : 'Could not load docs analytics'; } finally { loading = false; }
	}
	onMount(load);
	$effect(() => { void range; void load(); });
</script>

<svelte:head><title>Documentation Analytics · Product Client</title></svelte:head>

<div class="py-6">
	{#if loading}
		<div class="grid gap-3 py-2">
			<div class="h-[140px] animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
			<div class="h-[220px] animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
		</div>
	{:else if error}
		<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-6"><p class="text-sm text-[var(--pc-status-outage)]">{error}</p><button class="mt-3 inline-flex h-7 rounded-full bg-[var(--pc-surface-2)] px-3 text-xs" onclick={load}>Try again</button></div>
	{:else if data}
		<!-- Metrics — same kayn frames as Overview hero, not squeezed -->
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
			{#each [
				{ k: 'Views', v: data.metrics.views },
				{ k: 'Visitors', v: data.metrics.visitors },
				{ k: 'Searches', v: data.metrics.searches },
				{ k: 'No results', v: data.metrics.noResultQueries },
				{ k: 'Helpful yes', v: data.metrics.helpfulYes }
			] as m}
				<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-4">
					<div class="text-[11px] tracking-[0.04em] uppercase text-[var(--pc-text-faint)]">{m.k}</div>
					<div class="mt-2 text-[15px] font-medium tabular-nums">{m.v}</div>
				</div>
			{/each}
		</div>

		<div class="mt-6 grid gap-3 lg:grid-cols-3">
			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5 md:col-span-2">
				<h3 class="text-xs font-medium">Views over time</h3>
				<div class="mt-3 h-[180px] rounded-[12px] bg-[var(--pc-surface)] flex items-center justify-center text-xs text-[var(--pc-text-faint)]">Chart — views {range} (same chart lib as Overview)</div>
				<div class="mt-4 overflow-auto rounded-lg border border-[var(--pc-border-strong)]">
					<table class="w-full text-xs">
						<thead class="bg-[var(--pc-surface)] text-[var(--pc-text-faint)]"><tr><th class="px-3 py-2 text-left font-medium">Path</th><th class="px-3 py-2 text-right">Views</th><th class="px-3 py-2 text-right">Human/Assistant</th></tr></thead>
						<tbody>
							{#each data.topPages.slice(0,5) as row}
								<tr class="border-t border-[var(--pc-border-strong)]"><td class="px-3 py-2 font-mono text-[12px] truncate max-w-[28ch]">{row.path}</td><td class="px-3 py-2 text-right tabular-nums">{row.views}</td><td class="px-3 py-2 text-right tabular-nums">{row.humanViews}/{row.assistantViews}</td></tr>
							{:else}
								<tr><td colspan="3" class="px-3 py-6 text-center text-[var(--pc-text-faint)]">No pages yet</td></tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<h3 class="text-xs font-medium">Searches</h3>
				<p class="mt-1 text-xs text-[var(--pc-text-muted)]">Queries, hits, and no-result gaps.</p>
				<div class="mt-3 space-y-2 max-h-[220px] overflow-auto">
					{#each data.searches.slice(0,5) as s}
						<div class="rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 flex items-center justify-between gap-2"><span class="text-xs truncate">{s.query}</span><span class="text-xs tabular-nums text-[var(--pc-text-faint)]">{s.hits ? 'hit' : 'no hit'}</span></div>
					{:else}
						<div class="rounded-[12px] bg-[var(--pc-surface)] px-3 py-6 text-center text-xs text-[var(--pc-text-faint)]">No searches in {range}</div>
					{/each}
				</div>
				<div class="mt-4 rounded-[12px] bg-[var(--pc-surface)] p-3">
					<div class="text-[11px] uppercase tracking-[0.04em] text-[var(--pc-text-faint)]">Queries with no results — content gap</div>
					{#each data.noResultQueries.slice(0,3) as q}
						<div class="mt-2 text-xs font-medium">{q.query} <span class="text-[var(--pc-text-faint)]">· {q.count}×</span></div>
					{:else}
						<div class="mt-2 text-xs text-[var(--pc-text-faint)]">No gaps — all queries hit.</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="mt-6 grid gap-3 lg:grid-cols-2">
			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<h3 class="text-xs font-medium">API playground</h3>
				<div class="mt-3 grid grid-cols-2 gap-2">
					<div class="rounded-[12px] bg-[var(--pc-surface)] px-3 py-3 text-center"><div class="text-[11px] uppercase text-[var(--pc-text-faint)]">Runs</div><div class="mt-1 text-[16px] font-medium">{data.metrics.playgroundRuns}</div></div>
					<div class="rounded-[12px] bg-[var(--pc-surface)] px-3 py-3 text-center"><div class="text-[11px] uppercase text-[var(--pc-text-faint)]">Copies</div><div class="mt-1 text-[16px] font-medium">{data.metrics.codeCopies}</div></div>
				</div>
			</div>
			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<h3 class="text-xs font-medium">Stale docs</h3>
				<p class="mt-1 text-xs text-[var(--pc-text-muted)]">Pages not edited since last release.</p>
				<div class="mt-3 space-y-1 max-h-[180px] overflow-auto">
					{#each data.staleDocs.slice(0,5) as d}
						<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="truncate">{d.path}</span><span class="text-[var(--pc-text-faint)]">{d.lastEdited} → {d.lastRelease}</span></div>
					{:else}
						<div class="rounded-[12px] bg-[var(--pc-surface)] px-3 py-6 text-center text-xs text-[var(--pc-text-faint)]">No stale docs</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
