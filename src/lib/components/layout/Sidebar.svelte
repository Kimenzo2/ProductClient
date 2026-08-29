<script lang="ts">
	import { page } from '$app/state';
	import { Compass, Heart, Rocket, Bell, CloseCircle, Trophy, ChevronDown, Plus, Box } from 'reicon-svelte';
	import { Collapsible } from 'bits-ui';
	import { Avatar, Button, Separator } from '$lib/components/ui';

	let {
		open = false,
		onClose
	}: { collapsed?: boolean; open?: boolean; onClose?: () => void } = $props();

	let collapsed = $state(false);
	let path = $derived(page.url.pathname);

	let sectionsOpen = $state<Record<string, boolean>>({
		navigate: true,
		workspace: true
	});

	function toggleSection(key: string) {
		sectionsOpen = { ...sectionsOpen, [key]: !sectionsOpen[key] };
	}

	function isActive(href: string) {
		if (href === '/') return path === '/';
		return path.startsWith(href);
	}

	const navItems = [
		{ label: 'Discover', href: '/', icon: Compass },
		{ label: 'Products', href: '/products', icon: Box },
		{ label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
		{ label: 'Following', href: '/following', icon: Heart },
		{ label: 'Launchpad', href: '/launchpad', icon: Rocket }
	];

	const workspaceItems = [
		{ label: 'Studio', href: '/studio', icon: Plus },
		{ label: 'Notifications', href: '/notifications', icon: Bell, badge: 3 }
	];

	const activeClass = 'bg-[var(--pc-text)] text-[var(--pc-bg)]';
	const inactiveClass = 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]';
	const focusClass = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-accent-light)]';
</script>

<!-- Desktop sidebar -->
<aside
	class="hidden lg:flex flex-col h-[calc(100dvh-var(--pc-header-h))] sticky top-[var(--pc-header-h)] shrink-0 transition-[width] duration-200 ease-out"
	style:border-right="1px solid var(--pc-border-strong)"
	class:w-[72px]={collapsed}
	class:w-[240px]={!collapsed}
	aria-label="Primary navigation"
>
	<div class="flex flex-col h-full py-3 px-2 overflow-hidden">
		{#if !collapsed}
			<!-- Navigation section -->
			<Collapsible.Root open={sectionsOpen.navigate} onOpenChange={(v) => { sectionsOpen = { ...sectionsOpen, navigate: v ?? true }; }}>
				<Collapsible.Trigger class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-[var(--pc-surface-2)] transition-colors {focusClass}">
					<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--pc-text-muted)]">Navigation</span>
					<span class="inline-flex transition-transform duration-150" style:transform={sectionsOpen.navigate ? 'rotate(0deg)' : 'rotate(-90deg)'}>
						<ChevronDown size={12} weight="Outline" />
					</span>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<nav class="space-y-0.5 mt-0.5">
						{#each navItems as it (it.href)}
							{@const Icon = it.icon}
							<a
								href={it.href}
								aria-current={isActive(it.href) ? 'page' : undefined}
								class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-normal transition-[background-color,color] duration-100 {isActive(it.href) ? activeClass : inactiveClass} {focusClass}"
							>
								<Icon size={16} weight="Outline" />
								<span>{it.label}</span>
							</a>
						{/each}
					</nav>
				</Collapsible.Content>
			</Collapsible.Root>

			<Separator class="my-2 mx-2.5" />

			<!-- Workspace section -->
			<Collapsible.Root open={sectionsOpen.workspace} onOpenChange={(v) => { sectionsOpen = { ...sectionsOpen, workspace: v ?? true }; }}>
				<Collapsible.Trigger class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-[var(--pc-surface-2)] transition-colors {focusClass}">
					<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--pc-text-muted)]">Workspace</span>
					<span class="inline-flex transition-transform duration-150" style:transform={sectionsOpen.workspace ? 'rotate(0deg)' : 'rotate(-90deg)'}>
						<ChevronDown size={12} weight="Outline" />
					</span>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<nav class="space-y-0.5 mt-0.5">
						{#each workspaceItems as it (it.href)}
							{@const Icon = it.icon}
							<a
								href={it.href}
								aria-current={isActive(it.href) ? 'page' : undefined}
								class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-normal transition-[background-color,color] duration-100 {isActive(it.href) ? activeClass : inactiveClass} {focusClass}"
							>
								<Icon size={16} weight="Outline" />
								<span class="flex-1">{it.label}</span>
								{#if it.badge}
									<span class="size-4 grid place-items-center rounded-full bg-[var(--pc-accent)] text-[9px] font-medium text-white">{it.badge}</span>
								{/if}
							</a>
						{/each}
					</nav>
				</Collapsible.Content>
			</Collapsible.Root>

			<!-- Collapse toggle -->
			<div class="mt-auto pt-3 space-y-2">
				<Button variant="ghost" size="sm" onclick={() => (collapsed = true)} class="w-full justify-start gap-2.5 px-2.5 opacity-65 hover:opacity-100">
					<span class="inline-flex" style:transform="rotate(90deg)"><ChevronDown size={16} weight="Outline" /></span>
					<span>Collapse</span>
				</Button>

				<!-- Profile -->
				<a href="/you" class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--pc-surface-2)] transition-colors {focusClass}">
					<Avatar src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="Profile" size="sm" />
					<span class="text-[13px] text-[var(--pc-text-muted)] truncate">Profile</span>
				</a>
			</div>

		{:else}
			<!-- Collapsed: icons only -->
			<nav class="flex flex-col items-center gap-1 mt-1">
				{#each navItems as it (it.href)}
					{@const Icon = it.icon}
					<a
						href={it.href}
						aria-current={isActive(it.href) ? 'page' : undefined}
						aria-label={it.label}
						title={it.label}
						class="grid size-10 place-items-center rounded-xl transition-[background-color,color] duration-100 {isActive(it.href) ? activeClass : inactiveClass} {focusClass}"
					>
						<Icon size={18} weight="Outline" />
					</a>
				{/each}
			</nav>

			<Separator class="my-2 mx-2" />

			<nav class="flex flex-col items-center gap-1">
				{#each workspaceItems as it (it.href)}
					{@const Icon = it.icon}
					<a
						href={it.href}
						aria-current={isActive(it.href) ? 'page' : undefined}
						aria-label={it.label}
						title={it.label}
						class="grid size-10 place-items-center rounded-xl transition-[background-color,color] duration-100 relative {isActive(it.href) ? activeClass : inactiveClass} {focusClass}"
					>
						<Icon size={18} weight="Outline" />
						{#if it.badge}
							<span class="absolute -top-0.5 -right-0.5 size-3.5 grid place-items-center rounded-full bg-[var(--pc-accent)] text-[7px] font-medium text-white">{it.badge}</span>
						{/if}
					</a>
				{/each}
			</nav>

			<!-- Expand toggle -->
			<div class="mt-auto pt-3 flex flex-col items-center">
				<Button variant="icon" size="sm" onclick={() => (collapsed = false)} aria-label="Expand sidebar" class={focusClass}>
					<span class="inline-flex" style:transform="rotate(-90deg)"><ChevronDown size={18} weight="Outline" /></span>
				</Button>
			</div>
		{/if}
	</div>
</aside>

<!-- Mobile drawer -->
{#if open}
	<div class="fixed inset-0 z-50 lg:hidden">
		<!-- Backdrop -->
		<button class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={onClose} aria-label="Close sidebar"></button>

		<!-- Drawer -->
		<aside class="absolute left-0 top-0 bottom-0 w-[260px] bg-[var(--pc-bg)] flex flex-col overflow-hidden">
			<div class="flex h-[var(--pc-header-h)] items-center gap-3 px-4">
				<Button variant="icon" size="sm" onclick={onClose} aria-label="Close">
					<CloseCircle size={18} weight="Outline" />
				</Button>
				<span class="flex items-center gap-2">
					<span class="grid size-7 place-items-center rounded-[8px] bg-[var(--pc-accent)]"><Rocket size={14} weight="Outline" color="white" /></span>
					<span class="text-[13px] font-medium">Product Client</span>
				</span>
			</div>

			<nav class="px-3 pb-3 space-y-0.5">
				{#each navItems as it (it.href)}
					{@const MIcon = it.icon}
					<a
						href={it.href}
						onclick={onClose}
						class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] {isActive(it.href) ? activeClass + ' font-medium' : 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)]'} {focusClass}"
					>
						<MIcon size={16} weight="Outline" />
						<span>{it.label}</span>
					</a>
				{/each}
			</nav>

			<Separator class="mx-4" />

			<nav class="px-3 py-3 space-y-0.5">
				{#each workspaceItems as it (it.href)}
					{@const MIcon = it.icon}
					<a
						href={it.href}
						onclick={onClose}
						class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] {isActive(it.href) ? activeClass + ' font-medium' : 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)]'} {focusClass}"
					>
						<MIcon size={16} weight="Outline" />
						<span class="flex-1">{it.label}</span>
						{#if it.badge}
							<span class="size-4 grid place-items-center rounded-full bg-[var(--pc-accent)] text-[9px] font-medium text-white">{it.badge}</span>
						{/if}
					</a>
				{/each}
			</nav>
		</aside>
	</div>
{/if}
