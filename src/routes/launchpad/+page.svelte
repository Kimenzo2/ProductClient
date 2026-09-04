<script lang="ts">
	import ProductLaunchCard from '$lib/components/product/ProductLaunchCard.svelte';
	import { mockStates, preLaunchProducts } from '$lib/data/mockStates';
	import { Rocket, Clock, Users } from 'reicon-svelte';
	import { Avatar, Button, Card, Chip } from '$lib/components/ui';

	let upvoted = $state<Set<string>>(new Set());
	function toggleUpvote(id: string) {
		const n = new Set(upvoted);
		if (n.has(id)) n.delete(id);
		else n.add(id);
		upvoted = n;
	}
	const weekly = mockStates.filter((s) => s.type === 'launch').slice(0, 6);
</script>

<svelte:head><title>Launchpad — Product Client</title></svelte:head>

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<!-- Header -->
	<header class="pt-10 pb-5 max-sm:pt-8 max-sm:pb-4">
		<div class="flex items-baseline gap-3">
			<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Launchpad</h1>
			<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-normal" style:background="rgba(119, 152, 18, 0.15)" style:color="rgb(119, 152, 18)">Week 35</span>
		</div>
		<p class="mt-2 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)] text-pretty antialiased">Weekly Monday launches — one project per week, ranked by upvotes.</p>
	</header>

	<!-- Coming Soon -->
	{#if preLaunchProducts.length > 0}
		<div class="mb-6">
			<h2 class="text-[13px] font-medium text-[var(--pc-text-muted)] opacity-65 mb-2.5">Coming Soon</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pc-enter-stagger">
				{#each preLaunchProducts as pl (pl.slug)}
					<a href="/launch/{pl.slug}" class="flex items-center gap-3 p-3 rounded-[14px] bg-[var(--pc-surface-2)] transition-[background-color] group">
						<img src={pl.avatar} alt={pl.name} class="size-10 rounded-[10px] object-cover" />
						<div class="min-w-0 flex-1">
							<p class="text-[13px] font-medium truncate group-hover:text-[var(--pc-text)] transition-colors">{pl.name}</p>
							<p class="text-[11px] text-[var(--pc-text-muted)] opacity-65">{pl.category}</p>
						</div>
						<div class="text-right shrink-0">
							<div class="text-[11px] text-[var(--pc-text-faint)] opacity-55 flex items-center gap-1">
								<Clock size={10} weight="Outline" />
								{new Date(pl.launchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
							</div>
							<div class="text-[10px] text-[var(--pc-text-faint)] opacity-50 flex items-center gap-1 mt-0.5">
								<Users size={9} weight="Outline" />
								{pl.waitlistCount.toLocaleString()}
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Weekly launches -->
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
		<div class="space-y-2.5 pc-enter-stagger">
			{#each weekly as item, i (item.id)}
				<ProductLaunchCard {item} rank={i + 1} upvoted={upvoted.has(item.id)} onUpvote={toggleUpvote} />
			{/each}
		</div>

		<aside class="hidden lg:block space-y-4 h-fit sticky top-[calc(var(--pc-header-h)+16px)]">
			<Card padding="md">
				<h3 class="text-[13px] font-medium text-[var(--pc-text-muted)]">How it works</h3>
				<ul class="mt-2 space-y-1.5 text-[12px] text-[var(--pc-text-muted)] opacity-50">
					<li>One project per week, Monday 00:00 UTC</li>
					<li>Needs a profile — showcase work first</li>
					<li>Ranked by upvotes, SEO + AI indexed</li>
				</ul>
				<Button href="/studio" variant="primary" class="mt-3 w-full justify-center">For makers: launch a product</Button>
			</Card>
			<Card padding="md">
				<p class="text-[12px] font-medium text-[var(--pc-text-muted)] opacity-50">This week</p>
				<p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-60">33 live · 256 upvotes · Streaks build discovery.</p>
			</Card>
		</aside>
	</div>
</div>
