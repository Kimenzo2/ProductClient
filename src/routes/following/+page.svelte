<script lang="ts">
	import ProductLaunchCard from '$lib/components/product/ProductLaunchCard.svelte';
	import { mockStates } from '$lib/data/mockStates';
	let following = mockStates.slice(0, 6);
	let upvoted = $state<Set<string>>(new Set());
	function toggleUpvote(id: string) {
		const n = new Set(upvoted);
		if (n.has(id)) n.delete(id);
		else n.add(id);
		upvoted = n;
	}
</script>

<svelte:head>
	<title>Following — Product Client</title>
</svelte:head>

<div class="w-full px-3 md:px-4 py-6">
	<div class="flex items-baseline justify-between gap-4 border-b border-[var(--pc-border)] pb-4">
		<h1 class="text-[22px] font-700 tracking-tighter">Following</h1>
		<p class="text-sm text-[var(--pc-text-muted)]">-style feed — only your subscriptions, weekly ranked</p>
	</div>

	<div class="mt-4 flex gap-2 overflow-x-auto scrollbar-none py-1">
		{#each [{name:'OpenAI',img:'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop'}, {name:'Linear',img:'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop'}, {name:'Vercel',img:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}, {name:'Perplexity',img:'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop'}] as c}
			<div class="flex flex-col items-center gap-1.5 shrink-0 w-[84px]">
				<img src={c.img} alt={c.name} class="size-12 rounded-full object-cover ring-1 ring-[var(--pc-border)] p-0.5 bg-[var(--pc-surface)]" />
				<span class="text-xs font-600 truncate w-full text-center">{c.name}</span>
			</div>
		{/each}
	</div>

	<div class="mt-6 space-y-3 pc-enter-stagger">
		{#each following as item, i (item.id)}
			<ProductLaunchCard {item} rank={i + 1} upvoted={upvoted.has(item.id)} onUpvote={toggleUpvote} />
		{/each}
	</div>

	<div class="mt-8 pc-bezel p-1.5">
		<div class="pc-bezel-inner p-6 text-center bg-[var(--pc-surface)]">
			<p class="text-sm font-700">You’re all caught up for Week 35</p>
			<p class="text-sm text-[var(--pc-text-muted)] max-w-[48ch] mx-auto text-pretty"> streaks reward daily upvotes — keep visiting to stay top of AI answers.</p>
			<a href="/" class="pc-btn-primary mt-4">Discover launches <span class="pc-btn-icon">→</span></a>
		</div>
	</div>
</div>

<style>
	.scrollbar-none { scrollbar-width:none } .scrollbar-none::-webkit-scrollbar{display:none}
</style>
