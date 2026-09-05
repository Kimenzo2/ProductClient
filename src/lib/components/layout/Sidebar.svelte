<script lang="ts">
	import { page } from '$app/state';
	import { AlertTriangle, Box, ChartBar, ChevronDown, CloseCircle, FileText, Heart, History, Inbox, Map, MessageDots, Settings } from 'reicon-svelte';
	import { Collapsible } from 'bits-ui';
	import { Avatar, Button, Separator } from '$lib/components/ui';
	import ProductClientLogo from '$lib/components/brand/ProductClientLogo.svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { panelRegistry } from './sidebar/panelRegistry';
	import WorkspaceHoverPanel from './sidebar/WorkspaceHoverPanel.svelte';

	let {
		collapsed = $bindable(false),
		open = false,
		onClose = () => {}
	}: {
		collapsed?: boolean;
		open?: boolean;
		onClose?: () => void;
	} = $props();

	let path = $derived(page.url.pathname);
	let sectionsOpen = $state({ workspace: true });

	const workspaceGroups = [
		{
			label: 'Understand',
			items: [
				{ label: 'Products', href: '/workspace/products', icon: Box },
				{ label: 'Inbox', href: '/workspace/inbox', icon: Inbox, badge: 6 },
				{ label: 'Feedback', href: '/workspace/feedback', icon: MessageDots },
				{ label: 'Docs', href: '/workspace/docs', icon: FileText },
				{ label: 'Proof', href: '/workspace/proof', icon: Heart }
			]
		},
		{
			label: 'Decide',
			items: [
				{ label: 'Product Decisions', href: '/workspace/decisions', icon: Map },
				{ label: 'Roadmap', href: '/workspace/roadmap', icon: Map }
			]
		},
		{
			label: 'Deliver',
			items: [
				{ label: 'Releases', href: '/workspace/releases', icon: History },
				{ label: 'Incidents', href: '/workspace/incidents', icon: AlertTriangle, badge: 2 }
			]
		},
		{
			label: 'Observe',
			items: [{ label: 'Analytics', href: '/workspace/analytics', icon: ChartBar }]
		}
	];
	const workspaceItems = workspaceGroups.flatMap((group) => group.items);

	const activeClass = 'bg-[var(--pc-text)] text-[var(--pc-bg)]';
	const inactiveClass = 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]';
	const focusClass = 'focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]';

	function isActive(href: string) {
		if (href === '/') return path === '/';
		return path === href || path.startsWith(`${href}/`);
	}

	function closeMobile() {
		onClose();
	}

	// ── Internal hover-to-expand — registry imported (see sidebar/README) ──
	const panelDefs = panelRegistry;

	let hoveredHref = $state<string | null>(null);
	let hoverTimer: ReturnType<typeof setTimeout> | null = null;

	function setHovered(href: string | null, immediate = false) {
		if (hoverTimer) clearTimeout(hoverTimer);
		if (href === null) {
			hoverTimer = setTimeout(() => (hoveredHref = null), 120);
		} else {
			const delay = immediate ? 0 : 70;
			if (delay === 0) hoveredHref = href;
			else hoverTimer = setTimeout(() => (hoveredHref = href), delay);
		}
	}

	function keepHovered() {
		if (hoverTimer) clearTimeout(hoverTimer);
	}

	let pinnedHref = $derived(workspaceItems.find((item) => isActive(item.href))?.href ?? null);
	// Hover preview takes precedence; fallback to pinned (Supabase-style) — `hoveredHref !== null` for hover-only
	let displayHref = $derived(hoveredHref ?? pinnedHref);
	let displayPanel = $derived(displayHref ? panelDefs[displayHref] : null);
	let isPreview = $derived(hoveredHref !== null && hoveredHref !== pinnedHref);
	// Show panel on hover preview OR when pinned on a heavy route. Use `hoveredHref !== null` for hover-only.
	let showPanel = $derived(!!displayPanel && (hoveredHref !== null || !!pinnedHref));

	function onRailKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			hoveredHref = null;
			(e.currentTarget as HTMLElement).blur();
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="hidden h-dvh shrink-0 sticky top-0 lg:flex relative" role="navigation" aria-label="Workspace navigation" tabindex="-1" onmouseleave={() => setHovered(null)} onkeydown={onRailKeydown}>
	<aside
		class="flex h-dvh shrink-0 flex-col transition-[width] duration-200 ease-out"
		style:border-right="1px solid var(--pc-border-strong)"
		style:background="var(--pc-bg)"
		class:w-[60px]={collapsed}
		class:w-[240px]={!collapsed}
		aria-label="Primary navigation"
	>
	<div class="flex h-full flex-col overflow-hidden px-2 py-3">
		{#if !collapsed}
			<div class="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 space-y-2 pb-2" style="scrollbar-width: thin; scrollbar-gutter: stable;">
			<Collapsible.Root open={sectionsOpen.workspace} onOpenChange={(value) => (sectionsOpen = { ...sectionsOpen, workspace: value ?? true })}>
				<Collapsible.Trigger class="flex w-full items-center justify-between rounded-lg bg-transparent px-2.5 py-1.5 transition-[background-color] duration-150 hover:bg-[var(--pc-surface-2)] {focusClass}">
					<span class="text-[11px] font-semibold uppercase tracking-[0.08em] leading-[1.1] text-[var(--pc-text-muted)] antialiased">Product loop</span>
					<span class="inline-flex transition-transform duration-150" style:transform={sectionsOpen.workspace ? 'rotate(0deg)' : 'rotate(-90deg)'}><ChevronDown size={12} weight="Outline" aria-hidden="true" /></span>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<div class="mt-2 space-y-6">
						{#each workspaceGroups as group (group.label)}
							<div>
								<p class="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] leading-[1.1] text-[var(--pc-text-faint)] antialiased">{group.label}</p>
								<nav class="space-y-1" aria-label={group.label}>
									{#each group.items as item (item.href)}
										{@const Icon = item.icon}
										<a
											href={item.href}
											aria-current={isActive(item.href) ? 'page' : undefined}
											class="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium leading-[1.3] tracking-[-0.01em] transition-[background-color,color,transform] duration-100 active:scale-[0.98] {isActive(item.href) ? activeClass : inactiveClass} {focusClass}"
											onmouseenter={() => setHovered(item.href)}
											onfocus={() => setHovered(item.href, true)}
											onmouseleave={() => setHovered(null)}
											onblur={() => setHovered(null)}
										>
											<Icon size={16} weight="Outline" aria-hidden="true" /><span class="min-w-0 flex-1 truncate">{item.label}</span>
											{#if item.badge}<span class="grid size-4 place-items-center rounded-full bg-[var(--pc-accent)] text-[11px] font-medium leading-none tracking-[-0.01em] text-white">{item.badge}</span>{/if}
										</a>
									{/each}
								</nav>
							</div>
						{/each}
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
			</div>

			<div class="space-y-2 pt-3 border-t border-[var(--pc-border-strong)]/10">
				<a href="/workspace/settings" class="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-[var(--pc-text-muted)] transition-colors hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)] {focusClass}">
					<Settings size={16} weight="Outline" aria-hidden="true" /><span>Settings</span>
				</a>
				<a href="/you" class="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-[var(--pc-text-muted)] transition-colors hover:bg-[var(--pc-surface-2)] {focusClass}">
					<Avatar src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="Profile" size="sm" /><span class="truncate">Lorenze</span>
				</a>
			</div>
		{:else}
			<!-- Collapsed rail — workspace only (public Discover removed) -->
			<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
				<div class="flex-1 overflow-y-auto overflow-x-hidden py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
					<div class="flex w-full flex-col items-center gap-3 px-1" role="group" aria-label="Workspace groups" onmouseleave={() => setHovered(null)}>
						{#each workspaceGroups as group (group.label)}
							<nav class="flex w-full flex-col items-center gap-1.5" aria-label={group.label}>
								{#each group.items as item (item.href)}
									{@const Icon = item.icon}
									<a
										href={item.href}
										aria-current={isActive(item.href) ? 'page' : undefined}
										aria-label={item.label}
										title={item.label}
										class="relative grid size-10 shrink-0 place-items-center rounded-xl transition-[background-color,color,transform] duration-100 active:scale-[0.96] {isActive(item.href) ? activeClass : inactiveClass} {focusClass} {hoveredHref === item.href ? 'bg-[var(--pc-surface-2)] text-[var(--pc-text)]' : ''}"
										onmouseenter={() => setHovered(item.href)}
										onfocus={() => setHovered(item.href, true)}
									><Icon size={18} weight="Outline" aria-hidden="true" />{#if item.badge}<span class="absolute -right-0.5 -top-0.5 grid size-3.5 place-items-center rounded-full bg-[var(--pc-accent)] text-[7px] font-medium leading-none text-white">{item.badge}</span>{/if}</a>
								{/each}
							</nav>
							{#if group.label !== 'Observe'}<div class="h-px w-6 bg-[var(--pc-border-strong)] opacity-[0.08]" aria-hidden="true"></div>{/if}
						{/each}
					</div>
				</div>
				<div class="flex shrink-0 flex-col items-center gap-2 border-t border-[var(--pc-border-strong)]/10 px-2 pb-1 pt-3">
					<a href="/workspace/settings" aria-label="Settings" title="Settings" class="grid size-10 shrink-0 place-items-center rounded-xl text-[var(--pc-text-muted)] transition-[background-color,color,transform] duration-100 hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)] active:scale-[0.96] {isActive('/workspace/settings') ? activeClass : ''} {focusClass}"><Settings size={18} weight="Outline" aria-hidden="true" /></a>
					<a href="/you" aria-label="Profile — Lorenze" title="Lorenze" class="grid size-10 shrink-0 place-items-center rounded-xl transition-[background-color,color] duration-100 hover:bg-[var(--pc-surface-2)] {focusClass} {isActive('/you') ? activeClass : ''}"><Avatar src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="Profile — Lorenze" size="sm" /></a>
				</div>
			</div>
		{/if}
	</div>
	</aside>

	{#if showPanel && displayPanel}
		<div
			class="flex h-dvh w-[240px] shrink-0 flex-col overflow-hidden border-r bg-[var(--pc-bg)] {isPreview
				? 'fixed top-0 z-[100] opacity-100'
				: 'relative opacity-100'}"
			style:left={isPreview ? (collapsed ? '60px' : '240px') : undefined}
			style:border-color="var(--pc-border-strong)"
			style:background-color="var(--pc-bg)"
			style:opacity="1"
			style:backdrop-filter="none"
			role="navigation"
			aria-label={`${displayPanel.label} internal navigation`}
			onmouseenter={keepHovered}
			onmouseleave={() => setHovered(null)}
			transition:fly={{ x: -8, duration: 150, easing: cubicOut }}
		>
			<WorkspaceHoverPanel
				panel={displayPanel}
				displayHref={displayHref}
				isActive={isActive}
				isPreview={isPreview}
				onKeepHovered={keepHovered}
				onLeave={() => setHovered(null)}
				focusClass={focusClass}
			/>
		</div>
	{/if}
</div>

{#if open}
	<div class="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
		<button type="button" class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={closeMobile} aria-label="Close navigation"></button>
		<aside class="absolute bottom-0 left-0 top-0 flex w-[280px] flex-col overflow-y-auto bg-[var(--pc-bg)] shadow-[16px_0_60px_rgba(0,0,0,0.28)]">
			<div class="flex h-[var(--pc-header-h)] items-center gap-3 px-4">
				<Button variant="icon" size="sm" onclick={closeMobile} aria-label="Close navigation"><CloseCircle size={18} weight="Outline" aria-hidden="true" /></Button>
				<span class="flex items-center gap-2"><ProductClientLogo size={28} /><span class="text-[13px] font-medium">Product Client</span></span>
			</div>
			<div class="space-y-5 px-3 py-3">
				{#each workspaceGroups as group (group.label)}
					<nav class="space-y-0.5" aria-label={group.label}>
						<p class="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] leading-[1.1] antialiased text-[var(--pc-text-faint)]">{group.label}</p>
						{#each group.items as item (item.href)}
							{@const Icon = item.icon}<a href={item.href} onclick={closeMobile} class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] {isActive(item.href) ? activeClass + ' font-medium' : inactiveClass} {focusClass}"><Icon size={16} weight="Outline" aria-hidden="true" /><span class="min-w-0 flex-1 truncate">{item.label}</span>{#if item.badge}<span class="grid size-4 place-items-center rounded-full bg-[var(--pc-accent)] text-[9px] font-medium text-white">{item.badge}</span>{/if}</a>
						{/each}
					</nav>
				{/each}
			</div>
		</aside>
	</div>
{/if}
