<script lang="ts">
	import { page } from '$app/state';
	import { Compass, Heart, Rocket, Bell, CloseCircle, Trophy, ChevronDown, Plus } from 'reicon-svelte';

	let {
		open = false,
		onClose
	}: { collapsed?: boolean; open?: boolean; onClose?: () => void } = $props();

	let collapsed = $state(false);
	let path = $derived(page.url.pathname);

	// Expandable sections
	let sectionsOpen = $state<Record<string, boolean>>({
		navigate: true,
		workspace: true
	});

	function toggleSection(key: string) {
		sectionsOpen[key] = !sectionsOpen[key];
	}

	function isActive(href: string) {
		if (href === '/') return path === '/';
		return path.startsWith(href);
	}

	const navItems = [
		{ label: 'Discover', href: '/', icon: Compass },
		{ label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
		{ label: 'Following', href: '/following', icon: Heart },
		{ label: 'Launchpad', href: '/launchpad', icon: Rocket }
	];

	const workspaceItems = [
		{ label: 'Studio', href: '/studio', icon: Plus },
		{ label: 'Notifications', href: '/notifications', icon: Bell, badge: 3 }
	];
</script>

<!-- Desktop sidebar -->
<aside
	class="hidden lg:flex flex-col h-[calc(100dvh-var(--pc-header-h))] sticky top-[var(--pc-header-h)] shrink-0 transition-[width] duration-200 ease-out"
	style:border-right="1px solid rgba(255, 255, 255, 0.06)"
	class:w-[72px]={collapsed}
	class:w-[240px]={!collapsed}
	aria-label="Primary navigation"
>
	<div class="flex flex-col h-full py-3 px-2 overflow-hidden">
		{#if !collapsed}
			<!-- ─── Main nav section ─── -->
			<div class="mb-1">
				<button
					onclick={() => toggleSection('navigate')}
					class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-[var(--pc-surface-2)] transition-colors"
				>
					<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--pc-text-muted)]">Navigation</span>
					<span class="inline-flex transition-transform duration-150" style:transform={sectionsOpen.navigate ? 'rotate(0deg)' : 'rotate(-90deg)'}>
						<ChevronDown size={12} weight="Outline" />
					</span>
				</button>

				{#if sectionsOpen.navigate}
					<nav class="space-y-0.5 mt-0.5">
						{#each navItems as it}
							{@const Icon = it.icon}
							<a
								href={it.href}
								aria-current={isActive(it.href) ? 'page' : undefined}
								class={[
									'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-normal transition-[background-color,color] duration-100',
									isActive(it.href)
										? 'bg-[var(--pc-text)] text-[var(--pc-bg)]'
										: 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]'
								].join(' ')}
							>
								<Icon size={16} weight="Outline" />
								<span>{it.label}</span>
							</a>
						{/each}
					</nav>
				{/if}
			</div>

			<!-- ─── Divider ─── -->
			<div class="my-2 mx-2.5 h-px bg-[var(--pc-border-strong)] opacity-15"></div>

			<!-- ─── Workspace section ─── -->
			<div class="mb-1">
				<button
					onclick={() => toggleSection('workspace')}
					class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-[var(--pc-surface-2)] transition-colors"
				>
					<span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--pc-text-muted)]">Workspace</span>
					<span class="inline-flex transition-transform duration-150" style:transform={sectionsOpen.workspace ? 'rotate(0deg)' : 'rotate(-90deg)'}>
						<ChevronDown size={12} weight="Outline" />
					</span>
				</button>

				{#if sectionsOpen.workspace}
					<nav class="space-y-0.5 mt-0.5">
						{#each workspaceItems as it}
							{@const Icon = it.icon}
							<a
								href={it.href}
								aria-current={isActive(it.href) ? 'page' : undefined}
								class={[
									'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-normal transition-[background-color,color] duration-100',
									isActive(it.href)
										? 'bg-[var(--pc-text)] text-[var(--pc-bg)]'
										: 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]'
								].join(' ')}
							>
								<Icon size={16} weight="Outline" />
								<span class="flex-1">{it.label}</span>
								{#if it.badge}
									<span class="size-4 grid place-items-center rounded-full bg-[var(--pc-accent)] text-[9px] font-medium text-white">{it.badge}</span>
								{/if}
							</a>
						{/each}
					</nav>
				{/if}
			</div>

			<!-- ─── Spacer ─── -->
			<div class="flex-1"></div>

			<!-- ─── Collapse toggle ─── -->
			<button
				onclick={() => (collapsed = true)}
				class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] text-[var(--pc-text-faint)] opacity-40 hover:opacity-70 hover:bg-[var(--pc-surface-2)] transition-all duration-100"
				aria-label="Collapse sidebar"
			>
				<span class="inline-flex" style:transform="rotate(90deg)"><ChevronDown size={16} weight="Outline" /></span>
				<span>Collapse</span>
			</button>

			<!-- ─── Profile ─── -->
			<a href="/you" class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[var(--pc-surface-2)] transition-colors duration-100 mt-1">
				<img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="avatar" class="size-6 rounded-full object-cover" />
				<span class="text-[13px] text-[var(--pc-text-muted)] truncate">Profile</span>
			</a>

		{:else}
			<!-- ─── Collapsed: icons only ─── -->
			<nav class="flex flex-col items-center gap-1 mt-1">
				{#each navItems as it}
					{@const Icon = it.icon}
					<a
						href={it.href}
						aria-current={isActive(it.href) ? 'page' : undefined}
						aria-label={it.label}
						title={it.label}
						class={[
							'grid size-10 place-items-center rounded-xl transition-[background-color,color] duration-100',
							isActive(it.href)
								? 'bg-[var(--pc-text)] text-[var(--pc-bg)]'
								: 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]'
						].join(' ')}
					>
						<Icon size={18} weight="Outline" />
					</a>
				{/each}
			</nav>

			<div class="my-2 mx-2 h-px bg-[var(--pc-border-strong)] opacity-15"></div>

			<nav class="flex flex-col items-center gap-1">
				{#each workspaceItems as it}
					{@const Icon = it.icon}
					<a
						href={it.href}
						aria-current={isActive(it.href) ? 'page' : undefined}
						aria-label={it.label}
						title={it.label}
						class={[
							'grid size-10 place-items-center rounded-xl transition-[background-color,color] duration-100 relative',
							isActive(it.href)
								? 'bg-[var(--pc-text)] text-[var(--pc-bg)]'
								: 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]'
						].join(' ')}
					>
						<Icon size={18} weight="Outline" />
						{#if it.badge}
							<span class="absolute -right-0.5 -top-0.5 size-3.5 grid place-items-center rounded-full bg-[var(--pc-accent)] text-[8px] font-medium text-white">{it.badge}</span>
						{/if}
					</a>
				{/each}
			</nav>

			<div class="flex-1"></div>

			<!-- Expand toggle -->
			<button
				onclick={() => (collapsed = false)}
				class="grid size-10 place-items-center rounded-xl text-[var(--pc-text-faint)] opacity-40 hover:opacity-70 hover:bg-[var(--pc-surface-2)] transition-all duration-100"
				aria-label="Expand sidebar"
			>
				<span class="inline-flex" style:transform="rotate(-90deg)"><ChevronDown size={18} weight="Outline" /></span>
			</button>

			<!-- Profile -->
			<a href="/you" aria-label="Profile" class="grid place-items-center mt-1">
				<img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="avatar" class="size-6 rounded-full object-cover" />
			</a>
		{/if}
	</div>
</aside>

<!-- Mobile drawer -->
{#if open}
	<button
		aria-label="Close navigation"
		onclick={onClose}
		class="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
	></button>
	<aside
		class="lg:hidden fixed left-0 top-0 z-50 h-dvh w-[260px] bg-[var(--pc-bg)] overflow-y-auto flex flex-col"
	>
		<div class="flex h-[var(--pc-header-h)] items-center gap-3 px-4">
			<button
				onclick={onClose}
				class="grid size-8 place-items-center rounded-xl hover:bg-[var(--pc-surface-2)] transition-colors"
				aria-label="Close"
			>
				<CloseCircle size={18} weight="Outline" />
			</button>
			<span class="flex items-center gap-2">
				<span class="grid size-7 place-items-center rounded-[8px] bg-[var(--pc-accent)]"><Rocket size={14} weight="Outline" color="white" /></span>
				<span class="text-[13px] font-medium">Product Client</span>
			</span>
		</div>

		<nav class="px-3 pb-3 space-y-0.5">
			{#each navItems as it}
				{@const MIcon = it.icon}
				<a
					href={it.href}
					onclick={onClose}
					class={[
						'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px]',
						isActive(it.href) ? 'bg-[var(--pc-text)] text-[var(--pc-bg)] font-medium' : 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)]'
					].join(' ')}
				>
					<MIcon size={16} weight="Outline" />
					<span>{it.label}</span>
				</a>
			{/each}
		</nav>

		<div class="mx-4 h-px bg-[var(--pc-border-strong)] opacity-15"></div>

		<nav class="px-3 py-3 space-y-0.5">
			{#each workspaceItems as it}
				{@const MIcon = it.icon}
				<a
					href={it.href}
					onclick={onClose}
					class={[
						'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px]',
						isActive(it.href) ? 'bg-[var(--pc-text)] text-[var(--pc-bg)] font-medium' : 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)]'
					].join(' ')}
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
{/if}
