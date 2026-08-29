<script lang="ts">
	import { AlertTriangle, Box, Compass, FileText, Heart, History, Inbox, Map, UserSquare } from 'reicon-svelte';
	import type { ThreadRelation } from '$lib/data/workspace';
	import type { SearchKind } from '$lib/search/types';

	let {
		relations = [],
		label = 'Related pages'
	}: {
		relations?: ThreadRelation[];
		label?: string;
	} = $props();

	const icons: Record<SearchKind, typeof Box> = {
		Product: Box,
		Decision: Compass,
		Problem: Compass,
		Release: History,
		Feedback: Inbox,
		Roadmap: Map,
		Doc: FileText,
		Incident: AlertTriangle,
		Proof: Heart,
		Maker: UserSquare
	};
</script>

<section aria-labelledby="relation-list-title">
	<div class="flex items-center justify-between gap-3">
		<h3 id="relation-list-title" class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-text-muted)]">{label}</h3>
		<span class="text-[10px] tabular-nums text-[var(--pc-text-faint)]">{relations.length} related</span>
	</div>
	<div class="mt-3 grid gap-2 sm:grid-cols-2">
		{#each relations as relation (relation.kind + relation.href)}
			{@const Icon = icons[relation.kind]}
			<a href={relation.href} class="group flex min-w-0 items-start gap-2.5 rounded-[14px] bg-[var(--pc-surface)] p-3 transition-[background-color,transform] duration-150 hover:bg-[var(--pc-surface-2)] active:scale-[0.99]">
				<span class="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)]"><Icon size={15} weight="Outline" aria-hidden="true" /></span>
				<span class="min-w-0 flex-1">
					<span class="flex items-center gap-2">
						<strong class="min-w-0 truncate text-xs font-medium group-hover:text-[var(--pc-accent-light)]">{relation.title}</strong>
						<span class="shrink-0 text-[9px] uppercase tracking-[0.12em] text-[var(--pc-text-faint)]">{relation.kind === 'Doc' ? 'Help' : relation.kind === 'Proof' ? 'Customer story' : relation.kind === 'Incident' ? 'Service problem' : relation.kind === 'Decision' ? 'Product decision' : relation.kind === 'Problem' ? 'Problem' : relation.kind}</span>
					</span>
					<span class="mt-1 block truncate text-[11px] text-[var(--pc-text-muted)] opacity-70">{relation.detail}</span>
				</span>
			</a>
		{/each}
	</div>
</section>
