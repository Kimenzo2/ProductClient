<script lang="ts">
	import { page } from '$app/state';
	import { mockStates, makers, reviews, type StateType } from '$lib/data/mockStates';
	import StateCard from '$lib/components/video/StateCard.svelte';
	import ReviewsSection from '$lib/components/product/ReviewsSection.svelte';
	import { Verified, Globe, FileText, AlertTriangle, Star, ArrowUp } from 'reicon-svelte';

	let slug = $derived(page.params.slug);
	let active: StateType | 'all' = $state('all');
	let tab = $state<'updates' | 'changelog' | 'incidents' | 'reviews'>('updates');
	let following = $state(false);

	let productStates = $derived(mockStates.filter((s) => s.product.slug === slug));
	let displayStates = $derived(productStates.length ? productStates : mockStates.slice(0, 4));
	let product = $derived(displayStates[0]?.product ?? { name: slug, slug, avatar: '', verified: false });
	let maker = $derived(makers.find((m) => m.handle === displayStates[0]?.maker.handle));
	let filtered = $derived(displayStates.filter((s) => (active === 'all' ? true : s.type === active)));

	let uniqueProducts = $derived(
		[...new Map(mockStates.map((s) => [s.product.slug, s.product])).values()]
	);
	let similarProducts = $derived(
		uniqueProducts.filter((p) => p.slug !== slug && p.category === product.category).slice(0, 4)
	);

	let totalReads = $derived(
		displayStates.reduce((acc, s) => {
			const r = s.reads;
			if (r.includes('M')) return acc + parseFloat(r) * 1_000_000;
			if (r.includes('K')) return acc + parseFloat(r) * 1_000;
			return acc + (parseInt(r) || 0);
		}, 0)
	);
	function formatReads(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}
</script>

<svelte:head>
	<title>{product.name} — Product Client</title>
</svelte:head>

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">

	<!-- ─── Hero ─── -->
	<!-- Logo + name + meta — tight, left-aligned, no banner -->
	<header class="pt-8 pb-6 max-sm:pt-6 max-sm:pb-4">
		<div class="flex items-start gap-4">
			<!-- Logo — 64px, rounded, no border -->
			<div class="shrink-0 size-16 md:size-[72px] rounded-[18px] overflow-hidden bg-[var(--pc-surface-2)]">
				<img src={product.avatar} alt="{product.name} logo" class="w-full h-full object-contain p-2" />
			</div>

			<!-- Info block -->
			<div class="min-w-0 flex-1 pt-0.5">
				<!-- Title row -->
				<div class="flex items-center gap-2">
					<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">{product.name}</h1>
					{#if product.verified}
						<Verified size={16} weight="Outline" color="var(--color-blue-600)" />
					{/if}
				</div>

				<!-- Tagline -->
				{#if product.tagline}
					<p class="mt-1.5 text-[13px] leading-relaxed text-[var(--pc-text-muted)] opacity-40 max-w-[48ch]" style="text-wrap: pretty">{product.tagline}</p>
				{/if}

				<!-- Meta row — clean, single-line -->
				<div class="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--pc-text-muted)]">
					{#if product.category}
						<span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium" style:background="rgba(119, 152, 18, 0.15)" style:color="rgb(119, 152, 18)">{product.category}</span>
					{/if}
					{#each (product.tags ?? []).slice(0, 3) as tag}
						<span class="inline-flex items-center rounded-full bg-[var(--pc-surface-2)] px-2 py-0.5 text-[11px] text-[var(--pc-text-muted)] opacity-50">{tag}</span>
					{/each}
					<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
					<span class="opacity-50">{formatReads(totalReads)} reads</span>
					<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
					<span class="opacity-50">{displayStates.length} updates</span>
					{#if maker}
						<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
						<a href="/m/{maker.handle}" class="inline-flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
							<img src={maker.avatar} alt={maker.name} class="size-3.5 rounded-full object-cover" />
							{maker.name}
						</a>
					{/if}
				</div>

				<!-- Actions — pill buttons, no borders -->
				<div class="mt-3 flex flex-wrap items-center gap-1.5">
					<button
						onclick={() => (following = !following)}
						aria-pressed={following}
						class={[
							'rounded-full px-4 py-1.5 text-[13px] font-medium transition-[opacity] duration-150',
							following
								? 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)]'
								: 'bg-[var(--pc-text)] text-[var(--pc-bg)] hover:opacity-88'
						].join(' ')}
					>
						{following ? 'Following' : 'Follow'}
					</button>
					{#if product.website}
						<a href={product.website} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-3.5 py-1.5 text-[13px] hover:bg-[var(--pc-surface)] transition-colors">
							<Globe size={12} weight="Outline" class="opacity-50" /> Website
						</a>
					{/if}
					<a href="/badge/{slug}" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-3.5 py-1.5 text-[13px] hover:bg-[var(--pc-surface)] transition-colors">
						Badge
					</a>
				</div>
			</div>
		</div>
	</header>

	<!-- ─── Tabs ─── -->
	<nav class="flex items-center gap-1 overflow-x-auto scrollbar-none pb-3" role="tablist">
		{#each [
			{ id: 'updates', label: 'Updates', count: filtered.length },
			{ id: 'changelog', label: 'Changelog', count: filtered.filter((s) => s.type === 'changelog' || s.type === 'launch').length },
			{ id: 'incidents', label: 'Incidents', count: filtered.filter((s) => s.type === 'incident' || s.type === 'fix').length },
			{ id: 'reviews', label: 'Reviews' }
		] as t}
			<button
				onclick={() => { tab = t.id as typeof tab; active = 'all'; }}
				role="tab"
				aria-selected={tab === t.id}
				tabindex={tab === t.id ? 0 : -1}
				class={[
					'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150',
					tab === t.id
						? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-color)] shadow-[var(--tab-active-shadow)]'
						: 'bg-[var(--tab-bg)] text-[var(--tab-color)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--tab-hover-color)]'
				].join(' ')}
			>
				{t.label}
				{#if t.count !== undefined}
					<span class="text-[11px] opacity-40">{t.count}</span>
				{/if}
			</button>
		{/each}
	</nav>

	<!-- ─── Tab content ─── -->
	{#if tab === 'updates'}
		{#if filtered.length > 0}
			<div class="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pc-enter-stagger">
				{#each filtered as item (item.id)}
					<StateCard {item} />
				{/each}
			</div>
		{:else}
			<div class="py-16 flex flex-col items-center text-center pc-enter">
				<div class="size-10 rounded-full bg-[var(--pc-surface-2)] grid place-items-center">
					<ArrowUp size={16} weight="Outline" class="opacity-30" />
				</div>
				<p class="mt-3 text-sm font-medium">No updates yet</p>
				<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-40">Follow this product to get notified when they post.</p>
			</div>
		{/if}

		<!-- Similar -->
		{#if similarProducts.length > 0}
			<div class="mt-8 mb-4">
				<h2 class="text-[13px] font-medium text-[var(--pc-text-muted)] opacity-40 mb-2">More in {product.category}</h2>
				<div class="flex flex-wrap gap-1.5">
					{#each similarProducts as p}
						<a href="/p/{p.slug}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--pc-surface-2)] hover:bg-[var(--pc-surface)] transition-colors text-[13px]">
							<img src={p.avatar} alt="" class="size-4 rounded object-contain" />
							<span>{p.name}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

	{:else if tab === 'reviews'}
		<div class="py-2 max-w-[580px] pc-enter">
			<ReviewsSection {reviews} productSlug={slug} />
		</div>

	{:else if tab === 'changelog'}
		<div class="space-y-2 pc-enter-stagger">
			{#each filtered.filter((s) => s.type === 'changelog' || s.type === 'launch') as item}
				<a href="/update/{item.id}" class="flex gap-3 p-3 rounded-[14px] bg-[var(--pc-surface-2)] transition-[background-color] group">
					<img src={item.thumbnail} alt="" class="hidden md:block w-[100px] aspect-[4/3] rounded-[10px] object-cover shrink-0" role="presentation" />
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<span class="text-[11px] font-medium uppercase tracking-wide opacity-40" style:color={item.type === 'launch' ? 'var(--color-blue-600)' : undefined}>{item.type}</span>
							<span class="text-[11px] text-[var(--pc-text-faint)] opacity-25">·</span>
							<span class="text-[11px] text-[var(--pc-text-faint)] opacity-30">{item.postedAt}</span>
						</div>
						<h3 class="mt-1 text-[13px] font-medium leading-snug group-hover:text-[var(--pc-text)] transition-colors">{item.title}</h3>
						<p class="mt-0.5 text-[13px] text-[var(--pc-text-muted)] opacity-40 line-clamp-2">{item.description}</p>
					</div>
					<span class="shrink-0 text-[11px] text-[var(--pc-text-faint)] opacity-25 self-center">{item.reads}</span>
				</a>
			{/each}
			{#if filtered.filter((s) => s.type === 'changelog' || s.type === 'launch').length === 0}
				<div class="py-16 flex flex-col items-center text-center pc-enter">
					<div class="size-10 rounded-full bg-[var(--pc-surface-2)] grid place-items-center">
						<FileText size={16} weight="Outline" class="opacity-30" />
					</div>
					<p class="mt-3 text-sm font-medium">No changelogs</p>
					<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-40">Changelogs appear when this product ships updates.</p>
				</div>
			{/if}
		</div>

	{:else}
		<div class="space-y-2 pc-enter">
			<!-- Status banner -->
			<div class="flex items-center gap-2.5 py-2 px-3 rounded-[10px] bg-[var(--pc-surface-2)]">
				<span class="size-1.5 rounded-full animate-pulse shrink-0" style:background="var(--color-green-600)"></span>
				<p class="text-[13px] text-[var(--pc-text-muted)]">All systems operational</p>
			</div>

			{#each filtered.filter((s) => s.type === 'incident' || s.type === 'fix') as item}
				<div class="p-3 rounded-[14px] bg-[var(--pc-surface-2)]">
					<div class="flex items-center gap-2">
						<span class="inline-flex items-center gap-1.5">
							<span class="size-1.5 rounded-full" style:background={item.type === 'incident' ? 'var(--color-green-600)' : 'var(--color-green-600)'}></span>
							<span class="text-[11px] font-medium uppercase tracking-wide opacity-40">{item.type}</span>
						</span>
						<span class="text-[11px] text-[var(--pc-text-faint)] opacity-25">{item.postedAt}</span>
					</div>
					<h3 class="mt-1 text-[13px] font-medium">{item.title}</h3>
					<p class="mt-0.5 text-[13px] text-[var(--pc-text-muted)] opacity-40">{item.description}</p>
				</div>
			{/each}
			{#if filtered.filter((s) => s.type === 'incident' || s.type === 'fix').length === 0}
				<div class="py-16 flex flex-col items-center text-center pc-enter">
					<div class="size-10 rounded-full bg-[var(--pc-surface-2)] grid place-items-center">
						<AlertTriangle size={16} weight="Outline" class="opacity-30" />
					</div>
					<p class="mt-3 text-sm font-medium">No incidents</p>
					<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-40">This product has a clean track record.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
