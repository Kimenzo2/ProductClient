<script lang="ts">
	import type { MockState } from '$lib/data/mockStates';
	import { ArrowUp, Verified } from 'reicon-svelte';
	import { Avatar, Badge, Button, Card, Chip } from '$lib/components/ui';

	let {
		item,
		rank,
		upvoted = false,
		onUpvote
	}: {
		item: MockState;
		rank: number;
		upvoted?: boolean;
		onUpvote?: (id: string) => void;
	} = $props();

	let upvotes = $derived(
		item.reads.includes('M')
			? Math.round(parseFloat(item.reads) * 100)
			: item.reads.includes('K')
				? Math.round(parseFloat(item.reads))
				: parseInt(item.reads) || rank * 7 + 3
	);

	const fallbackTags: Record<string, string[]> = {
		launch: ['Launch'],
		changelog: ['Changelog'],
		incident: ['Incident'],
		fix: ['Bug Fix'],
		event: ['Event']
	};
	let tags = $derived(item.product.tags?.slice(0, 3) ?? fallbackTags[item.type] ?? ['Launch']);

	const podiumLabel = ['', 'Gold', 'Silver', 'Bronze'];

	let upvoteClass = $derived(
		upvoted
			? 'bg-[var(--pc-accent)] text-white hover:bg-[var(--pc-accent-hover)]'
			: 'bg-[var(--pc-surface-raised)] text-[var(--pc-text)] border border-[var(--pc-border-strong)] hover:bg-[var(--pc-surface-2)]'
	);
</script>

<Card variant="interactive" padding="md" class="group flex items-stretch gap-3 md:gap-4 pc-enter antialiased">
	<!-- Rank — 13px semibold tabular, 11px label 0.08em (not 10px whisper) -->
	<div class="hidden sm:flex flex-col items-center justify-center min-w-[40px] text-center shrink-0">
		{#if rank <= 3}
			<span class="grid size-7 place-items-center rounded-[9px] bg-[var(--pc-surface)] text-[13px] font-semibold tracking-[-0.02em] leading-none tabular-nums" title="{podiumLabel[rank]} product">{rank}</span>
			<span class="mt-1 text-xs font-semibold tracking-[0.08em] uppercase leading-[1.1] text-[var(--pc-text-faint)]">{podiumLabel[rank]}</span>
		{:else}
			<Badge size="md" class="tabular-nums">{rank}</Badge>
		{/if}
	</div>

	<!-- Logo — frameless per industry: no border, 8px inner = 24 outer -16 pad, hairline only for light washout -->
	<a href="/p/{item.product.slug}" class="shrink-0 self-start rounded-[8px] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]">
		<Avatar src={item.product.avatar} alt={item.product.name} size="lg" shape="square" class="!ring-0 ring-0 border-0" />
	</a>

	<!-- Middle — hierarchy: 15px 600 product → 14px 400 title fragment; wrapping balanced, truncation with title -->
	<div class="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
		<!-- Title row — product name only (no dash fragment — header can't fit description) -->
		<div class="flex items-start gap-2 flex-wrap">
			<a href="/update/{item.id}" title={item.product.name} class="min-w-0 max-w-full focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] rounded">
				<h2 class="text-[14px] md:text-[15px] font-semibold leading-[1.25] tracking-[-0.017em] text-[var(--pc-text)] line-clamp-1 break-words [overflow-wrap:break-word]">
					{item.product.name}
				</h2>
			</a>
			{#if item.product.verified}
				<span class="shrink-0 mt-0.5" aria-hidden="true"><Verified size={14} weight="Outline" color="var(--color-blue-600)" /></span>
			{/if}
			<Chip size="xs" class="hidden md:inline-flex shrink-0 font-medium tracking-[-0.01em] whitespace-nowrap">{item.type}</Chip>
		</div>

		<!-- Description — 13→14px 1.6 line-height, 60ch cap, pretty wrap, at least 1.4 for 2 lines -->
		<p class="line-clamp-2 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)] text-pretty max-w-[60ch] break-words [overflow-wrap:break-word]">
			{item.description}
		</p>

		<!-- Tags — 12px 500 with -0.01 tracking, nowrap -->
		<div class="mt-1.5 flex flex-wrap items-center gap-2">
			{#if item.product.category}
				<Chip variant="accent" size="sm" class="font-medium tracking-[-0.01em] whitespace-nowrap">{item.product.category}</Chip>
			{/if}
			{#each tags as t, ti (ti)}
				<Chip size="sm" class="font-medium tracking-[-0.01em] whitespace-nowrap">{t}</Chip>
			{/each}
		</div>

		<!-- Maker + timestamp — solid tokens, no opacity stacking -->
		<div class="flex flex-wrap items-center gap-2 text-xs leading-[1.4] tracking-[-0.01em] text-[var(--pc-text-faint)]">
			<a href="/m/{item.maker.handle}" class="hidden sm:inline-flex items-center gap-1.5 text-[var(--pc-text-muted)] hover:text-[var(--pc-text)] transition-[color] duration-150 focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] rounded">
				<Avatar src={item.maker.avatar} alt={item.maker.name} size="xs" />
				<span class="font-medium tracking-[-0.01em]">by {item.maker.name}</span>
			</a>
			<span class="hidden sm:inline text-[var(--pc-text-faint)]" aria-hidden="true">•</span>
			<span class="tabular-nums text-[var(--pc-text-muted)]">{item.postedAt}</span>
		</div>
	</div>

	<!-- Upvote — 12px tabular, 11px label 0.06em not 10px -->
	<div class="shrink-0 flex flex-col items-center justify-center gap-1.5 self-center ps-1">
		<Button
			variant="ghost"
			size="sm"
			onclick={() => onUpvote?.(item.id)}
			aria-label="{upvoted ? 'Remove upvote for' : 'Upvote'} {item.product.name}"
			aria-pressed={upvoted}
			class="grid min-w-[60px] !h-auto min-h-11 place-items-center gap-0.5 rounded-[12px] px-3 py-2.5 {upvoteClass}"
		>
			<ArrowUp size={16} weight="Outline" aria-hidden="true" />
			<span class="text-xs font-semibold leading-none tracking-[-0.01em] tabular-nums">{upvotes}</span>
		</Button>
		<span class="text-xs font-semibold tracking-[0.06em] uppercase leading-[1.1] text-[var(--pc-text-faint)]">{upvoted ? 'Upvoted' : 'Upvote'}</span>
	</div>
</Card>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
