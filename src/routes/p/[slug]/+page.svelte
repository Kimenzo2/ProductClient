<script lang="ts">
	import { page } from '$app/state';
	import { mockStates, makers, reviews, type StateType } from '$lib/data/mockStates';
	import StateCard from '$lib/components/video/StateCard.svelte';
	import ReviewsSection from '$lib/components/product/ReviewsSection.svelte';
	import { Verified, Globe, FileText, AlertTriangle, Star, ArrowUp, ArrowRight, Map as MapIcon, Box } from 'reicon-svelte';
	import { Tabs } from 'bits-ui';
	import { Avatar, Badge, Button, Card, Chip, Separator, StatePanel, Toggle } from '$lib/components/ui';
	import { publicDocs, publicIncidents, publicProductStories, publicProofs, publicProducts } from '$lib/data/public';
	import { hostedStatusPage } from '$lib/config/tenant';

	let slug = $derived(page.params.slug);
	let active: StateType | 'all' = $state('all');
	let tab = $state<'updates' | 'changelog' | 'incidents' | 'reviews'>('updates');
	let following = $state(false);

	let productStates = $derived(mockStates.filter((s) => s.product.slug === slug));
	let displayStates = $derived(productStates);
	let productExists = $derived(publicProducts.some((p) => p.slug === slug));
	let product = $derived(displayStates[0]?.product ?? publicProducts.find((p) => p.slug === slug) ?? { name: slug, slug, avatar: '', verified: false });
	let maker = $derived(makers.find((m) => m.handle === displayStates[0]?.maker.handle));
	let filtered = $derived(displayStates.filter((s) => (active === 'all' ? true : s.type === active)));
	let publicDoc = $derived(publicDocs.find((doc) => doc.productSlug === slug));
	let productIncidents = $derived(publicIncidents.filter((incident) => incident.productSlug === slug));
	let hasProof = $derived(publicProofs.some((proof) => proof.productSlug === slug));
	let publicThread = $derived(publicProductStories.find((thread) => thread.productSlug === slug));

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
	<title>{product.name} | Product Client</title>
</svelte:head>

{#if !productExists}
	<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
		<StatePanel size="page" icon={Box} title="Product not found" description={`There is no public page for “${slug}”.`} actionLabel="Discover products" actionHref="/products" class="pc-enter" />
	</div>
{:else}
<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">

	<!-- ─── Hero ─── -->
	<!-- Logo + name + meta — tight, left-aligned, no banner -->
	<header class="pt-8 pb-6 max-sm:pt-6 max-sm:pb-4">
		<div class="flex items-start gap-4">
			<!-- Logo -->
			<div class="shrink-0">
				<Avatar src={product.avatar} alt="{product.name} logo" size="xl" shape="square" class="!size-16 md:!size-[72px] !rounded-[18px] !ring-0 ring-0 border-0" />
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
					<p class="mt-1.5 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)] text-pretty antialiased max-w-[48ch]" style="text-wrap: pretty">{product.tagline}</p>
				{/if}

				<!-- Meta row — clean, single-line -->
				<div class="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--pc-text-muted)]">
					{#if product.category}
						<Chip variant="accent" size="xs">{product.category}</Chip>
					{/if}
					{#each (product.tags ?? []).slice(0, 3) as tag, ti (ti)}
						<Chip size="xs">{tag}</Chip>
					{/each}
					<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
					<span class="opacity-50">{formatReads(totalReads)} reads</span>
					<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
					<span class="opacity-50">{displayStates.length} updates</span>
					<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
					<span class="opacity-50">{productIncidents.length} service problems</span>
					{#if maker}
						<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
						<a href="/m/{maker.handle}" class="inline-flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
							<Avatar src={maker.avatar} alt={maker.name} size="xs" />
							{maker.name}
						</a>
					{/if}
				</div>

				<!-- Actions — pill buttons, no borders -->
				<div class="mt-3 flex flex-wrap items-center gap-1.5">
				<Toggle bind:pressed={following} variant="default" size="md">
					{following ? 'Following' : 'Follow'}
				</Toggle>
					{#if product.website}
						<Button variant="outline" size="sm" href={product.website}>
							<Globe size={12} weight="Outline" class="opacity-50" /> Visit website
						</Button>
					{/if}
					<Button variant="outline" size="sm" href="/badge/{slug}">Embed badge</Button>
					<Button variant="outline" size="sm" href={hostedStatusPage.href} target="_blank"><AlertTriangle size={12} weight="Outline" class="opacity-50" /> Status</Button>
					{#if publicDoc}<Button variant="outline" size="sm" href={publicDoc.publicPath}><FileText size={12} weight="Outline" class="opacity-50" /> Docs</Button>{/if}
					{#if hasProof}<Button variant="outline" size="sm" href="/wall/{slug}-proof">Customer stories</Button>{/if}
				</div>
			</div>
		</div>
	</header>
	{#if productStates.length === 0}
		<Card padding="md" class="mb-5"><p class="text-sm font-medium">This product has not published an update yet.</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-65">The public page is ready for its first update, help page, and customer story.</p></Card>
	{/if}
	{#if publicThread}
		<section class="mb-5 rounded-[18px] bg-[var(--pc-surface-2)] p-4 ring-1 ring-[var(--pc-border-strong)]/30" aria-labelledby="product-thread-title">
			<div class="flex flex-wrap items-center gap-2"><Chip size="xs" variant="accent">Product story</Chip><span class="text-[10px] text-[var(--pc-text-faint)]">Updated {publicThread.updatedAt}</span></div>
			<div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div class="min-w-0"><h2 id="product-thread-title" class="text-[17px] font-medium tracking-tight">Why this work matters</h2><p class="mt-1 max-w-[64ch] text-[13px] leading-relaxed text-[var(--pc-text-muted)] opacity-75">{publicThread.outcome}</p></div><MapIcon size={18} weight="Outline" class="shrink-0 opacity-45" aria-hidden="true" /></div>
			<div class="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--pc-border-strong)]/25 pt-3">{#if productStates[0]}<a href={`/update/${productStates[0].id}`} class="inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Read the latest update <ArrowRight size={12} weight="Outline" aria-hidden="true" /></a>{/if}<a href="/feedback/new" class="text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">Share your feedback</a></div>
		</section>
	{/if}

	<!-- ─── Tabs ─── -->
	<Tabs.Root value={tab} onValueChange={(v) => { if (v) { tab = v as typeof tab; active = 'all'; } }} class="overflow-x-auto scrollbar-none pb-3">
		<Tabs.List class="flex items-center gap-1">
			<Tabs.Trigger value="updates" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
				Updates <span class="text-[11px] opacity-65">{filtered.length}</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="changelog" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
				Change log <span class="text-[11px] opacity-65">{filtered.filter((s) => s.type === 'changelog' || s.type === 'launch').length}</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="incidents" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
				Service problems <span class="text-[11px] opacity-65">{filtered.filter((s) => s.type === 'incident' || s.type === 'fix').length}</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="reviews" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
				Reviews
			</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>

	<!-- ─── Tab content ─── -->
	{#if tab === 'updates'}
		{#if filtered.length > 0}
			<div class="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pc-enter-stagger">
				{#each filtered as item (item.id)}
					<StateCard {item} />
				{/each}
			</div>
		{:else}
			<StatePanel icon={ArrowUp} title="No updates yet" description="Follow this product to get notified when they post." actionLabel={following ? 'Following' : 'Follow product'} onAction={() => (following = !following)} class="pc-enter" />
		{/if}

		<!-- Similar -->
		{#if similarProducts.length > 0}
			<div class="mt-8 mb-4">
				<h2 class="text-[13px] font-medium text-[var(--pc-text-muted)] opacity-65 mb-2">More in {product.category}</h2>
				<div class="flex flex-wrap gap-1.5">
					{#each similarProducts as p (p.slug)}
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
							<span class="text-[11px] font-medium uppercase tracking-wide opacity-65" style:color={item.type === 'launch' ? 'var(--color-blue-600)' : undefined}>{item.type}</span>
							<span class="text-[11px] text-[var(--pc-text-faint)] opacity-50">·</span>
							<span class="text-[11px] text-[var(--pc-text-faint)] opacity-55">{item.postedAt}</span>
						</div>
						<h3 class="mt-1 text-[13px] font-medium leading-snug group-hover:text-[var(--pc-text)] transition-colors">{item.title}</h3>
						<p class="mt-0.5 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)] text-pretty antialiased line-clamp-2">{item.description}</p>
					</div>
					<span class="shrink-0 text-[11px] text-[var(--pc-text-faint)] opacity-50 self-center">{item.reads}</span>
				</a>
			{/each}
			{#if filtered.filter((s) => s.type === 'changelog' || s.type === 'launch').length === 0}
				<StatePanel icon={FileText} title="No change log yet" description="Updates will appear here when this product changes." class="pc-enter" />
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
							<span class="text-[11px] font-medium uppercase tracking-wide opacity-65">{item.type}</span>
						</span>
						<span class="text-[11px] text-[var(--pc-text-faint)] opacity-50">{item.postedAt}</span>
					</div>
					<h3 class="mt-1 text-[13px] font-medium">{item.title}</h3>
					<p class="mt-0.5 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)] text-pretty antialiased">{item.description}</p>
				</div>
			{/each}
			{#if filtered.filter((s) => s.type === 'incident' || s.type === 'fix').length === 0}
				<StatePanel variant="success" icon={AlertTriangle} title="No service problems" description="This product has a clean track record." class="pc-enter" />
			{/if}
		</div>
	{/if}
</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
