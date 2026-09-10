<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchStatusAnalytics, type StatusAnalytics } from '$lib/data/status-analytics';
	import { requireSession } from '$lib/auth/guard';
	import { supabase } from '$lib/supabaseClient';
	import { analyticsRange } from '$lib/data/analytics-range.svelte';
	let data = $state<StatusAnalytics | null>(null); let loading=$state(true); let error=$state(''); let range=$derived(analyticsRange.value);
	async function load(){ loading=true; error=''; const ok=await requireSession('/workspace/analytics/status'); if(!ok||!supabase){loading=false; return;} try{ const {data:u}=await supabase.auth.getUser(); if(!u.user) throw new Error('Not signed in'); data=await fetchStatusAnalytics(u.user.id, range);}catch(e){ error=e instanceof Error?e.message:'Load failed';} finally{loading=false;}}
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
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each [{k:'Views',v:data.metrics.views},{k:'Spike during incident',v:data.metrics.spike},{k:'Subscribers',v:data.metrics.subscribers}] as m}
				<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-4"><div class="text-[11px] tracking-[0.04em] uppercase text-[var(--pc-text-faint)]">{m.k}</div><div class="mt-2 text-[15px] font-medium tabular-nums">{m.v}</div></div>
			{/each}
		</div>
		<div class="mt-3 grid gap-3 lg:grid-cols-2">
			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<h3 class="text-xs font-medium">Views over time</h3>
				<div class="mt-3 h-[160px] rounded-[12px] bg-[var(--pc-surface)] flex items-center justify-center text-xs text-[var(--pc-text-faint)]">Chart — status views {range}</div>
			</div>
			<div class="rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
				<h3 class="text-xs font-medium">Current status</h3>
				<div class="mt-3 rounded-[12px] bg-[var(--pc-surface)] px-3 py-3 text-center"><span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-2.5 py-1 text-xs font-medium"><span class="size-2 rounded-full bg-[var(--pc-status-operational)]"></span>{data.currentStatus}</span></div>
				<div class="mt-3 text-xs text-[var(--pc-text-muted)]">Subscribers: {data.metrics.subscribers} · Live URL: {data.liveUrlStatus}</div>
			</div>
		</div>
	{/if}
</div>
