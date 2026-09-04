<script lang="ts">
	import { onMount } from 'svelte';
	import { toggleTheme, getTheme } from '$lib/theme';
	import { CloseCircle, Menu, Message, Moon, Search, Sun } from 'reicon-svelte';
	import ProductClientLogo from '$lib/components/brand/ProductClientLogo.svelte';

	let {
		onOpenSearch
	}: {
		onOpenSearch: (query?: string) => void;
	} = $props();

	let menuOpen = $state(false);
	let isDark = $state(true);

	onMount(() => {
		isDark = getTheme() === 'dark';
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && menuOpen) closeMenu(); };
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function closeMenu() {
		menuOpen = false;
	}

	function openSearch() {
		closeMenu();
		onOpenSearch();
	}
</script>

<header class="sticky top-0 z-40 border-b border-[var(--pc-border-strong)]/20 bg-[var(--pc-bg)]">
	<div class="mx-auto flex h-[var(--pc-header-h)] w-full max-w-[1440px] items-center gap-3 px-4 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]">
		<a href="/" class="flex shrink-0 items-center gap-2.5" aria-label="Product Client home">
			<ProductClientLogo size={32} />
			<span class="hidden text-sm font-medium tracking-tight sm:inline">Product Client</span>
		</a>

		<nav class="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
			<a href="/" class="rounded-full px-3 py-2 text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]">Discover</a>
			<a href="/products" class="rounded-full px-3 py-2 text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]">Products</a>
			<a href="/launchpad" class="rounded-full px-3 py-2 text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]">Launches</a>
		</nav>

		<button
			type="button"
			onclick={openSearch}
			class="hidden min-w-0 flex-1 items-center gap-2 rounded-full bg-[var(--pc-surface-2)] px-3.5 py-2 text-left text-sm text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] md:flex md:max-w-[430px] md:ms-auto lg:ms-4"
			aria-label="Search public Product Client pages"
			aria-keyshortcuts="Control+K Meta+K"
		>
			<Search size={16} weight="Outline" class="shrink-0 opacity-65" aria-hidden="true" />
			<span class="truncate">Search products, updates, and help...</span>
		</button>

		<div class="ms-auto flex items-center gap-3">
			<a href="/feedback/new" class="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)] lg:inline-flex"><Message size={15} weight="Outline" aria-hidden="true" /> Share feedback</a>
			<a href="/auth" class="hidden rounded-full px-3 py-2 text-[13px] text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)] lg:inline-flex">Sign in</a>
			<a href="/auth/sign-up" class="hidden rounded-full bg-[var(--pc-text)] px-3.5 py-2 text-[13px] font-medium text-[var(--pc-bg)] transition-opacity hover:opacity-85 lg:inline-flex">Create account</a>
			<button type="button" onclick={openSearch} class="grid size-9 place-items-center rounded-full transition-[background-color,color,transform] duration-150 hover:bg-[var(--pc-surface-2)] active:scale-[0.96] md:hidden" aria-label="Search public pages"><Search size={18} weight="Outline" aria-hidden="true" /></button>
			<button type="button" onclick={() => (menuOpen = !menuOpen)} class="grid size-9 place-items-center rounded-full transition-[background-color,color,transform] duration-150 hover:bg-[var(--pc-surface-2)] active:scale-[0.96] lg:hidden" aria-label={menuOpen ? 'Close public navigation' : 'Open public navigation'} aria-expanded={menuOpen}>
				{#if menuOpen}<CloseCircle size={19} weight="Outline" aria-hidden="true" />{:else}<Menu size={19} weight="Outline" aria-hidden="true" />{/if}
			</button>
			<button type="button" onclick={() => { toggleTheme(); isDark = getTheme() === 'dark'; }} aria-label="Toggle theme" title="Toggle theme" class="grid size-9 place-items-center rounded-full transition-[background-color,color,transform] duration-150 hover:bg-[var(--pc-surface-2)] active:scale-[0.96]">
				{#if isDark}<Sun size={18} weight="Outline" aria-hidden="true" />{:else}<Moon size={18} weight="Outline" aria-hidden="true" />{/if}
			</button>
		</div>
	</div>

	{#if menuOpen}
		<nav class="border-t border-[var(--pc-border-strong)]/20 bg-[var(--pc-bg)] px-4 py-3 lg:hidden" aria-label="Public navigation">
			<a href="/" onclick={closeMenu} class="flex items-center rounded-xl px-3 py-2.5 text-sm text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]">Discover</a>
			<a href="/products" onclick={closeMenu} class="flex items-center rounded-xl px-3 py-2.5 text-sm text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]">Products</a>
			<a href="/launchpad" onclick={closeMenu} class="flex items-center rounded-xl px-3 py-2.5 text-sm text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]">Launches</a>
			<a href="/feedback/new" onclick={closeMenu} class="mt-1 flex items-center gap-2 rounded-xl bg-[var(--pc-surface-2)] px-3 py-2.5 text-sm text-[var(--pc-text)]"><Message size={16} weight="Outline" aria-hidden="true" /> Share feedback</a>
			<a href="/auth" onclick={closeMenu} class="flex items-center rounded-xl px-3 py-2.5 text-sm text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]">Sign in</a>
			<a href="/auth/sign-up" onclick={closeMenu} class="flex items-center rounded-xl bg-[var(--pc-text)] px-3 py-2.5 text-sm font-medium text-[var(--pc-bg)]">Create account</a>
		</nav>
	{/if}
</header>
