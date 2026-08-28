<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import 'virtual:uno.css';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';

	let { children } = $props();

	let collapsed = $state(false);
	let mobileOpen = $state(false);
	let searchQuery = $state('');

	function toggleSidebar() {
		if (window.innerWidth < 1024) {
			mobileOpen = !mobileOpen;
		} else {
			collapsed = !collapsed;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />
	<title>Product Client — Follow products, not algorithms</title>
	<meta name="description" content="Follow products, not algorithms. Get launches, changelogs, incidents and events — focus, not feed noise." />
	<meta name="theme-color" content="#0d0d0d" />
	<meta property="og:title" content="Product Client" />
	<meta property="og:description" content="Product Client — follow products for every State update." />
	<meta property="og:type" content="website" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<ModeWatcher defaultMode="dark" darkClassNames={['dark']} lightClassNames={['light']} disableTransitions={false} />

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--pc-text)] focus:text-[var(--pc-bg)] focus:px-5 focus:py-2 focus:text-sm focus:font-700">Skip to content</a>

<Header sidebarCollapsed={collapsed} onToggleSidebar={toggleSidebar} onSearch={(q) => (searchQuery = q)} />

<div class="mx-auto max-w-[1440px] w-full flex pc-orbs pc-grain">
	<Sidebar collapsed={collapsed} open={mobileOpen} onClose={() => (mobileOpen = false)} />
	<main id="main" class="min-w-0 flex-1 bg-[var(--pc-bg)] min-h-[calc(100dvh-var(--pc-header-h))]">
		{@render children()}
	</main>
</div>

<style>
	:global(.sr-only) {
		position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
	}
</style>
