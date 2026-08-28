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
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<ModeWatcher defaultMode="dark" darkClassNames={['dark']} lightClassNames={['light']} disableTransitions={false} />

<Header sidebarCollapsed={collapsed} onToggleSidebar={toggleSidebar} onSearch={(q) => (searchQuery = q)} />

<div class="flex">
	<Sidebar collapsed={collapsed} open={mobileOpen} onClose={() => (mobileOpen = false)} />
	<main class="min-w-0 flex-1 bg-[var(--pc-bg)]">
		{@render children()}
	</main>
</div>
