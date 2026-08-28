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
		item.views.includes('M')
			? Math.round(parseFloat(item.views) * 100)
			: item.views.includes('K')
				? Math.round(parseFloat(item.views))
				: parseInt(item.views) || rank * 7 + 3
	);

	// Tags from type –  style categories
	const tagMap: Record<string, string[]> = {
		launch: ['Product Hunt', 'Launch'],
		changelog: ['DevTool', 'Productivity'],
		incident: ['Incident', 'Infra'],
		fix: ['Bug Fix', 'DX'],
		event: ['Hackathon', 'Community']
	};
	let tags = $derived(tagMap[item.type] ?? ['Launch']);
</script>

<article class="group flex items-stretch gap-3 md:gap-4 rounded-[16px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-3 md:p-4 hover:border-[var(--pc-border-strong)] transition-colors duration-200 pc-enter">
	<!-- Rank –  left number -->
	<div class="hidden sm:flex flex-col items-center justify-center min-w-[36px] text-center">
		<span class="text-[11px] font-700 tracking-widest text-[var(--pc-text-faint)]">#{rank}</span>
		<span class="mt-1 size-6 rounded-full bg-[var(--pc-surface-2)] grid place-items-center text-[10px] font-700 text-[var(--pc-text-muted)] border border-[var(--pc-border)]">
			{rank}
		</span>
	</div>

	<!-- Logo –  clean 48px squircles -->
	<a href="/p/{item.product.slug}" class="shrink-0 self-start">
		<img
			src={item.product.avatar}
			alt={item.product.name}
			loading="lazy"
			class="size-12 md:size-[56px] rounded-[14px] object-cover border border-[var(--pc-border)] bg-[var(--pc-surface-2)] shadow-sm"
		/>
	</a>

	<!-- Middle –  name + tagline + meta -->
	<div class="min-w-0 flex-1 flex flex-col justify-center">
		<div class="flex items-start gap-2">
			<a href="/watch/{item.id}" class="min-w-0">
				<h3 class="text-[15px] md:text-[16px] font-700 leading-tight tracking-tight text-[var(--pc-text)] line-clamp-1">
					{item.product.name}
					<span class="font-400 text-[var(--pc-text-muted)]">— {item.title.split('–')[0]?.trim().slice(0, 48) ?? item.title.slice(0, 48)}</span>
				</h3>
			</a>
			{#if item.product.verified}
				<span class="shrink-0 mt-0.5"><Verified size={14} weight="Outline" color="var(--color-blue-600)" /></span>
			{/if}
			<span class="hidden md:inline-flex ml-1 rounded-full bg-[var(--pc-surface-2)] border border-[var(--pc-border)] px-2 py-0.5 text-[10px] font-700 tracking-wide uppercase text-[var(--pc-text-muted)]">
				{item.type}
			</span>
		</div>

		<p class="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-[var(--pc-text-muted)] text-pretty max-w-[60ch]">
			{item.description}
		</p>

		<!-- Tags + maker + comments –  bottom row -->
		<div class="mt-2.5 flex flex-wrap items-center gap-2">
			<div class="flex items-center gap-1.5">
				{#each tags as t}
					<span class="inline-flex items-center rounded-full bg-[var(--pc-surface-2)] border border-[var(--pc-border)] px-2.5 py-1 text-[11px] font-600 text-[var(--pc-text-muted)]">
						{t}
					</span>
				{/each}
				<span class="hidden sm:inline-flex items-center gap-1 text-[11px] text-[var(--pc-text-faint)]">
					<ChatRoundDots size={12} weight="Outline" /> 7
				</span>
			</div>

			<span class="hidden sm:flex items-center gap-1.5 ml-1">
				<img src={item.maker.avatar} alt={item.maker.name} class="size-5 rounded-full object-cover ring-1 ring-[var(--pc-border)]" />
				<span class="text-xs text-[var(--pc-text-muted)]">by {item.maker.name}</span>
				<span class="text-xs text-[var(--pc-text-faint)]">• {item.postedAt}</span>
			</span>

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
				'grid min-w-[56px] place-items-center gap-0.5 rounded-[12px] border px-2.5 py-2 text-center transition-all duration-150',
				upvoted
					? 'bg-[var(--pc-accent)] border-[var(--pc-accent)] text-white shadow-sm'
					: 'bg-[var(--pc-surface)] border-[var(--pc-border)] text-[var(--pc-text)] hover:border-[var(--pc-border-strong)] hover:bg-[var(--pc-surface-2)]'
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
