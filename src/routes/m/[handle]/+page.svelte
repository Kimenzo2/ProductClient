<script lang="ts">
	import { page } from '$app/state';
	import { makers, mockStates } from '$lib/data/mockStates';
	import { Verified, Link as LinkIcon, Calendar, Flame, Globe, UserSquare } from 'reicon-svelte';
	import { Tabs } from 'bits-ui';
	import { Avatar, Button, Card, Chip, Separator, StatePanel, Toggle } from '$lib/components/ui';

	let handle = $derived(page.params.handle);
	let maker = $derived(makers.find((m) => m.handle === handle));
	let makerStates = $derived(mockStates.filter((s) => s.maker.handle === handle));
	let following = $state(false);

	let totalReads = $derived(
		makerStates.reduce((acc, s) => {
			const r = s.reads;
			if (r.includes('M')) return acc + parseFloat(r) * 1_000_000;
			if (r.includes('K')) return acc + parseFloat(r) * 1_000;
			return acc + parseInt(r) || 0;
		}, 0)
	);

	function formatFollowers(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}

	let tab = $state<'updates' | 'products' | 'about'>('updates');
</script>

<svelte:head>
	<title>{maker?.name ?? handle} — Product Client</title>
</svelte:head>

{#if maker}
	<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">

		<!-- ─── Banner ─── -->
		<div class="h-[120px] md:h-[160px] -mx-6 max-sm:-mx-4 rounded-b-[20px] overflow-hidden bg-[var(--pc-surface-2)]">
			{#if maker.banner}
				<img src={maker.banner} alt="" class="h-full w-full object-cover" />
			{/if}
		</div>

		<!-- ─── Profile header ─── -->
		<header class="flex items-end gap-4 -mt-8 md:-mt-10 relative z-10 pb-5">
			<!-- Avatar -->
			<Avatar src={maker.avatar} alt={maker.name} size="xl" class="!size-[72px] md:!size-20 -mt-8 md:-mt-10 relative z-10" />

			<div class="min-w-0 flex-1 pb-1">
				<!-- Name row -->
				<div class="flex items-center gap-2">
					<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">{maker.name}</h1>
					{#if maker.verified}
						<Verified size={16} weight="Outline" color="var(--color-blue-600)" />
					{/if}
				</div>
				<p class="mt-1 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)] text-pretty antialiased">@{maker.handle}</p>
			</div>

			<!-- Actions — right-aligned -->
			<div class="flex items-center gap-2 shrink-0 pb-1">
				<Toggle bind:pressed={following} variant="default" size="md">
					{following ? 'Following' : 'Follow'}
				</Toggle>
			</div>
		</header>

		<!-- Bio -->
		<p class="text-[13px] leading-relaxed text-[var(--pc-text-muted)] max-w-[52ch] opacity-50">{maker.bio}</p>

		<!-- Stats + links row -->
		<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--pc-text-muted)]">
			<span class="opacity-50">{formatFollowers(maker.followers)} followers</span>
			<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
			<span class="opacity-50">{maker.following} following</span>
			<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
			<span class="opacity-50">{maker.products} products</span>
			{#if maker.streak}
				<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
				<span class="inline-flex items-center gap-1 opacity-50">
					<Flame size={12} weight="Outline" /> {maker.streak}d streak
				</span>
			{/if}
			<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
			<span class="inline-flex items-center gap-1 opacity-60">
				<Calendar size={11} weight="Outline" /> {maker.joinedAt}
			</span>
		</div>

		<!-- External links -->
		{#if maker.website || maker.twitter || maker.github}
			<div class="mt-2.5 flex flex-wrap gap-1.5">
				{#if maker.website}
					<a href={maker.website} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-3 py-1 text-[12px] hover:bg-[var(--pc-surface)] transition-colors">
						<Globe size={11} weight="Outline" class="opacity-50" /> {maker.website.replace('https://', '')}
					</a>
				{/if}
				{#if maker.twitter}
					<a href="https://x.com/{maker.twitter.replace('@', '')}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-3 py-1 text-[12px] hover:bg-[var(--pc-surface)] transition-colors">
						{maker.twitter}
					</a>
				{/if}
				{#if maker.github}
					<a href="https://github.com/{maker.github}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-3 py-1 text-[12px] hover:bg-[var(--pc-surface)] transition-colors">
						GitHub
					</a>
				{/if}
			</div>
		{/if}

		<!-- ─── Tabs ─── -->
		<Tabs.Root value={tab} onValueChange={(v) => { if (v) tab = v as typeof tab; }} class="mt-5 pb-3 overflow-x-auto scrollbar-none">
			<Tabs.List class="flex items-center gap-1">
				<Tabs.Trigger value="updates" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
					Updates <span class="text-[11px] opacity-65">{makerStates.length}</span>
				</Tabs.Trigger>
				<Tabs.Trigger value="products" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
					Products
				</Tabs.Trigger>
				<Tabs.Trigger value="about" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
					About
				</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>

		<!-- ─── Tab content ─── -->
		{#if tab === 'updates'}
			<div class="space-y-2 pc-enter-stagger">
				{#each makerStates as item (item.id)}
					<a href="/update/{item.id}" class="flex gap-3 p-3 rounded-[14px] bg-[var(--pc-surface-2)] transition-[background-color] group">
						<img src={item.thumbnail} alt="" class="hidden md:block w-[100px] aspect-[4/3] rounded-[10px] object-cover shrink-0" role="presentation" />
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-[11px] font-medium uppercase tracking-wide opacity-65" style:color={item.type === 'launch' ? 'var(--color-blue-600)' : undefined}>{item.type}</span>
								<span class="text-[11px] text-[var(--pc-text-faint)] opacity-50">·</span>
								<span class="text-[11px] text-[var(--pc-text-faint)] opacity-55">{item.postedAt}</span>
							</div>
							<h3 class="mt-1 text-[13px] font-medium leading-snug group-hover:text-[var(--pc-text)] transition-colors">{item.title}</h3>
							<p class="mt-0.5 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)] text-pretty antialiased line-clamp-2">{item.description}</p>
							<div class="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--pc-text-faint)] opacity-55">
								<span class="inline-flex items-center gap-1">
									<img src={item.product.avatar} alt="" class="size-3 rounded-full object-cover" />
									{item.product.name}
								</span>
								<span>·</span>
								<span>{item.reads}</span>
							</div>
						</div>
					</a>
				{/each}
				{#if makerStates.length === 0}<StatePanel icon={Calendar} title="No updates yet" description="This maker has not published an update yet." />{/if}
			</div>

		{:else if tab === 'products'}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pc-enter-stagger">
				{#each [...new Map(makerStates.map((s) => [s.product.slug, s.product])).values()] as p}
					<a href="/p/{p.slug}" class="flex items-center gap-3 p-3 rounded-[14px] bg-[var(--pc-surface-2)] transition-[background-color] group">
						<img src={p.avatar} alt={p.name} class="size-12 rounded-[12px] object-cover" />
						<div class="min-w-0">
							<p class="text-[13px] font-medium flex items-center gap-1 group-hover:text-[var(--pc-text)] transition-colors">
								{p.name}
								{#if p.verified}<Verified size={12} weight="Outline" color="var(--color-blue-600)" />{/if}
							</p>
							<p class="text-[11px] text-[var(--pc-text-muted)] opacity-65 truncate">{p.category}</p>
						</div>
					</a>
				{/each}
			</div>

		{:else}
			<div class="py-4 max-w-[520px] space-y-5 pc-enter">
				<div>
					<h3 class="text-[13px] font-medium text-[var(--pc-text-muted)] opacity-50">Bio</h3>
					<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-50 leading-relaxed">{maker.bio}</p>
				</div>
				<div class="grid grid-cols-2 gap-4 text-[13px]">
					<div>
						<p class="text-[var(--pc-text-muted)] opacity-65">Total reads</p>
						<p class="mt-0.5 font-medium">{maker.totalReads}</p>
					</div>
					<div>
						<p class="text-[var(--pc-text-muted)] opacity-65">Products</p>
						<p class="mt-0.5 font-medium">{maker.products}</p>
					</div>
					<div>
						<p class="text-[var(--pc-text-muted)] opacity-65">Followers</p>
						<p class="mt-0.5 font-medium">{formatFollowers(maker.followers)}</p>
					</div>
					<div>
						<p class="text-[var(--pc-text-muted)] opacity-65">Joined</p>
						<p class="mt-0.5 font-medium">{maker.joinedAt}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<StatePanel size="page" icon={UserSquare} title="Maker not found" description={`There is no maker with the name “${handle}”.`} actionLabel="Go home" actionHref="/" class="pc-enter" />
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
