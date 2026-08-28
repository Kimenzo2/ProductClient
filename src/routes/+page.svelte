<script lang="ts">
	import FilterChips from '$lib/components/video/FilterChips.svelte';
	import ProductLaunchCard from '$lib/components/product/ProductLaunchCard.svelte';
	import { mockStates, type StateType } from '$lib/data/mockStates';
	import { Search, Flame, Rocket, Users2, ArrowUp, Trophy } from 'reicon-svelte';

	let active: StateType | 'all' = $state('all');
	let q = $state('');
	let upvoted = $state<Set<string>>(new Set());

	let filtered = $derived(
		mockStates
			.filter((s) => {
				const byType = active === 'all' ? true : s.type === active;
				const byQ = q.trim()
					? (s.title + s.product.name + s.description).toLowerCase().includes(q.toLowerCase())
					: true;
				return byType && byQ;
			})
			.slice(0, 12)
	);

	function toggleUpvote(id: string) {
		const next = new Set(upvoted);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		upvoted = next;
	}

	const week = { label: 'Week 35, 2026', live: 33, upvotes: 256, products: mockStates.length };
</script>

<svelte:head>
	<title>Product Client — Launch. Rank on Google & AI.</title>
</svelte:head>

<div class="w-full px-3 md:px-4">
	<div class="py-6 md:py-8 border-b border-[var(--pc-border)]">
		<div class="flex flex-wrap items-baseline gap-3">
			<h1 class="text-[22px] md:text-[28px] font-700 tracking-tighter leading-none">
				Top product launches this week
			</h1>
			<span class="rounded-full bg-[var(--pc-accent)] px-2.5 py-1 text-[11px] font-700 uppercase tracking-wide text-white">Live</span>
		</div>
		<p class="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--pc-text-muted)]">
			<span class="inline-flex items-center gap-1.5"><Rocket size={14} weight="Outline" />{week.label}</span>
			<span class="size-1 rounded-full bg-[var(--pc-border-strong)]"></span>
			<span>{week.live} live this week</span>
			<span class="size-1 rounded-full bg-[var(--pc-border-strong)]"></span>
			<span class="inline-flex items-center gap-1"><ArrowUp size={12} weight="Outline" />{week.upvotes} upvotes</span>
			<span class="size-1 rounded-full bg-[var(--pc-border-strong)]"></span>
			<span class="hidden md:inline">SEO-ready product pages & AI-readable listings</span>
		</p>
		<p class="mt-3 text-xs leading-relaxed text-[var(--pc-text-faint)] max-w-[72ch] text-pretty">
			Launch your tool, get found on Google and in ChatGPT answers. Minimal, craft-first, ranked weekly.
		</p>
	</div>

	<!-- Filter bar – sticky -->
	<div class="sticky top-[var(--pc-header-h)] z-20 -mx-3 md:-mx-4 px-3 md:px-4 py-3 border-b border-[var(--pc-border)] bg-[var(--pc-bg)]/90 backdrop-blur">
		<div class="flex items-center gap-3 overflow-x-auto scrollbar-none">
			<FilterChips active={active} onSelect={(v) => (active = v)} />
			<span class="ml-auto hidden md:inline-flex items-center gap-2 text-xs text-[var(--pc-text-muted)] shrink-0">
				<Flame size={14} weight="Outline" /> {filtered.length} launches
			</span>
		</div>
		<!-- mobile search (header already has search, but keep inline for following) -->
		<div class="mt-3 flex md:hidden items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-3 py-2">
			<Search size={16} weight="Outline" />
			<input bind:value={q} placeholder="Search launches, makers..." class="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--pc-text-faint)]" />
			{#if q}<button onclick={() => (q = '')} class="text-xs font-600 text-[var(--pc-text-muted)]">Clear</button>{/if}
		</div>
	</div>

	<!-- Two-column: feed + right rail -->
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 md:gap-8 py-6">
		<!-- Feed – single column, Rank + ProductLaunchCard -->
		<div class="min-w-0">
			<!-- Desktop inline search -->
			<div class="hidden md:flex items-center gap-2 mb-4">
				<div class="flex flex-1 max-w-[420px] items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-3.5 py-2 focus-within:border-[var(--pc-border-strong)]">
					<Search size={16} weight="Outline" />
					<input bind:value={q} placeholder="Search launches, makers..." class="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--pc-text-faint)]" />
					{#if q}<button onclick={() => (q = '')} class="text-xs font-600 text-[var(--pc-text-muted)]">Clear</button>{/if}
				</div>
				<span class="text-xs text-[var(--pc-text-faint)]">{filtered.length} of {week.products} • Sorted by upvotes</span>
			</div>

			{#if filtered.length === 0}
				<div class="rounded-[16px] border border-dashed border-[var(--pc-border)] bg-[var(--pc-surface)] p-10 text-center pc-enter">
					<div class="mx-auto size-10 rounded-full bg-[var(--pc-surface-2)] grid place-items-center border border-[var(--pc-border)]">
						<Search size={18} weight="Outline" />
					</div>
					<p class="mt-3 text-sm font-700">No launches for “{q || active}”</p>
					<p class="text-xs text-[var(--pc-text-muted)]">Try All or search for “AI”, “DevTool”, “Design”.</p>
					<button onclick={() => { active = 'all'; q = ''; }} class="pc-btn-primary mt-4">Clear filters</button>
				</div>
			{:else}
				<div class="space-y-3 pc-enter-stagger">
					{#each filtered as item, i (item.id)}
						<ProductLaunchCard {item} rank={i + 1} upvoted={upvoted.has(item.id)} onUpvote={toggleUpvote} />
					{/each}
				</div>

				<div class="mt-8 flex flex-col items-center gap-3 border-t border-[var(--pc-border)] pt-6">
					<p class="text-xs text-[var(--pc-text-faint)]">You’ve seen {filtered.length} — {week.live - filtered.length} more live this week.</p>
					<button class="pc-btn-ghost">Load 12 more</button>
				</div>
			{/if}
		</div>

		<aside class="hidden lg:block space-y-4 h-fit sticky top-[calc(var(--pc-header-h)+56px)]">
			<!-- Live stats -->
			<div class="pc-bezel p-1.5">
				<div class="pc-bezel-inner p-4 bg-[var(--pc-surface)]">
					<h3 class="text-sm font-700 tracking-tight flex items-center gap-2"><Trophy size={16} weight="Outline" /> This week</h3>
					<div class="mt-3 grid grid-cols-3 gap-2 text-center">
						<div class="rounded-[10px] bg-[var(--pc-surface-2)] border border-[var(--pc-border)] p-3">
							<div class="text-lg font-800 leading-none">{week.live}</div>
							<div class="text-[10px] font-700 uppercase tracking-wide text-[var(--pc-text-faint)]">Live</div>
						</div>
						<div class="rounded-[10px] bg-[var(--pc-surface-2)] border border-[var(--pc-border)] p-3">
							<div class="text-lg font-800 leading-none">{week.upvotes}</div>
							<div class="text-[10px] font-700 uppercase tracking-wide text-[var(--pc-text-faint)]">Upvotes</div>
						</div>
						<div class="rounded-[10px] bg-[var(--pc-surface-2)] border border-[var(--pc-border)] p-3">
							<div class="text-lg font-800 leading-none">12</div>
							<div class="text-[10px] font-700 uppercase tracking-wide text-[var(--pc-text-faint)]">Streak</div>
						</div>
					</div>
					<a href="/launchpad" class="mt-3 block text-center rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)] py-2 text-xs font-700">View launchpad →</a>
				</div>
			</div>

			<!-- Featured makers -->
			<div class="pc-bezel p-1.5">
				<div class="pc-bezel-inner p-4 bg-[var(--pc-surface)]">
					<h3 class="text-sm font-700 tracking-tight flex items-center gap-2"><Users2 size={16} weight="Outline" /> Featured makers</h3>
					<div class="mt-3 space-y-3">
						{#each mockStates.slice(0, 3) as m}
							<a href="/p/{m.product.slug}" class="flex items-center gap-3">
								<img src={m.maker.avatar} alt={m.maker.name} class="size-8 rounded-full object-cover ring-1 ring-[var(--pc-border)]" />
								<div class="min-w-0">
									<div class="text-sm font-600 leading-none line-clamp-1">{m.maker.name}</div>
									<div class="text-xs text-[var(--pc-text-muted)] line-clamp-1">{m.product.name} • {m.type}</div>
								</div>
								<span class="ml-auto text-xs font-700 text-[var(--pc-accent)]">Follow</span>
							</a>
						{/each}
					</div>
				</div>
			</div>

			<!-- Directory -->
			<div class="rounded-[16px] border border-[var(--pc-border)] bg-[var(--pc-surface-2)] p-4">
				<h3 class="text-sm font-700 tracking-tight">Product directory</h3>
				<p class="mt-1 text-xs leading-relaxed text-[var(--pc-text-muted)] text-pretty">Open, indexable — every launch has a page for Google + AI agents.</p>
				<div class="mt-3 flex flex-wrap gap-1.5">
					<span class="rounded-full bg-[var(--pc-surface)] border border-[var(--pc-border)] px-2.5 py-1 text-[11px] font-600">SEO tools</span>
					<span class="rounded-full bg-[var(--pc-surface)] border border-[var(--pc-border)] px-2.5 py-1 text-[11px] font-600">DevTool</span>
					<span class="rounded-full bg-[var(--pc-surface)] border border-[var(--pc-border)] px-2.5 py-1 text-[11px] font-600">AI</span>
				</div>
				<a href="/products" class="mt-3 inline-flex text-xs font-600 underline-offset-4 hover:underline">Browse all products →</a>
			</div>

			<!-- Streak leaderboard -->
			<div class="rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4">
				<h4 class="text-xs font-700 tracking-wide uppercase text-[var(--pc-text-muted)]">Streak leaderboard</h4>
				<ol class="mt-3 space-y-2 text-sm">
					<li class="flex items-center gap-2"><span class="size-5 grid place-items-center rounded-full bg-[var(--pc-accent)] text-white text-xs font-700">1</span> Hoverify — 25</li>
					<li class="flex items-center gap-2"><span class="size-5 grid place-items-center rounded-full bg-[var(--pc-surface-2)] border border-[var(--pc-border)] text-xs font-700">2</span> RedVid — 15</li>
					<li class="flex items-center gap-2"><span class="size-5 grid place-items-center rounded-full bg-[var(--pc-surface-2)] border border-[var(--pc-border)] text-xs font-700">3</span> SEO Rank — 15</li>
				</ol>
			</div>
		</aside>
	</div>

	<!-- Mobile bottom nav -->
	<div class="h-[64px] lg:hidden"></div>
	<nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-[var(--pc-border)] bg-[var(--pc-surface)]/95 backdrop-blur py-1">
		<a href="/" class="flex flex-col items-center gap-0.5 py-1.5 px-4 text-[10px] font-700"><Rocket size={18} weight="Outline" />Launch</a>
		<a href="/following" class="flex flex-col items-center gap-0.5 py-1.5 px-4 text-[10px] text-[var(--pc-text-muted)]"><Trophy size={18} weight="Outline" />Rank</a>
		<a href="/studio" aria-label="Launch" class="grid size-10 place-items-center rounded-full bg-[var(--pc-accent)] text-white"><Rocket size={18} weight="Outline" color="white" /></a>
		<a href="/search" class="flex flex-col items-center gap-0.5 py-1.5 px-4 text-[10px] text-[var(--pc-text-muted)]"><Search size={18} weight="Outline" />Search</a>
		<a href="/you" class="flex flex-col items-center gap-0.5 py-1.5 px-4 text-[10px] text-[var(--pc-text-muted)]"><Users2 size={18} weight="Outline" />You</a>
	</nav>
</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
