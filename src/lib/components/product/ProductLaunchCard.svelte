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
			: 'bg-[var(--pc-surface)] text-[var(--pc-text)] hover:bg-[var(--pc-surface-2)]'
	);
</script>

<Card variant="interactive" padding="md" class="group flex items-stretch gap-3 md:gap-4 pc-enter">
	<!-- Rank -->
	<div class="hidden sm:flex flex-col items-center justify-center min-w-[36px] text-center">
		{#if rank <= 3}
			<span class="grid size-7 place-items-center rounded-[9px] bg-[var(--pc-surface)] text-[13px] font-medium tabular-nums" title="{podiumLabel[rank]} product">{rank}</span>
			<span class="mt-0.5 text-[10px] font-medium tracking-wide uppercase text-[var(--pc-text-faint)]">{podiumLabel[rank]}</span>
		{:else}
			<Badge size="md">{rank}</Badge>
		{/if}
	</div>

	<!-- Logo -->
	<a href="/p/{item.product.slug}" class="shrink-0 self-start">
		<Avatar src={item.product.avatar} alt={item.product.name} size="lg" shape="square" />
	</a>

	<!-- Middle -->
	<div class="min-w-0 flex-1 flex flex-col justify-center">
		<!-- Title row -->
		<div class="flex items-start gap-2">
			<a href="/update/{item.id}" class="min-w-0">
				<h3 class="text-sm md:text-base font-medium leading-tight tracking-tight text-[var(--pc-text)] line-clamp-1">
					{item.product.name}
					<span class="font-normal text-[var(--pc-text-muted)]">— {item.title.split('–')[0]?.trim().slice(0, 48) ?? item.title.slice(0, 48)}</span>
				</h3>
			</a>
			{#if item.product.verified}
				<span class="shrink-0 mt-0.5"><Verified size={14} weight="Outline" color="var(--color-blue-600)" /></span>
			{/if}
			<Chip size="xs" class="hidden md:inline-flex">{item.type}</Chip>
		</div>

		<!-- Description -->
		<p class="mt-1 line-clamp-2 text-sm leading-[1.5] text-[var(--pc-text-muted)] text-pretty max-w-[60ch]">
			{item.description}
		</p>

		<!-- Tags + meta row -->
		<div class="mt-2.5 flex flex-wrap items-center gap-2">
			{#if item.product.category}
				<Chip variant="accent" size="sm">{item.product.category}</Chip>
			{/if}
			{#each tags as t, ti (ti)}
				<Chip size="sm">{t}</Chip>
			{/each}
		</div>

		<!-- Maker + timestamp -->
		<div class="mt-1.5 flex items-center gap-2 text-xs text-[var(--pc-text-faint)]">
			<a href="/m/{item.maker.handle}" class="hidden sm:inline-flex items-center gap-1.5 hover:opacity-80">
				<Avatar src={item.maker.avatar} alt={item.maker.name} size="xs" />
				<span class="text-[var(--pc-text-muted)]">by {item.maker.name}</span>
			</a>
			<span class="hidden sm:inline opacity-50">•</span>
			<span class="opacity-50">{item.postedAt}</span>
		</div>
	</div>

	<!-- Upvote -->
	<div class="shrink-0 flex flex-col items-center justify-center gap-1">
		<Button
			variant="ghost"
			size="sm"
			onclick={() => onUpvote?.(item.id)}
			class="grid min-w-[56px] place-items-center gap-0.5 rounded-[12px] px-2.5 py-2 {upvoteClass}"
		>
			<ArrowUp size={16} weight="Outline" />
			<span class="text-xs font-medium leading-none">{upvotes}</span>
		</Button>
		<span class="text-[10px] font-medium tracking-wide uppercase text-[var(--pc-text-faint)]">{upvoted ? 'Upvoted' : 'Upvote'}</span>
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
