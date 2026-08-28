<script lang="ts">
	import ProductLaunchCard from '$lib/components/product/ProductLaunchCard.svelte';
	import { mockStates } from '$lib/data/mockStates';
	import { Rocket, ArrowUp } from 'reicon-svelte';
	let upvoted = $state<Set<string>>(new Set());
	function toggleUpvote(id: string) {
		const n = new Set(upvoted);
		if (n.has(id)) n.delete(id);
		else n.add(id);
		upvoted = n;
	}
	const weekly = mockStates.filter((s) => s.type === 'launch').slice(0, 6);
</script>

<svelte:head><title>Launchpad — Weekly • Product Client</title></svelte:head>

<div class="w-full px-3 md:px-4 py-6">
	<div class="flex flex-wrap items-baseline gap-3 border-b border-[var(--pc-border)] pb-4">
		<h1 class="text-[22px] md:text-[26px] font-700 tracking-tighter flex items-center gap-2">
			<span class="grid size-8 place-items-center rounded-[9px] bg-[var(--pc-accent)] text-white"><Rocket size={16} weight="Outline" color="white" /></span>
			Launchpad — Weekly Monday
		</h1>
		<span class="rounded-full bg-[var(--pc-surface-2)] border border-[var(--pc-border)] px-3 py-1 text-xs font-700">Week 35 • 33 live • 256 upvotes</span>
	</div>

	<div class="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
		<div class="space-y-3 pc-enter-stagger">
			{#each weekly as item, i (item.id)}
				<ProductLaunchCard {item} rank={i + 1} upvoted={upvoted.has(item.id)} onUpvote={toggleUpvote} />
			{/each}
		</div>
		<aside class="hidden lg:block space-y-4 h-fit sticky top-[calc(var(--pc-header-h)+16px)]">
			<div class="pc-bezel p-1.5">
				<div class="pc-bezel-inner p-4 bg-[var(--pc-surface)]">
					<h3 class="text-sm font-700">How Launchpad works</h3>
					<ul class="mt-2 text-xs leading-5 text-[var(--pc-text-muted)] list-disc pl-4">
						<li>One project per week, every Monday 00:00 UTC</li>
						<li>Needs a profile — showcase work first</li>
						<li>Ranked by upvotes, SEO + AI indexed</li>
					</ul>
					<a href="/studio" class="pc-btn-primary mt-4 w-full justify-center">Launch your product</a>
				</div>
			</div>
			<div class="rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface-2)] p-4">
				<p class="text-xs font-700">This week</p>
				<p class="text-xs text-[var(--pc-text-muted)]">33 live • 256 upvotes • Streaks build discovery. Your slot is ready.</p>
			</div>
		</aside>
	</div>
</div>
