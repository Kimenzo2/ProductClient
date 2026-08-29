<script lang="ts">
	import { Search, Verified, ArrowUp } from 'reicon-svelte';
	import { Avatar, Button, Card, Chip } from '$lib/components/ui';
	import { mockStates, makers } from '$lib/data/mockStates';

	let q = $state('');

	let results = $derived(
		q.trim().length > 0
			? {
				products: [...new Map(mockStates.map((s) => [s.product.slug, s.product])).values()]
					.filter((p) => (p.name + p.category + (p.tags?.join(' ') ?? '')).toLowerCase().includes(q.toLowerCase()))
					.slice(0, 5),
				makers: makers.filter((m) => (m.name + m.handle).toLowerCase().includes(q.toLowerCase())).slice(0, 3),
				launches: mockStates.filter((s) => (s.title + s.description).toLowerCase().includes(q.toLowerCase())).slice(0, 5)
			}
			: null
	);

	let hasResults = $derived(results && (results.products.length + results.makers.length + results.launches.length) > 0);
</script>

<svelte:head><title>Search — Product Client</title></svelte:head>

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<!-- Header -->
	<header class="pt-10 pb-5 max-sm:pt-8 max-sm:pb-4">
		<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Search</h1>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-65">Find products, makers, launches.</p>
	</header>

	<!-- Search input -->
	<div class="mb-8">
		<div class="flex items-center gap-3 rounded-full bg-[var(--pc-surface-2)] px-5 py-3.5 transition-colors focus-within:bg-[var(--pc-surface)]">
			<Search size={18} weight="Outline" class="opacity-55" />
			<input
				bind:value={q}
				placeholder="Try 'AI', 'DevTool', 'Figma'..."
				class="flex-1 bg-transparent text-base outline-none placeholder:text-[var(--pc-text-faint)]"
				autofocus
			/>
			{#if q}
				<button onclick={() => (q = '')} class="text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">Clear</button>
			{/if}
		</div>
	</div>

	<!-- Results -->
	{#if results}
		{#if !hasResults}
			<div class="py-16 flex flex-col items-center text-center pc-enter">
				<div class="mx-auto size-10 rounded-full bg-[var(--pc-surface-2)] grid place-items-center">
					<Search size={16} weight="Outline" class="opacity-55" />
				</div>
				<p class="mt-3 text-sm font-medium">No results for "{q}"</p>
				<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-65">Try a different search term.</p>
			</div>
		{:else}
			<!-- Products -->
			{#if results.products.length > 0}
				<div class="mb-6">
					<h2 class="text-[11px] font-medium uppercase tracking-wider text-[var(--pc-text-faint)] mb-2">Products</h2>
					<div class="space-y-1.5">
						{#each results.products as p (p.slug)}
							<a href="/p/{p.slug}" class="flex items-center gap-3 p-3 rounded-[14px] bg-[var(--pc-surface-2)] transition-[background-color] group">
								<img src={p.avatar} alt={p.name} class="size-10 rounded-[10px] object-cover" />
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-1.5">
										<span class="text-[13px] font-medium group-hover:text-[var(--pc-text)] transition-colors">{p.name}</span>
										{#if p.verified}<Verified size={11} weight="Outline" color="var(--color-blue-600)" />{/if}
									</div>
									<p class="text-[11px] text-[var(--pc-text-muted)] opacity-65 truncate">{p.category}</p>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Makers -->
			{#if results.makers.length > 0}
				<div class="mb-6">
					<h2 class="text-[11px] font-medium uppercase tracking-wider text-[var(--pc-text-faint)] mb-2">Makers</h2>
					<div class="space-y-1.5">
						{#each results.makers as m (m.handle)}
							<a href="/m/{m.handle}" class="flex items-center gap-3 p-3 rounded-[14px] bg-[var(--pc-surface-2)] transition-[background-color] group">
								<img src={m.avatar} alt={m.name} class="size-10 rounded-full object-cover" />
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-1.5">
										<span class="text-[13px] font-medium group-hover:text-[var(--pc-text)] transition-colors">{m.name}</span>
										{#if m.verified}<Verified size={11} weight="Outline" color="var(--color-blue-600)" />{/if}
									</div>
									<p class="text-[11px] text-[var(--pc-text-muted)] opacity-65">@{m.handle} · {m.products} products</p>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Launches -->
			{#if results.launches.length > 0}
				<div>
					<h2 class="text-[11px] font-medium uppercase tracking-wider text-[var(--pc-text-faint)] mb-2">Launches</h2>
					<div class="space-y-1.5">
						{#each results.launches as item (item.id)}
							<a href="/update/{item.id}" class="flex gap-3 p-3 rounded-[14px] bg-[var(--pc-surface-2)] transition-[background-color] group">
								<img src={item.thumbnail} alt="" class="hidden md:block w-[80px] aspect-[4/3] rounded-[10px] object-cover shrink-0" role="presentation" />
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="text-[11px] font-medium uppercase tracking-wide opacity-65" style:color={item.type === 'launch' ? 'var(--color-blue-600)' : undefined}>{item.type}</span>
										<span class="text-[11px] text-[var(--pc-text-faint)] opacity-50">·</span>
										<span class="text-[11px] text-[var(--pc-text-faint)] opacity-55">{item.postedAt}</span>
									</div>
									<h3 class="mt-1 text-[13px] font-medium leading-snug group-hover:text-[var(--pc-text)] transition-colors">{item.title}</h3>
									<p class="mt-0.5 text-[13px] text-[var(--pc-text-muted)] opacity-65 line-clamp-1">{item.description}</p>
								</div>
								<span class="shrink-0 text-[11px] text-[var(--pc-text-faint)] opacity-50 self-center">{item.reads}</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	{:else}
		<!-- Suggestions when empty -->
		<div class="text-center py-8">
			<p class="text-[13px] text-[var(--pc-text-muted)] opacity-50">Popular searches</p>
			<div class="mt-3 flex flex-wrap justify-center gap-2">
				{#each ['AI', 'Developer Tools', 'ChatGPT', 'Linear', 'Open Source', 'Design'] as tag, ti (ti)}
					<button onclick={() => (q = tag)} class="rounded-full bg-[var(--pc-surface-2)] px-3 py-1.5 text-[13px] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)] transition-colors">
						{tag}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
