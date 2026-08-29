<script lang="ts">
	import FilterChips from '$lib/components/video/FilterChips.svelte';
	import ProductLaunchCard from '$lib/components/product/ProductLaunchCard.svelte';
	import { mockStates, type StateType } from '$lib/data/mockStates';
	import { Search, Flame, Rocket, Users2, ArrowUp, Trophy, ArrowRight } from 'reicon-svelte';
	import { Avatar, Badge, Button, Card, Chip, Input, StatePanel } from '$lib/components/ui';

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

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">

	<!-- Header -->
	<header class="pt-10 pb-6 max-sm:pt-8 max-sm:pb-4">
		<div class="flex items-baseline gap-3">
			<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">
				Top product launches this week
			</h1>
			<Chip variant="accent" size="xs">Live</Chip>
		</div>

		<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--pc-text-muted)]">
			<span class="inline-flex items-center gap-1.5">
				<Rocket size={13} weight="Outline" class="opacity-50" />
				{week.label}
			</span>
			<span class="text-[var(--pc-text-faint)] opacity-55">·</span>
			<span>{week.live} live</span>
			<span class="text-[var(--pc-text-faint)] opacity-55">·</span>
			<span class="inline-flex items-center gap-1">
				<ArrowUp size={12} weight="Outline" class="opacity-50" />
				{week.upvotes}
			</span>
			<span class="hidden md:inline text-[var(--pc-text-faint)] opacity-55">·</span>
			<span class="hidden md:inline opacity-70">SEO-ready pages · AI-readable listings</span>
		</div>

		<p class="mt-2 text-[13px] leading-relaxed text-[var(--pc-text-muted)] max-w-[52ch] text-pretty opacity-65">
			Launch your tool, get found on Google and in ChatGPT answers.
		</p>
	</header>

	<!-- Filter bar -->
	<nav class="sticky top-[var(--pc-header-h)] z-20 -mx-6 px-6 max-sm:-mx-4 max-sm:px-4 pb-3 bg-[var(--pc-bg)]/90 backdrop-blur" aria-label="Launch filters">
		<div class="absolute bottom-0 left-0 right-0 h-px bg-[var(--pc-border-strong)] opacity-20"></div>

		<div class="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
			<FilterChips active={active} onSelect={(v) => { active = v; visibleCount = 12; }} />
			<span class="ml-auto hidden md:inline-flex items-center gap-1.5 text-xs text-[var(--pc-text-muted)] opacity-65 shrink-0">
				<Flame size={12} weight="Outline" />
				{matching.length}
			</span>
		</div>

		<!-- Mobile search -->
		<div class="mt-2.5 flex md:hidden items-center gap-2 rounded-full bg-[var(--pc-surface-2)] px-3 py-2">
			<Search size={14} weight="Outline" class="opacity-65" />
			<input bind:value={q} placeholder="Search" class="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--pc-text-faint)]" />
			{#if q}<button type="button" onclick={() => (q = '')} class="text-xs text-[var(--pc-text-muted)]">Clear</button>{/if}
		</div>
	</nav>

	<!-- Content grid -->
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 pt-5">

		<!-- Feed column -->
		<main class="min-w-0">
			<!-- Desktop search -->
			<div class="hidden md:flex items-center gap-3 mb-5">
				<div class="flex flex-1 max-w-[380px] items-center gap-2 rounded-full bg-[var(--pc-surface-2)] px-3.5 py-2 transition-colors focus-within:bg-[var(--pc-surface)]">
					<Search size={14} weight="Outline" class="opacity-65" />
					<input bind:value={q} placeholder="Search launches, makers..." class="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--pc-text-faint)]" />
					{#if q}<button type="button" onclick={() => (q = '')} class="text-xs text-[var(--pc-text-muted)]">Clear</button>{/if}
				</div>
				<span class="text-xs text-[var(--pc-text-faint)] opacity-55 shrink-0">{matching.length} of {week.products}</span>
			</div>

			{#if matching.length === 0}
				<StatePanel icon={Search} title="No launches match" description="Try a different filter or search term." actionLabel="Clear filters" onAction={() => { active = 'all'; q = ''; }} class="pc-enter" />
			{:else}
				<div class="space-y-2.5 pc-enter-stagger">
					{#each visible as item, i (item.id)}
						<ProductLaunchCard {item} rank={i + 1} upvoted={upvoted.has(item.id)} onUpvote={toggleUpvote} />
					{/each}
				</div>

				<div class="mt-8 flex flex-col items-center gap-2.5">
					<p class="text-xs text-[var(--pc-text-faint)] opacity-55">
						{matching.length - visible.length} more this week
					</p>
					{#if visible.length < matching.length}<Button variant="ghost" onclick={() => (visibleCount += 12)}>Load more</Button>{:else}<span class="text-[11px] text-[var(--pc-text-faint)]">You’re all caught up</span>{/if}
				</div>
			{/if}
		</main>

		<!-- Right sidebar -->
		<aside class="hidden lg:block space-y-4 h-fit sticky top-[calc(var(--pc-header-h)+60px)]">
			<!-- Stats card -->
			<Card padding="md">
				<h3 class="text-[13px] font-medium text-[var(--pc-text-muted)] flex items-center gap-2">
					<Trophy size={14} weight="Outline" class="opacity-50" />
					This week
				</h3>
				<div class="mt-3 grid grid-cols-3 gap-1.5">
					{#each [
						{ value: week.live, label: 'Live' },
						{ value: week.upvotes, label: 'Votes' },
						{ value: 12, label: 'Streak' }
					] as stat, si (si)}
						<div class="rounded-[10px] bg-[var(--pc-surface)] py-2.5 px-2 text-center">
							<div class="text-base font-medium leading-none">{stat.value}</div>
							<div class="mt-1 text-[10px] text-[var(--pc-text-faint)] opacity-65">{stat.label}</div>
						</div>
					{/each}
				</div>
				<Button href="/launchpad" variant="primary" class="mt-3 w-full justify-center text-xs">View launchpad <ArrowRight size={14} weight="Outline" class="inline" /></Button>
			</Card>

			<!-- Featured makers -->
			<Card padding="md">
				<h3 class="text-[13px] font-medium text-[var(--pc-text-muted)] flex items-center gap-2">
					<Users2 size={14} weight="Outline" class="opacity-50" />
					Featured makers
				</h3>
				<div class="mt-3 space-y-2.5">
					{#each mockStates.slice(0, 3) as m (m.maker.handle)}
						<a href="/p/{m.product.slug}" class="flex items-center gap-2.5 group">
							<Avatar src={m.maker.avatar} alt={m.maker.name} size="sm" />
							<div class="min-w-0 flex-1">
								<div class="text-[13px] font-normal leading-none line-clamp-1 group-hover:text-[var(--pc-text)] transition-colors">{m.maker.name}</div>
								<div class="text-[11px] text-[var(--pc-text-muted)] opacity-65 line-clamp-1 mt-0.5">{m.product.name}</div>
							</div>
							<span class="text-[11px] text-[var(--pc-accent)] opacity-0 transition-opacity group-hover:opacity-100">View</span>
						</a>
					{/each}
				</div>
			</Card>

			<!-- Directory -->
			<Card padding="md">
				<h3 class="text-[13px] font-medium text-[var(--pc-text-muted)]">Product directory</h3>
				<p class="mt-1.5 text-[11px] leading-relaxed text-[var(--pc-text-muted)] opacity-65 text-pretty">
					Every launch gets an SEO-ready page for Google + AI agents.
				</p>
				<div class="mt-2.5 flex flex-wrap gap-1.5">
					{#each ['SEO tools', 'DevTool', 'AI'] as tag, ti (ti)}
						<Chip size="xs">{tag}</Chip>
					{/each}
				</div>
				<a href="/products" class="mt-2.5 inline-flex text-[11px] text-[var(--pc-accent)]">Browse all <ArrowRight size={14} weight="Outline" class="inline" /></a>
			</Card>

			<!-- Streak leaderboard -->
			<Card padding="md">
				<h4 class="text-[11px] font-medium uppercase tracking-wider text-[var(--pc-text-faint)] opacity-65">Streaks</h4>
				<ol class="mt-2.5 space-y-1.5">
					{#each [
						{ name: 'Hoverify', score: 25 },
						{ name: 'RedVid', score: 15 },
						{ name: 'SEO Rank', score: 15 }
					] as item, i (i)}
						<li class="flex items-center gap-2 text-[13px]">
							{#if i === 0}
								<Badge variant="accent" size="sm">{i + 1}</Badge>
							{:else}
								<Badge size="sm">{i + 1}</Badge>
							{/if}
							<span class="opacity-70">{item.name}</span>
							<span class="ml-auto text-[var(--pc-text-faint)] opacity-65">{item.score}</span>
						</li>
					{/each}
				</ol>
			</Card>
		</aside>
	</div>

</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
