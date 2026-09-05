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
	import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, OG_IMAGE } from '$lib/site';

	let { children } = $props();

	let collapsed = $state(false);
	let mobileOpen = $state(false);
	let searchOpen = $state(false);
	let searchInitialQuery = $state('');
	let searchTrigger = $state<HTMLElement | null>(null);
	let surface: AppSurface = $derived(surfaceForPath(page.url.pathname));
	let canonical = $derived(`${SITE_URL}${page.url.pathname || '/'}`);

	function toggleSidebar() {
		if (window.innerWidth < 1024) mobileOpen = !mobileOpen;
		else collapsed = !collapsed;
	}

	function openSearch(query = '') {
		searchTrigger = document.activeElement as HTMLElement | null;
		searchInitialQuery = query;
		searchOpen = true;
		mobileOpen = false;
	}

	function closeSearch() {
		searchOpen = false;
		queueMicrotask(() => searchTrigger?.focus());
	}

	$effect(() => {
		// Prevent double scrollbar on Studio/workspace: only inner scroll should show
		const isWorkspace = surface === 'workspace';
		if (typeof document !== 'undefined') {
			document.documentElement.style.overflow = isWorkspace ? 'hidden' : '';
			document.body.style.overflow = isWorkspace ? 'hidden' : '';
			document.documentElement.style.height = isWorkspace ? '100%' : '';
			document.body.style.height = isWorkspace ? '100%' : '';
		}
	});

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
	{#key canonical}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
	{/key}
	{#if surface === 'workspace' || surface === 'auth'}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow, max-image-preview:large" />
	{/if}
	<title>{SITE_TITLE}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
	<meta name="theme-color" content="#070707" />
	<meta property="og:title" content={SITE_TITLE} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:image" content={OG_IMAGE} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SITE_TITLE} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:image" content={OG_IMAGE} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Theme managed via app.html inline script + $lib/theme -->

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--pc-text)] focus:px-5 focus:py-2 focus:text-sm focus:font-bold focus:text-[var(--pc-bg)] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]">Skip to content</a>

<div inert={searchOpen ? true : undefined} aria-hidden={searchOpen ? 'true' : undefined}>
	{#if surface === 'workspace'}
		<div class="flex h-dvh overflow-hidden workspace">
			<Sidebar bind:collapsed open={mobileOpen} onClose={() => (mobileOpen = false)} />
			<div class="flex min-w-0 flex-1 flex-col overflow-hidden min-h-0">
				<Header onToggleSidebar={toggleSidebar} onOpenSearch={openSearch} sidebarOpen={mobileOpen} collapsed={collapsed} unreadCount={3} />
				<div class="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
					<div class="mx-auto w-full max-w-[1440px] pc-orbs pc-grain">
						<main id="main" class="min-w-0 flex-1 bg-[var(--pc-bg)] pb-20 lg:pb-0">
							{@render children()}
						</main>
					</div>
				</div>
			</div>
		</div>

		<nav class="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--pc-border-strong)]/20 bg-[var(--pc-bg)] px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] lg:hidden" aria-label="Workspace mobile navigation">
			<a href="/workspace" class="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium leading-[1.1] tracking-[0.02em] text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]"><Home size={17} weight="Outline" /><span>Overview</span></a>
			<a href="/workspace/inbox" class="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium leading-[1.1] tracking-[0.02em] text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]"><Inbox size={17} weight="Outline" /><span>Inbox</span></a>
			<a href="/studio" aria-label="Create a release" class="grid size-10 place-items-center rounded-full bg-[var(--pc-accent)] text-white transition-transform active:scale-[0.96]"><Add size={18} weight="Outline" /></a>
			<button type="button" onclick={() => openSearch()} class="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium leading-[1.1] tracking-[0.02em] text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]" aria-label="Open workspace search"><Search size={17} weight="Outline" /><span>Search</span></button>
			<a href="/you" class="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium leading-[1.1] tracking-[0.02em] text-[var(--pc-text-muted)] transition-[background-color,color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]"><UserSquare size={17} weight="Outline" /><span>You</span></a>
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
	<GlobalSearch open={searchOpen} initialQuery={searchInitialQuery} surface={surface} onClose={closeSearch} />
	{/if}

<style>
	:global(.sr-only) {
		position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
	}
</style>
