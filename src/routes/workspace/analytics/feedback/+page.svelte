<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchFeedbackAnalytics, type FeedbackAnalytics } from '$lib/data/feedback-analytics';
	import { requireSession } from '$lib/auth/guard';
	import { supabase } from '$lib/supabaseClient';
	import { analyticsRange } from '$lib/data/analytics-range.svelte';
	let data = $state<FeedbackAnalytics | null>(null);
	let loading = $state(true); let error = $state(''); let range = $derived(analyticsRange.value);
	async function load(){ loading=true; error=''; const ok=await requireSession('/workspace/analytics/feedback'); if(!ok||!supabase){loading=false; return;} try{ const {data:u}=await supabase.auth.getUser(); if(!u.user) throw new Error('Not signed in'); data=await fetchFeedbackAnalytics(u.user.id, range);}catch(e){ error=e instanceof Error?e.message:'Load failed';} finally{loading=false;}}
	onMount(load); $effect(()=>{ void range; void load(); });
</script>

<div class="py-6">
	{#if loading}
		<div class="grid gap-3 py-2">
			<div class="h-[140px] animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
			<div class="h-[140px] animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
		</div>
	{:else if error}<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-6 text-sm text-[var(--pc-status-outage)]">{error}</div>
	{:else if data}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
			{#each [{k:'New requests',v:data.metrics.newRequests},{k:'Comments',v:data.metrics.comments},{k:'Shipped',v:data.metrics.shipped},{k:'Median age',v:data.metrics.medianAge ? `${data.metrics.medianAge}d` : '—'},{k:'Watchers',v:data.metrics.watchers}] as m}
				<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-4"><div class="text-[11px] tracking-[0.04em] uppercase text-[var(--pc-text-faint)]">{m.k}</div><div class="mt-2 text-[15px] font-medium tabular-nums">{m.v}</div></div>
			{/each}
		</div>
		<div class="mt-6 rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
			<h3 class="text-xs font-medium">By status</h3>
			<div class="mt-3 grid gap-2 sm:grid-cols-3">
				{#each data.byStatus as s}<div class="rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 flex items-center justify-between text-xs"><span>{s.status}</span><span class="font-medium">{s.count}</span></div>{:else}<div class="col-span-3 rounded-[12px] bg-[var(--pc-surface)] px-3 py-6 text-center text-xs text-[var(--pc-text-faint)]">No feedback yet</div>{/each}
			</div>
			<div class="mt-4 rounded-[12px] bg-[var(--pc-surface)] p-3 text-xs"><span class="text-[var(--pc-text-faint)]">Linked to release vs orphaned:</span> <span class="font-medium">{data.metrics.linked} linked / {data.metrics.orphaned} orphaned</span></div>
		</div>
	{/if}
</div>
