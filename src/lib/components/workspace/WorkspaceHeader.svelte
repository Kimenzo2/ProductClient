<script lang="ts">
	import { Add } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';

	let {
		eyebrow = 'Workspace',
		title,
		description,
		actionLabel,
		actionHref = '/studio'
	}: {
		eyebrow?: string;
		title: string;
		description: string;
		actionLabel?: string;
		actionHref?: string;
	} = $props();
</script>

<header class="flex flex-col gap-4 border-b border-[var(--pc-border-strong)]/30 pb-5 pt-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pt-10">
	<div class="min-w-0">
		
		<h1 class="mt-1.5 text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-balance md:text-[21px]">{title}</h1>
		<p class="mt-2 max-w-[60ch] text-[13px] leading-[1.6] tracking-[-0.003em] text-[var(--pc-text-muted)] text-pretty opacity-75">{description}</p>
	</div>
	{#if actionLabel}
		<Button href={actionHref} variant="primary" size="md" class="shrink-0 self-start sm:self-auto"><Add size={15} weight="Outline" />{actionLabel}</Button>
	{/if}
</header>
