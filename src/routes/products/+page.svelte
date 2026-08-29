<script lang="ts">
	import { mockStates } from '$lib/data/mockStates';
	import { Search, Verified } from 'reicon-svelte';
	import { Avatar, Button, Card, Chip, Input } from '$lib/components/ui';

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

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<!-- Header -->
	<header class="pt-10 pb-5 max-sm:pt-8 max-sm:pb-4">
		<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Products</h1>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-65">Browse every product listed on Product Client.</p>
	</header>

	<!-- Search -->
	<div class="mb-4">
		<div class="flex items-center gap-2 rounded-full bg-[var(--pc-surface-2)] px-3.5 py-2 transition-colors focus-within:bg-[var(--pc-surface)]">
			<Search size={14} weight="Outline" class="opacity-65" />
			<input bind:value={q} placeholder="Search products..." class="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--pc-text-faint)]" />
			{#if q}<button onclick={() => (q = '')} class="text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">Clear</button>{/if}
		</div>
	</div>

	<!-- Categories -->
	<div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-4">
		{#each categories as cat, ci (ci)}
			<button
				onclick={() => selectedCategory = cat ?? 'all'}
				class={[
					'h-8 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150 cursor-pointer',
					$state.snapshot(selectedCategory) === $state.snapshot(cat)
						? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-color)] shadow-[var(--tab-active-shadow)]'
						: 'bg-[var(--tab-bg)] text-[var(--tab-color)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--tab-hover-color)]'
				].join(' ')}
			>
				{cat === 'all' ? 'All' : cat}
			</button>
		{/each}
	</div>

	<!-- Products grid -->
	{#if filtered.length === 0}
		<Card padding="lg" class="py-16 flex flex-col items-center text-center pc-enter">
			<div class="mx-auto size-10 rounded-full bg-[var(--pc-surface)] grid place-items-center">
				<Search size={16} weight="Outline" class="opacity-65" />
			</div>
			<p class="mt-3 text-sm font-medium">No products found</p>
			<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-65">Try a different search or category.</p>
			<Button variant="ghost" class="mt-4" onclick={() => { q = ''; selectedCategory = 'all'; }}>Clear filters</Button>
		</Card>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pc-enter-stagger">
			{#each filtered as product (product.slug)}
				<a href="/p/{product.slug}" class="flex items-center gap-3 p-3 rounded-[14px] bg-[var(--pc-surface-2)] transition-[background-color] duration-200 hover:bg-[var(--pc-surface)] group">
					<Avatar src={product.avatar} alt={product.name} size="lg" shape="square" />
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5">
							<span class="text-[13px] font-medium truncate group-hover:text-[var(--pc-text)] transition-colors">{product.name}</span>
							{#if product.verified}
								<Verified size={11} weight="Outline" color="var(--color-blue-600)" />
							{/if}
						</div>
						<p class="text-[11px] text-[var(--pc-text-muted)] opacity-65 truncate">{product.category}</p>
						<div class="mt-1 flex items-center gap-2 text-[10px] text-[var(--pc-text-faint)] opacity-55">
							<span>{getUpdateCount(product.slug)} updates</span>
							<span>·</span>
							<span>{getTotalReads(product.slug)} reads</span>
						</div>
					</div>
				</a>
			{/each}
		</div>

		<p class="mt-6 text-center text-xs text-[var(--pc-text-faint)] opacity-55">
			{filtered.length} product{filtered.length !== 1 ? 's' : ''}
		</p>
	{/if}
</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
