<script lang="ts">
	import { onMount } from 'svelte';
	import { toggleTheme, getTheme } from '$lib/theme';
	import { Bell, Menu, Moon, Rocket, Search, Sun } from 'reicon-svelte';
	import QuickCreate from '$lib/components/workspace/QuickCreate.svelte';

	let {
		onToggleSidebar,
		onOpenSearch,
		sidebarOpen = false,
		unreadCount = 3
	}: {
		onToggleSidebar: () => void;
		onOpenSearch: (query?: string) => void;
		sidebarOpen?: boolean;
		unreadCount?: number;
	} = $props();

	let isDark = $state(true);

	onMount(() => {
		isDark = getTheme() === 'dark';
	});
</script>

<header class="sticky top-0 z-40 bg-[var(--pc-bg)]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--pc-bg)]/80">
	<div class="mx-auto flex h-[var(--pc-header-h)] w-full max-w-[1440px] items-center gap-3 px-3 md:gap-4 md:px-4">
		<div class="flex shrink-0 items-center gap-2 md:gap-3">
			<button
				aria-label="Toggle navigation"
				aria-expanded={sidebarOpen}
				onclick={onToggleSidebar}
				class="grid size-9 place-items-center rounded-full transition-[background-color,color] duration-150 hover:bg-[var(--pc-surface-2)] lg:hidden"
			>
				<Menu size={20} weight="Outline" />
			</button>

			<a href="/" class="grid size-8 place-items-center rounded-[10px] bg-[var(--pc-accent)] text-white" aria-label="Product Client home">
				<Rocket size={16} weight="Outline" color="white" />
			</a>

			<div class="hidden items-center gap-2 lg:flex">
			<span class="text-sm font-medium tracking-tight">Product Client</span>
			</div>
		</div>

		<button
			type="button"
			onclick={() => onOpenSearch()}
			class="hidden min-w-0 flex-1 items-center justify-between gap-3 rounded-full bg-[var(--pc-surface-2)] px-3.5 py-2 text-left text-sm text-[var(--pc-text-muted)] transition-[background-color,color] duration-150 hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] md:flex md:max-w-[520px] md:mx-auto"
			aria-label="Open global search"
			aria-keyshortcuts="Control+K Meta+K"
		>
			<span class="flex min-w-0 items-center gap-2">
				<Search size={16} weight="Outline" class="shrink-0 opacity-65" />
				<span class="truncate">Find a product, update, help page, or feedback...</span>
			</span>
			<kbd class="hidden shrink-0 rounded-[8px] bg-[var(--pc-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--pc-text-faint)] xl:inline">⌘K</kbd>
		</button>

		<div class="ml-auto flex items-center gap-1 md:gap-2">
			<button
				type="button"
				aria-label="Open search"
				onclick={() => onOpenSearch()}
				class="grid size-9 place-items-center rounded-full transition-[background-color,color] duration-150 hover:bg-[var(--pc-surface-2)] md:hidden"
			>
				<Search size={18} weight="Outline" />
			</button>

			<div class="hidden sm:block"><QuickCreate /></div>
			<div class="sm:hidden"><QuickCreate compact /></div>

			<button
				type="button"
				onclick={() => { toggleTheme(); isDark = getTheme() === 'dark'; }}
				aria-label="Toggle theme"
				title="Toggle theme"
				class="grid size-9 place-items-center rounded-full transition-[background-color,color] duration-150 hover:bg-[var(--pc-surface-2)]"
			>
				{#if isDark}
					<Sun size={18} weight="Outline" />
				{:else}
					<Moon size={18} weight="Outline" />
				{/if}
			</button>

			<a href="/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} class="relative grid size-9 place-items-center rounded-full transition-[background-color,color] duration-150 hover:bg-[var(--pc-surface-2)]">
				<Bell size={18} weight="Outline" />
				{#if unreadCount > 0}<span class="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--pc-accent)] text-[10px] font-700 text-white">{unreadCount}</span>{/if}
			</a>
		</div>
	</div>
</header>

<style>
	header { backdrop-filter: saturate(1.2); }
</style>
