<script lang="ts">
	import { page } from '$app/state';
	import { mockStates, type StateType } from '$lib/data/mockStates';
	import VideoCard from '$lib/components/video/VideoCard.svelte';
	import FilterChips from '$lib/components/video/FilterChips.svelte';
	import { Verified } from 'reicon-svelte';

	let slug = $derived(page.params.slug);
	let active: StateType | 'all' = $state('all');
	let tab = $state<'videos' | 'changelog' | 'incidents'>('videos');
	let subscribed = $state(false);

	let productStates = $derived(mockStates.filter((s) => s.product.slug === slug));
	let displayStates = $derived(productStates.length ? productStates : mockStates.slice(0, 4));
	let product = $derived(displayStates[0]?.product ?? { name: slug, slug, avatar: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop', verified: false });
	let filtered = $derived(displayStates.filter((s) => (active === 'all' ? true : s.type === active)));

	// stats mock
	let stats = { subs: '12.4K', launches: displayStates.filter((s) => s.type === 'launch').length || 4, views: '1.2M' };
</script>

<svelte:head>
	<title>{product.name} — Product Client channel</title>
</svelte:head>

<div class="mx-auto max-w-[1920px]">
	<!-- Banner -->
	<div class="h-[120px] md:h-[180px] w-full overflow-hidden bg-[var(--pc-surface-2)] border-b border-[var(--pc-border)]">
		<img src={displayStates[0]?.thumbnail ?? 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=400&fit=crop'} alt="banner" class="h-full w-full object-cover" />
	</div>

	<div class="px-3 md:px-4">
		<!-- Channel header – YouTube style -->
		<div class="flex gap-4 md:gap-6 py-4 md:py-6">
			<img src={product.avatar} alt={product.name} class="size-16 md:size-24 rounded-full object-cover ring-2 ring-[var(--pc-border)]" />
			<div class="min-w-0 flex-1">
				<h1 class="flex items-center gap-2 text-[20px] md:text-[26px] font-800 tracking-tight">
					{product.name}
					{#if product.verified}<Verified size={18} weight="Outline" color="var(--blue-6)" />{/if}
					<span class="hidden md:inline-flex items-center rounded-full bg-[var(--pc-surface-2)] px-2.5 py-1 text-[10px] font-700 tracking-wide uppercase text-[var(--pc-text-muted)] border border-[var(--pc-border)]">Verified maker</span>
				</h1>
				<p class="text-sm text-[var(--pc-text-muted)]">@{slug} • {stats.subs} subscribers • {stats.launches} launches • {stats.views} views</p>
				<p class="mt-1 max-w-[640px] text-sm leading-relaxed text-[var(--pc-text-muted)] line-clamp-2">Building with craft. Follow to get launches, changelogs, incidents and events — focus, not feed noise. Like YouTube, tailored to products.</p>
				<div class="mt-3 flex flex-wrap gap-2">
					<button onclick={() => (subscribed = !subscribed)} class={['rounded-full px-5 py-2 text-sm font-700', subscribed ? 'bg-[var(--pc-surface-2)] border border-[var(--pc-border)]' : 'bg-[var(--pc-text)] text-[var(--pc-bg)]'].join(' ')}>
						{subscribed ? 'Subscribed' : 'Subscribe'}
					</button>
					<button class="rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-5 py-2 text-sm font-600 hover:bg-[var(--pc-surface-2)]">Notify me</button>
					<button class="rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-5 py-2 text-sm font-600">Share</button>
				</div>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex items-center gap-6 border-b border-[var(--pc-border)] overflow-x-auto scrollbar-none">
			<button onclick={() => (tab = 'videos')} class={['pb-3 pt-1 text-sm font-600 border-b-2 whitespace-nowrap', tab === 'videos' ? 'border-[var(--pc-text)]' : 'border-transparent text-[var(--pc-text-muted)]'].join(' ')}>Videos</button>
			<button onclick={() => (tab = 'changelog')} class={['pb-3 pt-1 text-sm font-600 border-b-2 whitespace-nowrap', tab === 'changelog' ? 'border-[var(--pc-text)]' : 'border-transparent text-[var(--pc-text-muted)]'].join(' ')}>Changelog</button>
			<button onclick={() => (tab = 'incidents')} class={['pb-3 pt-1 text-sm font-600 border-b-2 whitespace-nowrap', tab === 'incidents' ? 'border-[var(--pc-text)]' : 'border-transparent text-[var(--pc-text-muted)]'].join(' ')}>Incidents</button>
			<div class="ml-auto hidden md:flex items-center gap-2 pb-2">
				<FilterChips active={active} onSelect={(v) => (active = v)} />
			</div>
		</div>
		<div class="md:hidden py-2 border-b border-[var(--pc-border)]">
			<FilterChips active={active} onSelect={(v) => (active = v)} />
		</div>

		{#if tab === 'videos'}
			<div class="py-6 grid gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filtered as item (item.id)}
					<VideoCard {item} />
				{/each}
			</div>
		{:else if tab === 'changelog'}
			<div class="py-6 space-y-3 max-w-[880px]">
				{#each filtered.filter((s) => s.type === 'changelog' || s.type === 'launch') as item}
					<div class="rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4 flex gap-4">
						<img src={item.thumbnail} alt="" class="hidden md:block w-[160px] aspect-video rounded-[10px] object-cover shrink-0" />
						<div class="min-w-0">
							<p class="text-xs font-700 tracking-wide uppercase text-[var(--blue-6)]">{item.type} • {item.postedAt}</p>
							<h3 class="mt-1 text-[16px] font-700 leading-tight">{item.title}</h3>
							<p class="mt-1 text-sm text-[var(--pc-text-muted)] line-clamp-2">{item.description}</p>
							<a href="/watch/{item.id}" class="mt-3 inline-flex rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)] px-4 py-1.5 text-xs font-700">View update</a>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="py-6 space-y-3 max-w-[880px]">
				<div class="rounded-[12px] border border-[var(--yellow-6)] bg-[var(--yellow-1)] dark:bg-[#2a2300] p-4 flex gap-3">
					<span class="size-8 rounded-full bg-[var(--yellow-6)] grid place-items-center text-white shrink-0">!</span>
					<div>
						<p class="text-sm font-700">Current status: All systems operational</p>
						<p class="text-xs text-[var(--pc-text-muted)]">Last incident fixed 5h ago — edge latency resolved</p>
					</div>
				</div>
				{#each filtered.filter((s) => s.type === 'incident' || s.type === 'fix') as item}
					<div class="rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4">
						<p class="text-xs font-700 uppercase tracking-wide" style:color={item.type === 'incident' ? 'var(--yellow-7)' : 'var(--green-7)'}>{item.type} • {item.postedAt}</p>
						<h3 class="font-700">{item.title}</h3>
						<p class="text-sm text-[var(--pc-text-muted)]">{item.description}</p>
					</div>
				{/each}
				{#if filtered.filter((s) => s.type === 'incident' || s.type === 'fix').length === 0}
					<p class="text-sm text-[var(--pc-text-muted)]">No incidents recently — green across the board.</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.scrollbar-none {
		scrollbar-width: none;
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
</style>
