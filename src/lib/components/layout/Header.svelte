<script lang="ts">
	import { onMount } from 'svelte';
	import { toggleTheme, getTheme } from '$lib/theme';
	import { Bell, Menu, Moon, Search, SidebarLeft, SidebarRight, Sun } from 'reicon-svelte';
	import QuickCreate from '$lib/components/workspace/QuickCreate.svelte';
	import ProductClientLogo from '$lib/components/brand/ProductClientLogo.svelte';

	let {
		onToggleSidebar,
		onOpenSearch,
		sidebarOpen = false,
		collapsed = false,
		unreadCount = 3
	}: {
		onToggleSidebar: () => void;
		onOpenSearch: (query?: string) => void;
		sidebarOpen?: boolean;
		collapsed?: boolean;
		unreadCount?: number;
	} = $props();

	let isDark = $state(true);

	onMount(() => {
		isDark = getTheme() === 'dark';
	});
</script>

<header class="sticky top-0 z-40 bg-[var(--pc-bg)] border-b border-[var(--pc-border-strong)]/10">
	<div class="mx-auto flex h-[var(--pc-header-h)] w-full max-w-[1440px] items-center gap-3 px-4 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]">
		<div class="flex shrink-0 items-center gap-3">
			<button
				aria-label="Toggle navigation"
				aria-expanded={sidebarOpen}
				onclick={onToggleSidebar}
				class="grid size-9 place-items-center rounded-full transition-[background-color,color,transform] duration-150 hover:bg-[var(--pc-surface-2)] active:scale-[0.96] lg:hidden"
			>
				<Menu size={20} weight="Outline" aria-hidden="true" />
			</button>

			<a href="/" class="shrink-0" aria-label="Product Client home">
				<ProductClientLogo size={32} />
			</a>

			<div class="hidden items-center gap-2 lg:flex">
				<span class="text-sm font-medium tracking-[-0.01em] leading-[1.3] antialiased">Product Client</span>
			</div>
			<button
				type="button"
				onclick={onToggleSidebar}
				aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-expanded={!collapsed}
				title={collapsed ? 'Expand sidebar ( [ )' : 'Collapse sidebar ( [ )'}
				class="hidden lg:grid size-8 place-items-center rounded-lg bg-transparent text-[var(--pc-text)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)] active:scale-[0.96] transition-[background-color,color,transform] duration-150 focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]"
			>
				{#if collapsed}
					<SidebarRight size={16} weight="Outline" aria-hidden="true" />
				{:else}
					<SidebarLeft size={16} weight="Outline" aria-hidden="true" />
				{/if}
			</button>
		</div>

		<div class="ms-auto flex items-center gap-3">
			<div class="hidden sm:block"><QuickCreate /></div>
			<div class="sm:hidden"><QuickCreate compact /></div>

			<button
				type="button"
				aria-label="Open search"
				aria-keyshortcuts="Control+K Meta+K"
				onclick={() => onOpenSearch()}
				class="grid size-9 place-items-center rounded-full bg-transparent text-[var(--pc-text)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] active:scale-[0.96]"
			>
				<Search size={18} weight="Outline" aria-hidden="true" />
			</button>

			<button
				type="button"
				onclick={() => { toggleTheme(); isDark = getTheme() === 'dark'; }}
				aria-label="Toggle theme"
				title="Toggle theme"
				class="grid size-9 place-items-center rounded-full bg-transparent text-[var(--pc-text)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] active:scale-[0.96]"
			>
				{#if isDark}
					<Sun size={18} weight="Outline" aria-hidden="true" />
				{:else}
					<Moon size={18} weight="Outline" aria-hidden="true" />
				{/if}
			</button>

			<a href="/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} class="relative grid size-9 place-items-center rounded-full bg-transparent text-[var(--pc-text)] transition-[background-color,color,transform] duration-150 hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] active:scale-[0.96]">
				<Bell size={18} weight="Outline" aria-hidden="true" />
				{#if unreadCount > 0}<span class="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--pc-accent)] text-[11px] font-medium leading-none tracking-[-0.01em] text-white">{unreadCount}</span>{/if}
			</a>
		</div>
	</div>
</header>


