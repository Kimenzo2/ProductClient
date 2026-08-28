<script lang="ts">
	import ProductLaunchCard from '$lib/components/product/ProductLaunchCard.svelte';
	import { mockStates } from '$lib/data/mockStates';
	import { Heart } from 'reicon-svelte';

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
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-40">Your subscriptions, ranked weekly.</p>
	</header>

	<!-- Story circles — horizontal scroll -->
	<div class="flex gap-3 overflow-x-auto scrollbar-none pb-4">
		{#each [{name:'OpenAI',img:'https://cdn.reicon.dev/logos/openai/original.svg'}, {name:'Linear',img:'https://cdn.reicon.dev/logos/linear/original.svg'}, {name:'Vercel',img:'https://cdn.reicon.dev/logos/vercel/original.svg'}, {name:'Perplexity',img:'https://cdn.reicon.dev/logos/perplexity/original.svg'}] as c}
			<div class="flex flex-col items-center gap-1.5 shrink-0 w-[72px]">
				<div class="size-14 rounded-full bg-[var(--pc-surface-2)] p-[3px]">
					<img src={c.img} alt={c.name} class="w-full h-full rounded-full object-cover" />
				</div>
				<span class="text-[11px] text-[var(--pc-text-muted)] opacity-50 truncate w-full text-center">{c.name}</span>
			</div>
		{/each}
	</div>

	<!-- Feed -->
	<div class="space-y-2.5 pc-enter-stagger">
		{#each following as item, i (item.id)}
			<ProductLaunchCard {item} rank={i + 1} upvoted={upvoted.has(item.id)} onUpvote={toggleUpvote} />
		{/each}
	</div>

	<!-- End state -->
	<div class="mt-10 rounded-[30px] bg-[var(--pc-surface-2)] px-6 py-12 flex flex-col items-center text-center pc-enter">
		<div class="mx-auto size-10 rounded-full bg-[var(--pc-surface)] grid place-items-center">
			<Heart size={16} weight="Outline" class="opacity-40" />
		</div>
		<p class="mt-3 text-sm font-medium">All caught up</p>
		<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-40 max-w-[40ch] mx-auto text-pretty">Streaks reward daily upvotes — keep visiting to stay top of AI answers.</p>
		<a href="/" class="pc-btn-primary mt-4">Discover launches →</a>
	</div>
</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
