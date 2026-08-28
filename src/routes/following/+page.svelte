<script lang="ts">
	import VideoCard from '$lib/components/video/VideoCard.svelte';
	import { mockStates } from '$lib/data/mockStates';
	// Following = first 6 as subscribed
	let following = mockStates.slice(0, 6);
</script>

<svelte:head>
	<title>Following — Product Client</title>
</svelte:head>

<div class="mx-auto max-w-[1920px] px-3 md:px-4 py-6">
	<div class="flex items-center justify-between">
		<h1 class="text-[20px] font-800 tracking-tight">Following</h1>
		<p class="text-sm text-[var(--pc-text-muted)]">Latest from your subscriptions</p>
	</div>
	<div class="mt-2 flex gap-2 overflow-x-auto scrollbar-none py-2">
		{#each [{name:'OpenAI',img:'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop'}, {name:'Linear',img:'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop'}, {name:'Vercel',img:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}] as c}
			<div class="flex flex-col items-center gap-1.5 shrink-0 w-[84px]">
				<img src={c.img} alt={c.name} class="size-14 rounded-full object-cover ring-2 ring-[var(--pc-border)] p-0.5 bg-[var(--pc-surface)]" />
				<span class="text-xs font-600 truncate w-full text-center">{c.name}</span>
			</div>
		{/each}
	</div>

	<div class="mt-6 grid gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each following as item (item.id)}
			<VideoCard {item} />
		{/each}
	</div>

	<div class="mt-8 rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-6 text-center">
		<p class="text-sm font-700">You’re all caught up</p>
		<p class="text-sm text-[var(--pc-text-muted)]">Follow more products to fill this feed.</p>
		<a href="/" class="mt-3 inline-flex rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)] px-5 py-2 text-sm font-700">Discover products</a>
	</div>
</div>

<style>
	.scrollbar-none { scrollbar-width:none } .scrollbar-none::-webkit-scrollbar{display:none}
</style>
