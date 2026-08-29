<script lang="ts">
	import ProductLaunchCard from '$lib/components/product/ProductLaunchCard.svelte';
	import { mockStates } from '$lib/data/mockStates';
	import { Heart, ArrowRight } from 'reicon-svelte';
	import { Avatar, Button, Card } from '$lib/components/ui';

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
			<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Following</h1>
		</div>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-65">Your subscriptions, ranked weekly.</p>
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
		<Card padding="lg" class="mt-10 py-12 flex flex-col items-center text-center pc-enter">
			<div class="mx-auto size-10 rounded-full bg-[var(--pc-surface)] grid place-items-center">
				<Heart size={16} weight="Outline" class="opacity-65" />
			</div>
			<p class="mt-3 text-sm font-medium">You're all caught up</p>
			<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-65 max-w-[40ch] mx-auto text-pretty">Streaks reward daily upvotes — keep visiting to stay top of AI answers.</p>
			<Button href="/" variant="primary" class="mt-4">Discover launches <ArrowRight size={14} weight="Outline" class="inline" /></Button>
		</Card>
	{:else}
		<Card padding="lg" class="py-16 flex flex-col items-center text-center pc-enter">
			<div class="mx-auto size-10 rounded-full bg-[var(--pc-surface)] grid place-items-center">
				<Heart size={16} weight="Outline" class="opacity-65" />
			</div>
			<p class="mt-3 text-sm font-medium">No subscriptions yet</p>
			<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-65 max-w-[40ch] mx-auto text-pretty">Follow products to see their launches, changelogs, and incidents here.</p>
			<Button href="/" variant="primary" class="mt-4">Discover launches <ArrowRight size={14} weight="Outline" class="inline" /></Button>
		</Card>
	{/if}
</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
