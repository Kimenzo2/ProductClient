<script lang="ts">
	import { mockStates } from '$lib/data/mockStates';
	import { Search, Verified } from 'reicon-svelte';
	import { Avatar, StatePanel } from '$lib/components/ui';

	let q = $state('');
	let selectedCategory = $state('all');

	// Get unique products
	let allProducts = $derived(
		[...new Map(mockStates.map((s) => [s.product.slug, s.product])).values()]
	);

	let categories = $derived(
		['all', ...new Set(allProducts.map((p) => p.category).filter(Boolean))]
	);

	let filtered = $derived(
		allProducts.filter((p) => {
			const matchesSearch = q.trim()
				? (p.name + p.category + (p.tags?.join(' ') ?? '')).toLowerCase().includes(q.toLowerCase())
				: true;
			const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
			return matchesSearch && matchesCategory;
		})
	);

	// svelte-ignore state_referenced_locally
	let debouncedCount = $state(filtered.length);
	$effect(() => {
		// for a11y live region — debounce filter typing
		const len = filtered.length;
		q; selectedCategory;
		const id = setTimeout(() => (debouncedCount = len), 350);
		return () => clearTimeout(id);
	});

	// Get update count for each product
	function getUpdateCount(slug: string): number {
		return mockStates.filter((s) => s.product.slug === slug).length;
	}

	function getTotalReads(slug: string): string {
		const states = mockStates.filter((s) => s.product.slug === slug);
		const total = states.reduce((acc, s) => {
			const r = s.reads;
			if (r.includes('M')) return acc + parseFloat(r) * 1_000_000;
			if (r.includes('K')) return acc + parseFloat(r) * 1_000;
			return acc + (parseInt(r) || 0);
		}, 0);
		if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1)}M`;
		if (total >= 1_000) return `${(total / 1_000).toFixed(1)}K`;
		return String(total);
	}
</script>

<svelte:head><title>Products — Product Client</title></svelte:head>

<div class="w-full max-w-[var(--pc-content-max)] mx-auto px-6 max-sm:px-4 ps-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))]">

	<!-- Header — 30px display > 15px body, 60ch measure, balance -->
	<header class="pt-10 pb-8 max-sm:pt-8 max-sm:pb-6">
		<h1 class="text-[24px] md:text-[30px] font-semibold leading-[1.05] tracking-[-0.032em] text-balance antialiased">Products</h1>
		<p class="mt-3 text-[14px] md:text-[15px] leading-[1.6] tracking-[-0.01em] text-[var(--pc-text-muted)] max-w-[60ch] text-pretty antialiased">Every product with a public page — ranked by launches, not algorithms.</p>
	</header>

	<!-- Search — 16px on mobile (no iOS zoom), label, 24px Clear hit, status live -->
	<div class="mb-6">
		<div class="flex items-center gap-3 rounded-full bg-[var(--pc-surface-2)] ps-3.5 pe-2 py-2.5 transition-[background-color] duration-150 focus-within:bg-[var(--pc-surface)] focus-within:ring-1 focus-within:ring-[var(--pc-border-strong)]">
			<label for="products-search" class="sr-only">Search products</label>
			<Search size={14} weight="Outline" class="text-[var(--pc-text-faint)] shrink-0" aria-hidden="true" />
			<input id="products-search" bind:value={q} type="search" autocomplete="off" placeholder="Search products..." aria-label="Search products" class="flex-1 min-w-0 bg-transparent text-base sm:text-sm outline-none placeholder:text-[var(--pc-text-faint)] antialiased" />
			{#if q}<button type="button" onclick={() => (q = '')} class="shrink-0 grid place-items-center min-h-6 min-w-6 rounded-full px-2.5 py-1 text-xs font-medium tracking-[-0.01em] text-[var(--pc-text-muted)] hover:text-[var(--pc-text)] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]">Clear</button>{/if}
		</div>
		<div class="sr-only" aria-live="polite" aria-atomic="true">{debouncedCount} products match current filters</div>
	</div>

	<!-- Categories — gap 12, mask peek 24px, snap, 44 touch-ish (h-9=36>24) -->
	<nav class="flex items-center gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-ps-6 pe-6 pb-2 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]" aria-label="Filter by category" role="group">
		{#each categories as cat (cat)}
			<button
				onclick={() => selectedCategory = cat ?? 'all'}
				aria-pressed={selectedCategory === (cat ?? 'all')}
				class={[
					'inline-flex items-center justify-center h-9 px-3.5 rounded-full text-[13px] font-medium leading-none tracking-[-0.01em] whitespace-nowrap snap-start shrink-0 transition-[background-color,color,transform] duration-150 active:scale-[0.96] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]',
					selectedCategory === (cat ?? 'all')
						? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-color)] shadow-[var(--tab-active-shadow)]'
						: 'bg-[var(--tab-bg)] text-[var(--tab-color)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--tab-hover-color)]'
				].join(' ')}
			>
				{cat === 'all' ? 'All' : cat}
			</button>
		{/each}
	</nav>

	<!-- Products grid — list semantics, tabular numbers, concentric 20=8+12, frameless icons -->
	{#if filtered.length === 0}
		<StatePanel icon={Search} title="No products found" description="Try a different search or category." actionLabel="Clear filters" onAction={() => { q = ''; selectedCategory = 'all'; }} class="pc-enter" />
	{:else}
		<ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 pc-enter-stagger list-none p-0 m-0" role="list" aria-label="Products">
			{#each filtered as product (product.slug)}
				<li role="listitem">
					<a href="/p/{product.slug}" class="flex items-center gap-3 p-3 rounded-[20px] bg-[var(--pc-surface-2)] transition-[background-color,border-color] duration-200 hover:bg-[var(--pc-surface)] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] group min-h-[72px]">
						<Avatar src={product.avatar} alt={product.name} size="lg" shape="square" class="!ring-0 ring-0 border-0" />
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<span class="text-[13px] font-semibold leading-[1.3] tracking-[-0.01em] truncate group-hover:text-[var(--pc-text)] transition-[color] duration-150">{product.name}</span>
								{#if product.verified}
									<Verified size={11} weight="Outline" color="var(--color-blue-600)" aria-hidden="true" />
								{/if}
							</div>
							<p class="text-xs leading-[1.4] tracking-[-0.01em] text-[var(--pc-text-muted)] truncate">{product.category}</p>
							<div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs leading-[1.4] tracking-[-0.01em] text-[var(--pc-text-faint)]">
								<span class="tabular-nums font-medium text-[var(--pc-text-muted)]">{getUpdateCount(product.slug)} updates</span>
								<span aria-hidden="true">·</span>
								<span class="tabular-nums">{getTotalReads(product.slug)} reads</span>
							</div>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		<p class="mt-6 text-center text-xs leading-[1.4] tracking-[-0.01em] text-[var(--pc-text-faint)] tabular-nums" role="status" aria-live="polite">
			{filtered.length} product{filtered.length !== 1 ? 's' : ''} — <span class="tabular-nums">{debouncedCount} shown</span>
		</p>
	{/if}
</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
