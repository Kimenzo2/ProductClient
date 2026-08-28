<script lang="ts">
	import VideoCard from '$lib/components/video/VideoCard.svelte';
	import FilterChips from '$lib/components/video/FilterChips.svelte';
	import { mockStates, type StateType } from '$lib/data/mockStates';
	import { Sort, Search, Play, Home, Video, Add, Users2, UserSquare } from 'reicon-svelte';

	let active: StateType | 'all' = $state('all');
	let q = $state('');

	let filtered = $derived(
		mockStates.filter((s) => {
			const byType = active === 'all' ? true : s.type === active;
			const byQ = q.trim()
				? (s.title + s.product.name + s.description).toLowerCase().includes(q.toLowerCase())
				: true;
			return byType && byQ;
		})
	);

	// Featured hero – first launch
	let hero = $derived(mockStates.find((s) => s.type === 'launch') ?? mockStates[0]);
</script>

<svelte:head>
	<title>Product Client — Follow products, not just people</title>
</svelte:head>

<div class="mx-auto max-w-[1920px]">
	<!-- Top bar: chips + meta -->
	<div class="sticky top-[var(--pc-header-h)] z-30 border-b border-[var(--pc-border)] bg-[var(--pc-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--pc-bg)]/80">
		<div class="flex items-center justify-between gap-4 px-3 md:px-4">
			<FilterChips active={active} onSelect={(v) => (active = v)} />
			<div class="hidden md:flex items-center gap-2 shrink-0">
				<span class="text-xs font-600 text-[var(--pc-text-muted)]">{filtered.length} updates</span>
				<span class="h-4 w-px bg-[var(--pc-border)]"></span>
				<button class="inline-flex items-center gap-1.5 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-3 py-1.5 text-xs font-600 hover:bg-[var(--pc-surface-2)]">
					<Sort size={14} weight="Outline" />
					Latest
				</button>
			</div>
		</div>
		<!-- search row visible on mobile -->
		<div class="px-3 pb-3 md:hidden">
			<div class="flex items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-3 py-2">
				<Search size={16} weight="Outline" />
				<input bind:value={q} placeholder="Search launches, fixes, incidents..." class="flex-1 bg-transparent text-sm outline-none" />
				{#if q}<button onclick={() => (q = '')} class="text-xs text-[var(--pc-text-muted)]">Clear</button>{/if}
			</div>
		</div>
	</div>

	<!-- Hero featured -->
	<div class="px-3 md:px-4 pt-4">
		<a href="/watch/{hero.id}" class="group relative overflow-hidden rounded-[16px] bg-[var(--pc-surface)] border border-[var(--pc-border)] grid md:grid-cols-[1.35fr_0.9fr] shadow-[var(--pc-shadow-card)]">
			<div class="relative aspect-video overflow-hidden bg-black">
				<img src={hero.thumbnail} alt={hero.title} class="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
				<span class="absolute left-3 top-3 rounded-full bg-[var(--red-6)] px-2.5 py-1 text-[11px] font-800 tracking-wide uppercase text-white">Featured Launch</span>
				<span class="absolute bottom-3 right-3 rounded-[8px] bg-black/80 px-2 py-1 text-xs font-600 text-white">{hero.duration}</span>
				<span class="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition bg-black/15">
					<span class="grid size-14 place-items-center rounded-full bg-white text-black shadow-xl">
						<Play size={22} weight="Outline" color="black" />
					</span>
				</span>
			</div>
			<div class="p-4 md:p-6 flex flex-col">
				<div class="flex items-center gap-2 text-xs">
					<img src={hero.product.avatar} alt={hero.product.name} class="size-6 rounded-full" />
					<span class="font-600">{hero.product.name}</span>
					<span class="text-[var(--pc-text-muted)]">• {hero.views} views • {hero.postedAt}</span>
				</div>
				<h1 class="mt-3 text-[20px] md:text-[22px] font-700 leading-tight tracking-tight line-clamp-3 group-hover:text-[var(--blue-7)] transition-colors">
					{hero.title}
				</h1>
				<p class="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--pc-text-muted)]">
					{hero.description}
				</p>
				<div class="mt-4 flex flex-wrap gap-2">
					<span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--red-6)] px-3 py-1 text-xs font-700 text-white">
						<span class="size-1.5 rounded-full bg-white animate-pulse"></span> Live & trending
					</span>
					<span class="inline-flex items-center rounded-full bg-[var(--pc-surface-2)] px-3 py-1 text-xs font-600">Changelog included</span>
					<span class="inline-flex items-center rounded-full bg-[var(--pc-surface-2)] px-3 py-1 text-xs font-600">Feedback open</span>
				</div>
				<div class="mt-auto flex items-center gap-3 pt-6">
					<button class="inline-flex items-center gap-2 rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)] px-5 py-2.5 text-sm font-700 hover:opacity-90 transition">
						<Play size={16} weight="Outline" color="currentColor" />
						Watch
					</button>
					<button class="inline-flex items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-5 py-2.5 text-sm font-600 hover:bg-[var(--pc-surface-2)]">
						Subscribe
					</button>
					<span class="ml-auto hidden md:inline text-xs text-[var(--pc-text-faint)]"> subscribed by 12.4k builders</span>
				</div>
			</div>
		</a>
	</div>

	<!-- Desktop search (inline) -->
	<div class="hidden md:flex px-4 pt-4">
		<div class="flex w-full max-w-[420px] items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-4 py-2 focus-within:border-[var(--pc-border-strong)]">
			<Search size={16} weight="Outline" />
			<input bind:value={q} placeholder="Search launches, fixes, incidents..." class="flex-1 bg-transparent text-sm outline-none" />
			{#if q}<button onclick={() => (q = '')} class="text-xs font-600 text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">Clear</button>{/if}
		</div>
	</div>

	<!-- Grid -->
	<div class="px-3 md:px-4 py-6">
		{#if filtered.length === 0}
			<div class="grid place-items-center rounded-[16px] border border-dashed border-[var(--pc-border)] bg-[var(--pc-surface)] p-12 text-center">
				<p class="text-sm font-600 text-[var(--pc-text-muted)]">No updates for this filter</p>
				<button onclick={() => { active = 'all'; q = ''; }} class="mt-3 rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)] px-4 py-2 text-sm font-600">Clear filters</button>
			</div>
		{:else}
			<div class="grid gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
				{#each filtered as item (item.id)}
					<VideoCard {item} />
				{/each}
			</div>
		{/if}

		<!-- Load more / craft footer -->
		<div class="mt-10 flex flex-col items-center gap-3 border-t border-[var(--pc-border)] pt-8">
			<p class="text-sm text-[var(--pc-text-muted)]">Crafted for builders who ship with love — Product Client brings focus back.</p>
			<button class="rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-6 py-2.5 text-sm font-600 hover:bg-[var(--pc-surface-2)]">Load 12 more updates</button>
		</div>
	</div>

	<!-- Bottom nav mobile YouTube-like -->
	<div class="h-[64px] lg:hidden"></div>
	<nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-[var(--pc-border)] bg-[var(--pc-surface)] py-1">
		<a href="/" class="flex flex-col items-center gap-0.5 py-1.5 px-4 text-[10px] font-600"
			><Home size={20} weight="Outline" />Home</a
		>
		<a href="/following" class="flex flex-col items-center gap-0.5 py-1.5 px-4 text-[10px] text-[var(--pc-text-muted)]"
			><Video size={20} weight="Outline" />Following</a
		>
		<a href="/studio" aria-label="Create studio" class="grid size-10 place-items-center rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)]"><Add size={18} weight="Outline" /></a>
		<a href="/subscriptions" class="flex flex-col items-center gap-0.5 py-1.5 px-4 text-[10px] text-[var(--pc-text-muted)]"
			><Users2 size={20} weight="Outline" />Subs</a
		>
		<a href="/you" class="flex flex-col items-center gap-0.5 py-1.5 px-4 text-[10px] text-[var(--pc-text-muted)]"
			><UserSquare size={20} weight="Outline" />You</a
		>
	</nav>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
