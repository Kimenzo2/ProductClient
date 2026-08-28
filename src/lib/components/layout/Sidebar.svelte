<script lang="ts">
	import { Home, Video, Compass, Bell, Box, Heart, History, Inbox, ArrowDown, CloseCircle, Menu, Play } from 'reicon-svelte';

	let {
		collapsed = false,
		open = false,
		onClose
	}: { collapsed?: boolean; open?: boolean; onClose?: () => void } = $props();

	const main = [
		{ label: 'Home', icon: 'home', href: '/', active: true },
		{ label: 'Following', icon: 'following', href: '/following', active: false },
		{ label: 'Discover', icon: 'compass', href: '/discover', active: false },
		{ label: 'Notifications', icon: 'bell', href: '/notifications', active: false, badge: '3' }
	];

	const library = [
		{ label: 'Your products', icon: 'box', href: '/you' },
		{ label: 'Liked', icon: 'heart', href: '/liked' },
		{ label: 'History', icon: 'history', href: '/history' },
		{ label: 'Feedback inbox', icon: 'inbox', href: '/feedback' }
	];

	const subs = [
		{ name: 'OpenAI', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop', live: true },
		{ name: 'Linear', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', live: false },
		{ name: 'Vercel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', live: true },
		{ name: 'Figma', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop', live: false },
		{ name: 'Perplexity', avatar: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop', live: false },
		{ name: 'Supabase', avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop', live: true }
	];
</script>

{#snippet icon(name: string)}
	{#if name === 'home'}
		<Home size={18} weight="Outline" />
	{:else if name === 'following'}
		<Video size={18} weight="Outline" />
	{:else if name === 'compass'}
		<Compass size={18} weight="Outline" />
	{:else if name === 'bell'}
		<Bell size={18} weight="Outline" />
	{:else if name === 'box'}
		<Box size={18} weight="Outline" />
	{:else if name === 'heart'}
		<Heart size={18} weight="Outline" />
	{:else if name === 'history'}
		<History size={18} weight="Outline" />
	{:else if name === 'inbox'}
		<Inbox size={18} weight="Outline" />
	{/if}
{/snippet}

<aside
	class={[
		'hidden lg:flex flex-col border-r border-[var(--pc-border)] bg-[var(--pc-surface)] overflow-y-auto sticky top-[var(--pc-header-h)] h-[calc(100vh-var(--pc-header-h))] overscroll-contain',
		collapsed ? 'w-[72px] px-2 py-3' : 'w-[240px] px-3 py-3'
	].join(' ')}
>
	{#if !collapsed}
		<nav class="space-y-1">
			{#each main as it}
				<a
					href={it.href}
					class={[
						'flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-colors',
						it.active ? 'bg-[var(--pc-surface-2)] font-600' : 'hover:bg-[var(--pc-surface-2)]'
					].join(' ')}
				>
					{@render icon(it.icon)}
					<span class="flex-1">{it.label}</span>
					{#if it.badge}<span class="rounded-full bg-[var(--pc-accent)] px-1.5 py-0.5 text-[10px] font-700 text-white">{it.badge}</span>{/if}
				</a>
			{/each}
		</nav>

		<div class="my-3 h-px bg-[var(--pc-border)]"></div>

		<nav class="space-y-1">
			<p class="px-3 py-1 text-[11px] font-700 tracking-[0.08em] uppercase text-[var(--pc-text-muted)]">Library</p>
			{#each library as it}
				<a href={it.href} class="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm hover:bg-[var(--pc-surface-2)] transition-colors">
					{@render icon(it.icon)}
					{it.label}
				</a>
			{/each}
		</nav>

		<div class="my-3 h-px bg-[var(--pc-border)]"></div>

		<div>
			<p class="px-3 py-1 text-[11px] font-700 tracking-[0.08em] uppercase text-[var(--pc-text-muted)]">Subscriptions</p>
			<div class="mt-1 space-y-0.5">
				{#each subs as s}
					<a href="/p/{s.name.toLowerCase()}" class="flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-[var(--pc-surface-2)] transition-colors">
						<span class="relative">
							<img src={s.avatar} alt={s.name} class="size-6 rounded-full object-cover" />
							{#if s.live}<span class="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-[var(--pc-accent)] ring-2 ring-[var(--pc-surface)]"></span>{/if}
						</span>
						<span class="text-sm truncate flex-1">{s.name}</span>
						{#if s.live}<span class="size-1.5 rounded-full bg-[var(--pc-accent)] animate-pulse"></span>{/if}
					</a>
				{/each}
				<a href="/subscriptions" class="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm hover:bg-[var(--pc-surface-2)]">
					<ArrowDown size={16} weight="Outline" />
					Show 42 more
				</a>
			</div>
		</div>

		<div class="my-3 h-px bg-[var(--pc-border)]"></div>
		<div class="px-3 py-2 text-[11px] leading-4 text-[var(--pc-text-faint)]">
			<div class="flex flex-wrap gap-x-3 gap-y-1 font-600">
				<a href="/" class="hover:text-[var(--pc-text-muted)]">About</a>
				<a href="/" class="hover:text-[var(--pc-text-muted)]">Press</a>
				<a href="/" class="hover:text-[var(--pc-text-muted)]">Copyright</a>
				<a href="/" class="hover:text-[var(--pc-text-muted)]">Contact</a>
				<a href="/" class="hover:text-[var(--pc-text-muted)]">Terms</a>
				<a href="/" class="hover:text-[var(--pc-text-muted)]">Privacy</a>
			</div>
			<p class="mt-3">© 2026 Product Client</p>
		</div>
	{:else}
		<!-- collapsed -->
		<nav class="flex flex-col items-center gap-1">
			{#each main as it}
				<a
					href={it.href}
					class={[
						'flex flex-col items-center gap-1 rounded-[10px] px-2 py-3 text-[10px] leading-none w-full',
						it.active ? 'bg-[var(--pc-surface-2)] font-600' : 'hover:bg-[var(--pc-surface-2)]'
					].join(' ')}
				>
					{@render icon(it.icon)}
					{it.label}
				</a>
			{/each}
			<div class="my-2 h-px w-full bg-[var(--pc-border)]"></div>
			{#each subs.slice(0, 6) as s}
				<a href="/p/{s.name.toLowerCase()}" class="flex flex-col items-center gap-1 py-2">
					<span class="relative"><img src={s.avatar} alt={s.name} class="size-7 rounded-full object-cover" /></span>
					<span class="text-[10px] truncate max-w-[60px]">{s.name}</span>
				</a>
			{/each}
		</nav>
	{/if}
</aside>

<!-- Mobile drawer -->
{#if open}
	<!-- backdrop -->
	<button
		aria-label="Close sidebar"
		onclick={onClose}
		class="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
	></button>
	<aside
		class="lg:hidden fixed left-0 top-0 z-50 h-dvh w-[280px] bg-[var(--pc-surface)] border-r border-[var(--pc-border)] overflow-y-auto flex flex-col"
	>
		<div class="flex h-[var(--pc-header-h)] items-center gap-3 border-b border-[var(--pc-border)] px-3">
			<button
				onclick={onClose}
				class="grid size-10 place-items-center rounded-full hover:bg-[var(--pc-surface-2)]"
				aria-label="Close"
			>
				<CloseCircle size={20} weight="Outline" />
			</button>
			<span class="flex items-center gap-2">
				<span class="grid size-8 place-items-center rounded-[8px] bg-[var(--pc-accent)] text-white"><Play size={16} weight="Outline" color="white" /></span>
				<span class="text-sm font-800">Product Client</span>
			</span>
		</div>
		<nav class="p-3 space-y-1">
			{#each main as it}
				<a href={it.href} onclick={onClose} class={['flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm', it.active ? 'bg-[var(--pc-surface-2)] font-600' : 'hover:bg-[var(--pc-surface-2)]'].join(' ')}>
					{@render icon(it.icon)}{it.label}
				</a>
			{/each}
		</nav>
		<div class="mx-3 h-px bg-[var(--pc-border)]"></div>
		<div class="p-3">
			<p class="px-3 py-1 text-[11px] font-700 tracking-widest uppercase text-[var(--pc-text-muted)]">Subscriptions</p>
			{#each subs as s}
				<a href="/p/{s.name.toLowerCase()}" onclick={onClose} class="flex items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-[var(--pc-surface-2)]">
					<img src={s.avatar} alt={s.name} class="size-7 rounded-full object-cover" />
					<span class="text-sm flex-1">{s.name}</span>
					{#if s.live}<span class="size-2 rounded-full bg-[var(--pc-accent)]"></span>{/if}
				</a>
			{/each}
		</div>
	</aside>
{/if}
