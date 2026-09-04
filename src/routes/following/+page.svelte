<script lang="ts">
	import ProductLaunchCard from '$lib/components/product/ProductLaunchCard.svelte';
	import { mockStates } from '$lib/data/mockStates';
	import { Heart } from 'reicon-svelte';
	import { Avatar, StatePanel } from '$lib/components/ui';

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

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<!-- Header -->
	<header class="pt-10 pb-5 max-sm:pt-8 max-sm:pb-4">
		<div class="flex items-baseline gap-3">
			<h1 class="text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-balance md:text-[21px]">Following</h1>
		</div>
		<p class="mt-2 max-w-[60ch] text-[13px] leading-[1.6] tracking-[-0.003em] text-[var(--pc-text-muted)] text-pretty">Your subscriptions, ranked weekly.</p>
	</header>

	<!-- Story circles — horizontal scroll -->
	<div class="flex gap-3 overflow-x-auto scrollbar-none pb-4">
		{#each [{name:'OpenAI',img:'https://cdn.reicon.dev/logos/openai/original.svg'}, {name:'Linear',img:'https://cdn.reicon.dev/logos/linear/original.svg'}, {name:'Vercel',img:'https://cdn.reicon.dev/logos/vercel/original.svg'}, {name:'Perplexity',img:'https://cdn.reicon.dev/logos/perplexity/original.svg'}] as c}
		<div class="flex flex-col items-center gap-1.5 shrink-0 w-[72px]">
			<Avatar src={c.img} alt={c.name} size="lg" />
			<span class="text-[11px] text-[var(--pc-text-muted)] opacity-50 truncate w-full text-center">{c.name}</span>
		</div>
		{/each}
	</div>

	<!-- Feed -->
	{#if following.length > 0}
		<div class="space-y-2.5 pc-enter-stagger">
			{#each following as item, i (item.id)}
				<ProductLaunchCard {item} rank={i + 1} upvoted={upvoted.has(item.id)} onUpvote={toggleUpvote} />
			{/each}
		</div>

		<!-- End state — only shows after feed -->
		<div class="mt-10"><StatePanel icon={Heart} title="You're all caught up" description="There are no more launches from the products you follow right now." actionLabel="Discover launches" actionHref="/" class="pc-enter" /></div>
	{:else}
		<StatePanel icon={Heart} title="You are not following any products yet" description="Follow a product to see its launches, updates, and service problems here." actionLabel="Discover products" actionHref="/" class="pc-enter" />
	{/if}
</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
