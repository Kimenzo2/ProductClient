<script lang="ts">
	import FilterChips from '$lib/components/video/FilterChips.svelte';
	import ProductLaunchCard from '$lib/components/product/ProductLaunchCard.svelte';
	import { mockStates, type StateType } from '$lib/data/mockStates';
	import { Search, Flame, Rocket, ArrowUp } from 'reicon-svelte';
	import { Button, Chip, StatePanel } from '$lib/components/ui';

	let active: StateType | 'all' = $state('all');
	let q = $state('');
	let upvoted = $state<Set<string>>(new Set());
	let visibleCount = $state(12);

	let matching = $derived(
		mockStates
			.filter((s) => {
				const byType = active === 'all' ? true : s.type === active;
				const byQ = q.trim()
					? (s.title + s.product.name + s.description).toLowerCase().includes(q.toLowerCase())
					: true;
				return byType && byQ;
			})
	);
	let visible = $derived(matching.slice(0, visibleCount));
	let debouncedCount = $state(mockStates.length);

	$effect(() => {
		// debounce live region — avoid spamming on every keystroke
		active; q; matching.length;
		const id = setTimeout(() => (debouncedCount = matching.length), 350);
		return () => clearTimeout(id);
	});

	function toggleUpvote(id: string) {
		const next = new Set(upvoted);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		upvoted = next;
	}

	const week = { label: 'Week 36, 2026', live: mockStates.length, upvotes: 189, products: mockStates.length };
</script>

<svelte:head>
	<title>Product Client — Launch. Rank on Google & AI.</title>
</svelte:head>

<div class="w-full max-w-[var(--pc-content-max)] mx-auto px-6 max-sm:px-4 ps-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))]">

	<!-- Header — hierarchy: 30px display → 13px meta → 15px body; wrapping, measure, tabular numbers fixed -->
	<header class="pt-10 pb-8 max-sm:pt-8 max-sm:pb-6">
		<div class="flex items-baseline gap-3 flex-wrap">
			<h1 class="text-[24px] md:text-[30px] font-semibold leading-[1.05] tracking-[-0.032em] text-balance antialiased">
				Top product launches this week
			</h1>
			<Chip variant="accent" size="xs" class="shrink-0 font-medium tracking-[-0.01em]">Live</Chip>
		</div>

		<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] leading-[1.4] text-[var(--pc-text-muted)]">
			<span class="inline-flex items-center gap-1.5">
				<Rocket size={13} weight="Outline" class="text-[var(--pc-text-faint)]" />
				<span class="tabular-nums">{week.label}</span>
			</span>
			<span class="text-[var(--pc-text-faint)]" aria-hidden="true">·</span>
			<span class="tabular-nums font-medium">{week.live} live</span>
			<span class="text-[var(--pc-text-faint)]" aria-hidden="true">·</span>
			<span class="inline-flex items-center gap-1">
				<ArrowUp size={12} weight="Outline" class="text-[var(--pc-text-faint)]" />
				<span class="tabular-nums font-medium">{week.upvotes}</span>
			</span>
			<span class="hidden md:inline text-[var(--pc-text-faint)]" aria-hidden="true">·</span>
			<span class="hidden md:inline text-[12px] tracking-[-0.01em]">SEO-ready pages · AI-readable listings</span>
		</div>

		<p class="mt-3 text-[14px] md:text-[15px] leading-[1.6] text-[var(--pc-text-muted)] max-w-[60ch] text-pretty antialiased">
			Launch your tool, get found on Google and in AI answers.
		</p>
	</header>

	<!-- Filter bar — keyboard: ToggleGroup handles roving tabindex, live region announces count -->
	<nav class="sticky top-[var(--pc-header-h)] z-20 -ms-6 -me-6 max-sm:-ms-4 max-sm:-me-4 ps-6 pe-6 max-sm:ps-4 max-sm:pe-4 pt-2 pb-4 bg-[var(--pc-bg)] border-b border-[var(--pc-border-strong)]/10" aria-label="Launch filters" style="padding-inline-start:max(1.5rem,env(safe-area-inset-left)); padding-inline-end:max(1.5rem,env(safe-area-inset-right));">
		<div class="sr-only" aria-live="polite" aria-atomic="true">{debouncedCount} launches match current filters</div>
		<div class="relative flex items-center gap-3 overflow-x-auto scrollbar-none [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]" role="group" aria-label="Filter launches by type">
			<FilterChips active={active} onSelect={(v) => { active = v; visibleCount = 12; }} />
			<span class="ms-auto hidden md:inline-flex items-center gap-1.5 text-xs text-[var(--pc-text-muted)] shrink-0 ps-3" aria-hidden="true">
				<Flame size={12} weight="Outline" aria-hidden="true" />
				<span aria-hidden="true">{matching.length}</span>
			</span>
		</div>

		<!-- Mobile search — native search, visible label for screen readers, 24px hit on Clear -->
		<div class="mt-3 flex md:hidden items-center gap-3 rounded-full bg-[var(--pc-surface-2)] ps-3.5 pe-2 py-2.5 focus-within:bg-[var(--pc-surface)] transition-[background-color] duration-150">
			<label for="feed-search-mobile" class="sr-only">Search launches</label>
			<Search size={14} weight="Outline" class="text-[var(--pc-text-faint)] shrink-0" aria-hidden="true" />
			<input id="feed-search-mobile" bind:value={q} type="search" autocomplete="off" placeholder="Search" aria-label="Search launches" class="flex-1 min-w-0 bg-transparent text-base sm:text-sm outline-none placeholder:text-[var(--pc-text-faint)] antialiased" />
			{#if q}<button type="button" onclick={() => (q = '')} class="shrink-0 grid place-items-center min-h-6 min-w-6 rounded-full px-2.5 py-1 text-xs font-medium text-[var(--pc-text-muted)] hover:text-[var(--pc-text)] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]">Clear</button>{/if}
		</div>
	</nav>

	<!-- Content grid — landmarks: feed is section not nested main, live region for filters -->
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 lg:gap-8 pt-6 items-start">

		<!-- Feed column — leading content -->
		<section class="min-w-0" aria-labelledby="feed-heading">
			<h2 id="feed-heading" class="sr-only">Launches this week</h2>

			{#if matching.length === 0}
				<StatePanel icon={Search} title="No launches match" description="Try a different filter or search term." actionLabel="Clear filters" onAction={() => { active = 'all'; q = ''; }} class="pc-enter" />
			{:else}
				<ul class="space-y-3 pc-enter-stagger list-none p-0 m-0" role="list" aria-label="Launches">
					{#each visible as item, i (item.id)}
						<li role="listitem"><ProductLaunchCard {item} rank={i + 1} upvoted={upvoted.has(item.id)} onUpvote={toggleUpvote} /></li>
					{/each}
				</ul>

				<div class="mt-8 flex flex-col items-center gap-3 px-4">
					<p class="text-xs leading-[1.4] text-[var(--pc-text-faint)] text-center tabular-nums" aria-live="polite">
						{matching.length - visible.length} more this week
					</p>
					{#if visible.length < matching.length}<Button variant="ghost" onclick={() => (visibleCount += 12)}>Load more</Button>{:else}<span class="text-xs leading-[1.4] tracking-[0.02em] text-[var(--pc-text-faint)]" role="status">You’re all caught up</span>{/if}
				</div>
			{/if}
		</section>

		<!-- Right sidebar — reserved space (sections removed per design, gap kept) -->
		<aside class="hidden lg:block w-[260px] h-fit sticky top-[calc(var(--pc-header-h)+16px+env(safe-area-inset-top))] self-start" aria-label="Discover sidebar" aria-hidden="true">
			<div class="min-h-[520px]"></div>
		</aside>
	</div>

</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
