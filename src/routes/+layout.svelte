<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { toggleTheme, type Theme } from '$lib/theme';
	import { Add, Home, Inbox, Search, UserSquare } from 'reicon-svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import PublicHeader from '$lib/components/layout/PublicHeader.svelte';
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import GlobalSearch from '$lib/components/layout/GlobalSearch.svelte';
	import { surfaceForPath, type AppSurface } from '$lib/routing/surfaces';

	let { children } = $props();

	let collapsed = $state(false);
	let mobileOpen = $state(false);
	let searchOpen = $state(false);
	let searchInitialQuery = $state('');
	let surface: AppSurface = $derived(surfaceForPath(page.url.pathname));

	function toggleSidebar() {
		if (window.innerWidth < 1024) mobileOpen = !mobileOpen;
		else collapsed = !collapsed;
	}

	function openSearch(query = '') {
		searchInitialQuery = query;
		searchOpen = true;
		mobileOpen = false;
	}

	onMount(() => {
		const handleShortcut = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				openSearch();
			} else if (event.key === '/' && !isEditable) {
				event.preventDefault();
				openSearch();
			} else if (event.key === 'Escape' && searchOpen) {
				searchOpen = false;
			}
		};
		window.addEventListener('keydown', handleShortcut);
		return () => window.removeEventListener('keydown', handleShortcut);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />
	<title>Product Client — Follow products, not algorithms</title>
	<meta name="description" content="A calm product operating system for releases, feedback, docs, and incidents." />
	<meta name="theme-color" content="#070707" />
	<meta property="og:title" content="Product Client" />
	<meta property="og:description" content="Follow products, understand change, and close the loop." />
	<meta property="og:type" content="website" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Theme managed via app.html inline script + $lib/theme -->

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--pc-text)] focus:px-5 focus:py-2 focus:text-sm focus:font-700 focus:text-[var(--pc-bg)]">Skip to content</a>

<div inert={searchOpen ? true : undefined} aria-hidden={searchOpen ? 'true' : undefined}>
	{#if surface === 'workspace'}
		<Header onToggleSidebar={toggleSidebar} onOpenSearch={openSearch} sidebarOpen={mobileOpen} unreadCount={3} />
		<div class="mx-auto flex w-full max-w-[1440px] pc-orbs pc-grain">
			<Sidebar bind:collapsed open={mobileOpen} onClose={() => (mobileOpen = false)} />
			<main id="main" class="min-w-0 flex-1 bg-[var(--pc-bg)] pb-20 min-h-[calc(100dvh-var(--pc-header-h))] lg:pb-0">
				{@render children()}
			</main>
		</div>

		<nav class="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--pc-border-strong)]/20 bg-[var(--pc-bg)]/95 px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden" aria-label="Workspace mobile navigation">
			<a href="/workspace" class="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]"><Home size={17} weight="Outline" /><span>Overview</span></a>
			<a href="/workspace/inbox" class="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]"><Inbox size={17} weight="Outline" /><span>Inbox</span></a>
			<a href="/studio" aria-label="Create a release" class="grid size-10 place-items-center rounded-full bg-[var(--pc-accent)] text-white shadow-[0_6px_20px_rgba(119,152,18,0.22)] transition-transform active:scale-[0.96]"><Add size={18} weight="Outline" /></a>
			<button type="button" onclick={() => openSearch()} class="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]" aria-label="Open workspace search"><Search size={17} weight="Outline" /><span>Search</span></button>
			<a href="/you" class="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]"><UserSquare size={17} weight="Outline" /><span>You</span></a>
		</nav>
	{:else if surface === 'auth'}
		<AuthShell>{@render children()}</AuthShell>
	{:else if surface === 'landing'}
		<main id="main" class="bg-[var(--pc-bg)]">
			{@render children()}
		</main>
	{:else}
		<PublicHeader onOpenSearch={openSearch} />
		<main id="main" class="mx-auto min-h-[calc(100dvh-var(--pc-header-h))] w-full max-w-[1440px] bg-[var(--pc-bg)] pc-orbs pc-grain">
			{@render children()}
		</main>
	{/if}
</div>

{#if surface !== 'auth'}
	<GlobalSearch open={searchOpen} initialQuery={searchInitialQuery} surface={surface} onClose={() => (searchOpen = false)} />
{/if}

<style>
	:global(.sr-only) {
		position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
	}
</style>
