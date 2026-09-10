<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchIncidentsAnalytics, type IncidentsAnalytics } from '$lib/data/incidents-analytics';
	import { requireSession } from '$lib/auth/guard';
	import { supabase } from '$lib/supabaseClient';
	import { analyticsRange } from '$lib/data/analytics-range.svelte';
	let data = $state<IncidentsAnalytics | null>(null); let loading=$state(true); let error=$state(''); let range=$derived(analyticsRange.value);
	async function load(){ loading=true; error=''; const ok=await requireSession('/workspace/analytics/incidents'); if(!ok||!supabase){loading=false; return;} try{ const {data:u}=await supabase.auth.getUser(); if(!u.user) throw new Error('Not signed in'); data=await fetchIncidentsAnalytics(u.user.id, range);}catch(e){ error=e instanceof Error?e.message:'Load failed';} finally{loading=false;}}
	onMount(load); $effect(()=>{ void range; void load(); });
</script>
<div class="py-6 pt-2">
	{#if loading}<div class="h-[140px] animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
	{:else if error}<div class="rounded-[20px] border border-[var(--pc-border-strong)] p-6 text-sm text-[var(--pc-status-outage)]">{error}</div>
	{:else if data}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each [{k:'Open',v:data.metrics.open},{k:'Resolved',v:data.metrics.resolved},{k:'TTFU median',v:data.metrics.ttfu ?? '—'},{k:'TTR median',v:data.metrics.ttr ?? '—'}] as m}
				<div class="rounded-[14px] bg-[var(--pc-surface)] px-3 py-3"><div class="text-[11px] uppercase text-[var(--pc-text-faint)]">{m.k}</div><div class="mt-1 text-[15px] font-medium">{m.v}</div></div>
			{/each}
		</div>
		<div class="mt-6 rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
			<h3 class="text-xs font-medium">By severity</h3>
			<div class="mt-3 grid gap-2 sm:grid-cols-3">
				{#each data.bySeverity as s}<div class="rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 flex items-center justify-between text-xs"><span>{s.severity}</span><span class="font-medium">{s.count}</span></div>{:else}<div class="col-span-3 rounded-[12px] bg-[var(--pc-surface)] px-3 py-6 text-center text-xs text-[var(--pc-text-faint)]">No incidents in {range}</div>{/each}
			</div>
		</div>
		<div class="mt-3 rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-5">
			<h3 class="text-xs font-medium">Recent incidents</h3>
			<div class="mt-3 space-y-1">
				{#each data.recent.slice(0,5) as r}<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="truncate">{r.title}</span><span class="text-[var(--pc-text-faint)]">{r.severity} · {r.opened}</span></div>{:else}<div class="rounded-[12px] bg-[var(--pc-surface)] px-3 py-6 text-center text-xs text-[var(--pc-text-faint)]">No incidents</div>{/each}
			</div>
			<div class="mt-4 rounded-[12px] bg-[var(--pc-surface)] p-3 text-xs"><span class="text-[var(--pc-text-faint)]">Missing fix/doc:</span> <span class="font-medium">{data.missingFix} without fix, {data.missingDoc} without doc</span></div>
		</div>
	{/if}
</div>
