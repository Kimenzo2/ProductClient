<script lang="ts">
	import type { MockState } from '$lib/data/mockStates';
	import { ArrowUp, Verified, Share, Bookmark, ChatRoundDots } from 'reicon-svelte';

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

	// Derive upvote count from views string for demo: 2.4M -> 2400 etc
	let upvotes = $derived(
		item.reads.includes('M')
			? Math.round(parseFloat(item.reads) * 100)
			: item.reads.includes('K')
				? Math.round(parseFloat(item.reads))
				: parseInt(item.reads) || rank * 7 + 3
	);

	// Use real tags from mock data, fallback to type-based
	const fallbackTags: Record<string, string[]> = {
		launch: ['Launch'],
		changelog: ['Changelog'],
		incident: ['Incident'],
		fix: ['Bug Fix'],
		event: ['Event']
	};
	let tags = $derived(item.product.tags?.slice(0, 3) ?? fallbackTags[item.type] ?? ['Launch']);

	// Podium badge for ranks 1-3
	const podiumEmoji = ['', '🥇', '🥈', '🥉'];
	const podiumLabel = ['', 'Gold', 'Silver', 'Bronze'];
</script>

<article class="group flex items-stretch gap-3 md:gap-4 rounded-[20px] bg-[var(--pc-surface-2)] p-3 md:p-4 transition-[background-color] duration-200 pc-enter">
	<!-- Rank – podium badge for top 3 -->
	<div class="hidden sm:flex flex-col items-center justify-center min-w-[36px] text-center">
		{#if rank <= 3}
			<span class="text-[18px]" title="{podiumLabel[rank]} product">{podiumEmoji[rank]}</span>
			<span class="mt-0.5 text-[10px] font-700 tracking-wide uppercase" class:text-[var(--yellow-7)]={rank === 1} class:text-[var(--gray-400)]={rank === 2} class:text-[var(--orange-7)]={rank === 3}>{podiumLabel[rank]}</span>
		{:else}
			<span class="text-[11px] font-700 tracking-widest text-[var(--pc-text-faint)]">#{rank}</span>				<span class="mt-1 size-6 rounded-full bg-[var(--pc-surface)] grid place-items-center text-[10px] font-700 text-[var(--pc-text-muted)]">
				{rank}
			</span>
		{/if}
	</div>

	<!-- Logo –  clean 48px squircles -->
	<a href="/p/{item.product.slug}" class="shrink-0 self-start">
		<img
			src={item.product.avatar}
			alt={item.product.name}
			loading="lazy"
			class="size-12 md:size-[56px] rounded-[14px] object-cover bg-[var(--pc-surface)]"
		/>
	</a>

	<!-- Middle –  name + tagline + meta -->
	<div class="min-w-0 flex-1 flex flex-col justify-center">
		<div class="flex items-start gap-2">
			<a href="/update/{item.id}" class="min-w-0">
				<h3 class="text-sm md:text-base font-medium leading-tight tracking-tight text-[var(--pc-text)] line-clamp-1">
					{item.product.name}
					<span class="font-400 text-[var(--pc-text-muted)]">— {item.title.split('–')[0]?.trim().slice(0, 48) ?? item.title.slice(0, 48)}</span>
				</h3>
			</a>
			{#if item.product.verified}
				<span class="shrink-0 mt-0.5"><Verified size={14} weight="Outline" color="var(--color-blue-600)" /></span>
			{/if}
			<span class="hidden md:inline-flex ml-1 rounded-full bg-[var(--pc-surface)] px-2 py-0.5 text-[10px] font-700 tracking-wide uppercase text-[var(--pc-text-muted)]">
				{item.type}
			</span>
		</div>

		<p class="mt-1 line-clamp-2 text-sm leading-[1.5] text-[var(--pc-text-muted)] text-pretty max-w-[60ch]">
			{item.description}
		</p>				<!-- Tags + category – bottom row -->
				<div class="mt-2.5 flex flex-wrap items-center gap-2">
					<div class="flex items-center gap-1.5">
						{#if item.product.category}
							<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style:background="rgba(119, 152, 18, 0.15)" style:color="rgb(119, 152, 18)">
								{item.product.category}
							</span>
						{/if}
						{#each tags as t}
							<span class="inline-flex items-center rounded-full bg-[var(--pc-surface)] px-2.5 py-1 text-xs font-600 text-[var(--pc-text-muted)]">
								{t}
							</span>
						{/each}
						<span class="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--pc-text-faint)]">
							<ChatRoundDots size={12} weight="Outline" /> 7
						</span>
					</div>

		<a href="/m/{item.maker.handle}" class="hidden sm:flex items-center gap-1.5 ml-1 hover:opacity-80">				<img src={item.maker.avatar} alt={item.maker.name} class="size-5 rounded-full object-cover" />
			<span class="text-xs text-[var(--pc-text-muted)]">by {item.maker.name}</span>
			<span class="text-xs text-[var(--pc-text-faint)]">• {item.postedAt}</span>
		</a>

			<span class="sm:hidden text-xs text-[var(--pc-text-faint)]">{item.postedAt}</span>

			<div class="ml-auto hidden sm:flex items-center gap-1 text-xs text-[var(--pc-text-faint)]">
				<Share size={12} weight="Outline" /> website
				<span class="mx-1">•</span>
				<Bookmark size={12} weight="Outline" /> save
			</div>
		</div>
	</div>

	<!-- Right – Upvote (Product Hunt / ) -->
	<div class="shrink-0 flex flex-col items-center justify-center gap-1">
		<button
			onclick={() => onUpvote?.(item.id)}
			aria-label="Upvote {item.product.name}"
			aria-pressed={upvoted}
			class={[
				'grid min-w-[56px] place-items-center gap-0.5 rounded-[12px] px-2.5 py-2 text-center transition-[background-color] duration-150',
				upvoted
					? 'bg-[var(--pc-accent)] text-white'
					: 'bg-[var(--pc-surface)] text-[var(--pc-text)] hover:bg-[var(--pc-surface)]'
			].join(' ')}
		>
			<ArrowUp size={16} weight="Outline" />
			<span class="text-xs font-800 leading-none">{upvotes}</span>
		</button>
		<span class="text-[10px] font-600 tracking-wide uppercase text-[var(--pc-text-faint)]">{upvoted ? 'Upvoted' : 'Upvote'}</span>
	</div>
</article>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
