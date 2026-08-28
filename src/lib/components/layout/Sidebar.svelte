<script lang="ts">
	import { page } from '$app/state';
	import { Compass, Heart, Rocket, Search, Bell, CloseCircle, Play } from 'reicon-svelte';

	let {
		open = false,
		onClose
	}: { collapsed?: boolean; open?: boolean; onClose?: () => void } = $props();

	let path = $derived(page.url.pathname);

	const items = [
		{ label: 'Discover', href: '/', icon: Compass, desc: 'All launches' },
		{ label: 'Following', href: '/following', icon: Heart, desc: 'Subscribed' },
		{ label: 'Launchpad', href: '/launchpad', icon: Rocket, desc: 'Weekly' },
		{ label: 'Search', href: '/search', icon: Search, desc: 'Find' }
	];

	function isActive(href: string) {
		if (href === '/') return path === '/';
		return path.startsWith(href);
	}
</script>

<!-- Desktop rail – 72px, minimal -->
<aside
	class="hidden lg:flex flex-col items-center gap-1 border-r border-[var(--pc-border)] bg-[var(--pc-surface)] sticky top-[var(--pc-header-h)] h-[calc(100dvh-var(--pc-header-h))] w-[72px] py-3 shrink-0"
	aria-label="Primary navigation"
>
	<nav class="flex flex-col items-center gap-1 w-full px-1.5">
		{#each items as it}
			{@const Icon = it.icon}
			<a
				href={it.href}
				aria-current={isActive(it.href) ? 'page' : undefined}
				aria-label={it.label}
				title="{it.label} — {it.desc}"
				class={[
					'flex flex-col items-center gap-1 rounded-[12px] px-1.5 py-2.5 text-[10px] font-600 leading-none w-full border transition-colors duration-150 text-center',
					isActive(it.href)
						? 'bg-[var(--pc-text)] text-[var(--pc-bg)] border-[var(--pc-text)] shadow-sm'
						: 'bg-transparent text-[var(--pc-text-muted)] border-transparent hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]'
				].join(' ')}
			>
				<Icon size={18} weight="Outline" />
				<span class="tracking-wide truncate w-full">{it.label}</span>
			</a>
		{/each}
	</nav>

	<div class="mt-auto flex flex-col items-center gap-2 w-full px-2 pb-2">
		<a
			href="/notifications"
			aria-label="Notifications"
			class="relative grid size-9 place-items-center rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:text-[var(--pc-text)] hover:border-[var(--pc-border-strong)] transition-colors"
		>
			<Bell size={18} weight="Outline" />
			<span class="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--pc-accent)] text-[10px] font-700 text-white">3</span>
		</a>
		<a href="/you" class="size-8 rounded-full overflow-hidden ring-1 ring-[var(--pc-border)] hover:ring-[var(--pc-border-strong)] transition" aria-label="Profile">
			<img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="avatar" class="size-full object-cover" />
		</a>
	</div>
</aside>

<!-- Mobile drawer – full nav -->
{#if open}
	<button
		aria-label="Close navigation"
		onclick={onClose}
		class="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
	></button>
	<aside
		class="lg:hidden fixed left-0 top-0 z-50 h-dvh w-[280px] bg-[var(--pc-surface)] border-r border-[var(--pc-border)] overflow-y-auto flex flex-col"
	>
		<div class="flex h-[var(--pc-header-h)] items-center gap-3 border-b border-[var(--pc-border)] px-3">
			<button
				onclick={onClose}
				class="grid size-9 place-items-center rounded-full hover:bg-[var(--pc-surface-2)]"
				aria-label="Close"
			>
				<CloseCircle size={20} weight="Outline" />
			</button>
			<span class="flex items-center gap-2">
				<span class="grid size-8 place-items-center rounded-[9px] bg-[var(--pc-accent)] text-white"><Play size={16} weight="Outline" color="white" /></span>
				<span class="text-sm font-800">Product Client</span>
			</span>
		</div>
		<nav class="p-3 space-y-1">
			{#each items as it}
				{@const MIcon = it.icon}
				<a
					href={it.href}
					onclick={onClose}
					class={[
						'flex items-center gap-3 rounded-[12px] px-3 py-3 text-sm border',
						isActive(it.href) ? 'bg-[var(--pc-text)] text-[var(--pc-bg)] border-[var(--pc-text)] font-600' : 'border-transparent hover:bg-[var(--pc-surface-2)]'
					].join(' ')}
				>
					<MIcon size={18} weight="Outline" />
					<span class="flex-1">{it.label}</span>
					<span class="text-xs text-[var(--pc-text-faint)]">{it.desc}</span>
				</a>
			{/each}
		</nav>
		<div class="mx-3 h-px bg-[var(--pc-border)]"></div>
		<div class="p-3 space-y-2">
			<p class="px-3 text-[11px] font-700 tracking-widest uppercase text-[var(--pc-text-muted)]">This week</p>
			<div class="rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface-2)] p-3">
				<p class="text-xs font-700">33 launches • 256 upvotes</p>
				<p class="text-xs text-[var(--pc-text-muted)]"> Week 35 — live now</p>
			</div>
		</div>
	</aside>
{/if}
