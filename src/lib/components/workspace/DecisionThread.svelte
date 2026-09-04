<script lang="ts">
	import { ArrowRight, CheckCircle, Map } from 'reicon-svelte';
	import { Chip } from '$lib/components/ui';
	import type { DecisionThread } from '$lib/data/workspace';
	import RelationList from '$lib/components/workspace/RelationList.svelte';
	import StatusBadge from '$lib/components/workspace/StatusBadge.svelte';
	import VisibilityBadge from '$lib/components/workspace/VisibilityBadge.svelte';

	let {
		thread,
		compact = false
	}: {
		thread: DecisionThread;
		compact?: boolean;
	} = $props();

	const statusTone = $derived(thread.status === 'Shipped' ? 'success' : thread.status === 'In decision' ? 'accent' : 'warning');
	const statusLabel = $derived(thread.status === 'In decision' ? 'Choosing now' : thread.status);
</script>

<article class="overflow-hidden rounded-[22px] bg-[var(--pc-surface-2)] ring-1 ring-[var(--pc-border-strong)]/35">
	<div class="p-4 sm:p-5">
		<div class="flex flex-wrap items-center gap-2">
			<Chip size="xs" variant="accent">Product decision</Chip>
			<StatusBadge label={statusLabel} tone={statusTone} />
			<VisibilityBadge label={thread.visibility} />
			<span class="ml-auto text-[10px] text-[var(--pc-text-faint)]">Updated {thread.updatedAt}</span>
		</div>
		<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0">
				
				<h2 class="mt-1 max-w-[32ch] text-[20px] font-medium leading-tight tracking-tight sm:text-[23px]">{thread.title}</h2>
			</div>
			<div class="flex shrink-0 items-center gap-2 rounded-full bg-[var(--pc-surface)] px-2.5 py-1.5 text-[10px] text-[var(--pc-text-muted)]" title="This is how sure we are, based on the feedback attached to this decision.">
				<CheckCircle size={12} weight="Outline" class="text-[var(--pc-accent-light)]" aria-hidden="true" />
				How sure we are: {thread.confidence}
			</div>
		</div>

		<div class="mt-5 grid gap-4 sm:grid-cols-2">
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-text-faint)]">What people need</p>
				<p class="mt-1.5 text-[13px] leading-relaxed text-[var(--pc-text-muted)]">{thread.problem}</p>
			</div>
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-text-faint)]">What should improve</p>
				<p class="mt-1.5 text-[13px] leading-relaxed text-[var(--pc-text-muted)]">{thread.outcome}</p>
			</div>
		</div>

		{#if !compact}
			<div class="mt-6 border-t border-[var(--pc-border-strong)]/35 pt-5">
				<RelationList relations={thread.relations} />
			</div>
		{/if}

		<div class="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--pc-border-strong)]/35 pt-4">
			<a href={`/workspace/decisions/${thread.id}`} class="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--pc-text)] px-3.5 text-xs font-medium text-[var(--pc-bg)] transition-[opacity,transform] duration-150 hover:opacity-85 active:scale-[0.96]">Open product decision <ArrowRight size={13} weight="Outline" /></a>
			<a href={`/workspace/products/${thread.productSlug}`} class="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--pc-surface)] px-3.5 text-xs text-[var(--pc-text-muted)] transition-[background-color,color] duration-150 hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)]"><Map size={13} weight="Outline" /> Product overview</a>
		</div>
	</div>
</article>
