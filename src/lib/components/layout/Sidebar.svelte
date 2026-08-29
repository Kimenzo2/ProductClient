<script lang="ts">
	import { page } from '$app/state';
	import { AlertTriangle, Box, ChartBar, ChevronDown, CloseCircle, Compass, FileText, Heart, History, Home, Inbox, Map, MessageDots, Rocket, Settings } from 'reicon-svelte';
	import { Collapsible } from 'bits-ui';
	import { Avatar, Button, Separator } from '$lib/components/ui';

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
	let sectionsOpen = $state({ discover: true, workspace: true });

	const publicItems = [
		{ label: 'Discover', href: '/', icon: Compass },
		{ label: 'Products', href: '/products', icon: Box },
		{ label: 'Following', href: '/following', icon: Heart },
		{ label: 'Launches', href: '/launchpad', icon: Rocket }
	];

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
				{ label: 'Decision threads', href: '/workspace/decisions', icon: Map },
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
	const focusClass = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-accent-light)]';

	function isActive(href: string) {
		if (href === '/') return path === '/';
		return path === href || path.startsWith(`${href}/`);
	}

	function closeMobile() {
		onClose();
	}
</script>

<aside
	class="hidden h-[calc(100dvh-var(--pc-header-h))] shrink-0 flex-col sticky top-[var(--pc-header-h)] transition-[width] duration-200 ease-out lg:flex"
	style:border-right="1px solid var(--pc-border-strong)"
	class:w-[72px]={collapsed}
	class:w-[240px]={!collapsed}
	aria-label="Primary navigation"
>
	<div class="flex h-full flex-col overflow-hidden px-2 py-3">
		{#if !collapsed}
			<Collapsible.Root open={sectionsOpen.discover} onOpenChange={(value) => (sectionsOpen = { ...sectionsOpen, discover: value ?? true })}>
				<Collapsible.Trigger class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors hover:bg-[var(--pc-surface-2)] {focusClass}">
					<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--pc-text-muted)]">Discover</span>
					<span class="inline-flex transition-transform duration-150" style:transform={sectionsOpen.discover ? 'rotate(0deg)' : 'rotate(-90deg)'}><ChevronDown size={12} weight="Outline" /></span>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<nav class="mt-0.5 space-y-0.5" aria-label="Discover">
						{#each publicItems as item (item.href)}
							{@const Icon = item.icon}
							<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} class="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-[background-color,color] duration-100 {isActive(item.href) ? activeClass : inactiveClass} {focusClass}">
								<Icon size={16} weight="Outline" /><span>{item.label}</span>
							</a>
						{/each}
					</nav>
				</Collapsible.Content>
			</Collapsible.Root>

			<Separator class="mx-2.5 my-2" />

			<Collapsible.Root open={sectionsOpen.workspace} onOpenChange={(value) => (sectionsOpen = { ...sectionsOpen, workspace: value ?? true })}>
				<Collapsible.Trigger class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors hover:bg-[var(--pc-surface-2)] {focusClass}">
					<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--pc-text-muted)]">Product loop</span>
					<span class="inline-flex transition-transform duration-150" style:transform={sectionsOpen.workspace ? 'rotate(0deg)' : 'rotate(-90deg)'}><ChevronDown size={12} weight="Outline" /></span>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<div class="mt-1 space-y-4">
						{#each workspaceGroups as group (group.label)}
							<div>
								<p class="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-text-faint)]">{group.label}</p>
								<nav class="space-y-0.5" aria-label={group.label}>
									{#each group.items as item (item.href)}
										{@const Icon = item.icon}
										<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} class="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-[background-color,color] duration-100 {isActive(item.href) ? activeClass : inactiveClass} {focusClass}">
											<Icon size={16} weight="Outline" /><span class="min-w-0 flex-1 truncate">{item.label}</span>
											{#if item.badge}<span class="grid size-4 place-items-center rounded-full bg-[var(--pc-accent)] text-[9px] font-medium text-white">{item.badge}</span>{/if}
										</a>
									{/each}
								</nav>
							</div>
						{/each}
					</div>
				</Collapsible.Content>
			</Collapsible.Root>

			<div class="mt-auto space-y-2 pt-3">
				<a href="/workspace/settings" class="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-[var(--pc-text-muted)] transition-colors hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)] {focusClass}">
					<Settings size={16} weight="Outline" /><span>Settings</span>
				</a>
				<Button variant="ghost" size="sm" onclick={() => (collapsed = true)} class="w-full justify-start gap-2.5 px-2.5 opacity-65 hover:opacity-100">
					<span class="inline-flex" style:transform="rotate(90deg)"><ChevronDown size={16} weight="Outline" /></span><span>Collapse</span>
				</Button>
				<a href="/you" class="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-[var(--pc-text-muted)] transition-colors hover:bg-[var(--pc-surface-2)] {focusClass}">
					<Avatar src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="Profile" size="sm" /><span class="truncate">Lorenze</span>
				</a>
			</div>
		{:else}
			<nav class="mt-1 flex flex-col items-center gap-1" aria-label="Discover">
				{#each publicItems as item (item.href)}
					{@const Icon = item.icon}
					<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} aria-label={item.label} title={item.label} class="grid size-10 place-items-center rounded-xl transition-[background-color,color] duration-100 {isActive(item.href) ? activeClass : inactiveClass} {focusClass}"><Icon size={18} weight="Outline" /></a>
				{/each}
			</nav>
			<Separator class="mx-2 my-2" />
			<nav class="flex flex-col items-center gap-1" aria-label="Product loop">
				{#each workspaceItems as item (item.href)}
					{@const Icon = item.icon}
					<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} aria-label={item.label} title={item.label} class="relative grid size-10 place-items-center rounded-xl transition-[background-color,color] duration-100 {isActive(item.href) ? activeClass : inactiveClass} {focusClass}"><Icon size={18} weight="Outline" />{#if item.badge}<span class="absolute -right-0.5 -top-0.5 grid size-3.5 place-items-center rounded-full bg-[var(--pc-accent)] text-[7px] font-medium text-white">{item.badge}</span>{/if}</a>
				{/each}
			</nav>
			<div class="mt-auto flex flex-col items-center pt-3">
				<Button variant="icon" size="sm" onclick={() => (collapsed = false)} aria-label="Expand sidebar" class={focusClass}><span class="inline-flex" style:transform="rotate(-90deg)"><ChevronDown size={18} weight="Outline" /></span></Button>
			</div>
		{/if}
	</div>
</aside>

{#if open}
	<div class="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
		<button type="button" class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={closeMobile} aria-label="Close navigation"></button>
		<aside class="absolute bottom-0 left-0 top-0 flex w-[280px] flex-col overflow-y-auto bg-[var(--pc-bg)] shadow-[16px_0_60px_rgba(0,0,0,0.28)]">
			<div class="flex h-[var(--pc-header-h)] items-center gap-3 px-4">
				<Button variant="icon" size="sm" onclick={closeMobile} aria-label="Close navigation"><CloseCircle size={18} weight="Outline" /></Button>
				<span class="flex items-center gap-2"><span class="grid size-7 place-items-center rounded-[8px] bg-[var(--pc-accent)]"><Rocket size={14} weight="Outline" color="white" /></span><span class="text-[13px] font-medium">Product Client</span></span>
			</div>
			<nav class="space-y-0.5 px-3 pb-3" aria-label="Discover">
				<p class="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--pc-text-faint)]">Discover</p>
				{#each publicItems as item (item.href)}
					{@const Icon = item.icon}<a href={item.href} onclick={closeMobile} class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] {isActive(item.href) ? activeClass + ' font-medium' : inactiveClass} {focusClass}"><Icon size={16} weight="Outline" /><span>{item.label}</span></a>
				{/each}
			</nav>
			<Separator class="mx-4" />
			<div class="space-y-5 px-3 py-3">
				{#each workspaceGroups as group (group.label)}
					<nav class="space-y-0.5" aria-label={group.label}>
						<p class="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--pc-text-faint)]">{group.label}</p>
						{#each group.items as item (item.href)}
							{@const Icon = item.icon}<a href={item.href} onclick={closeMobile} class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] {isActive(item.href) ? activeClass + ' font-medium' : inactiveClass} {focusClass}"><Icon size={16} weight="Outline" /><span class="min-w-0 flex-1 truncate">{item.label}</span>{#if item.badge}<span class="grid size-4 place-items-center rounded-full bg-[var(--pc-accent)] text-[9px] font-medium text-white">{item.badge}</span>{/if}</a>
						{/each}
					</nav>
				{/each}
			</div>
		</aside>
	</div>
{/if}
