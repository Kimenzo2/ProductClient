<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Menu, Search, Add, Sun, Moon, Bell, Rocket } from 'reicon-svelte';

	let {
		onToggleSidebar,
		onSearch
	}: {
		sidebarCollapsed?: boolean;
		onToggleSidebar: () => void;
		onSearch?: (q: string) => void;
	} = $props();

	let search = $state('');
</script>

<header
	class="sticky top-0 z-40 border-b border-[var(--pc-border)] bg-[var(--pc-surface)]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--pc-surface)]/80"
>
	<div class="mx-auto max-w-[1440px] flex h-[var(--pc-header-h)] items-center gap-3 md:gap-4 px-3 md:px-4 w-full">
		<!-- Left: menu + logo -->
		<div class="flex items-center gap-2 md:gap-3 shrink-0">
			<button
				aria-label="Toggle navigation"
				aria-expanded="false"
				onclick={onToggleSidebar}
				class="grid size-9 place-items-center rounded-full hover:bg-[var(--pc-surface-2)] transition-colors duration-200 lg:hidden"
			>
				<Menu size={20} weight="Outline" />
			</button>

			<a href="/" class="flex items-center gap-2.5">
				<span class="grid size-8 place-items-center rounded-[9px] bg-[var(--pc-accent)] text-white shadow-[var(--pc-shadow-card)]">
					<Rocket size={16} weight="Outline" color="white" />
				</span>
				<span class="hidden sm:block leading-none">
					<span class="text-[15px] font-800 tracking-tight text-[var(--pc-text)]">Product Client</span>
					<span class="block text-[10px] font-600 tracking-[0.12em] uppercase text-[var(--pc-text-faint)]">Build • Ship • Focus</span>
				</span>
				<span class="sm:hidden text-[15px] font-800 tracking-tight text-[var(--pc-text)]">PC</span>
			</a>
		</div>

		<!-- Center: search -->
		<div class="hidden md:flex flex-1 justify-center px-4">
			<div class="flex w-full max-w-[480px] items-center gap-2">
				<label class="flex flex-1 items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3.5 py-2 text-sm focus-within:border-[var(--pc-border-strong)] focus-within:bg-[var(--pc-surface)] transition-colors shadow-sm">
					<Search size={16} weight="Outline" />
					<input
						bind:value={search}
						onkeydown={(e) => {
							if (e.key === 'Enter') onSearch?.(search);
						}}
						placeholder="Search products, makers..."
						class="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--pc-text-faint)]"
						aria-label="Search"
					/>
					<span class="hidden xl:inline-flex items-center gap-1 rounded-full bg-[var(--pc-surface-2)] border border-[var(--pc-border)] px-2 py-0.5 text-[10px] font-600 text-[var(--pc-text-muted)]">⌘K</span>
				</label>
			</div>
		</div>

	<!-- Right: actions –  open-source, launch -->
	<div class="flex items-center gap-1 md:gap-2 ml-auto">
		<!-- mobile search icon -->
		<button
			aria-label="Search"
			class="grid md:hidden size-9 place-items-center rounded-full hover:bg-[var(--pc-surface-2)]"
			onclick={() => onSearch?.(search)}
		>
			<Search size={18} weight="Outline" />
		</button>

		<a
			href="/studio"
			class="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-accent)] hover:bg-[var(--pc-accent-hover)] px-4 py-2 text-sm font-700 text-white shadow-sm transition-colors"
		>
			<Add size={16} weight="Outline" />
			<span class="hidden lg:inline">Launch</span>
			<span class="lg:hidden">Launch</span>
		</a>
		<a
			href="/studio"
			aria-label="Launch"
			class="grid sm:hidden size-9 place-items-center rounded-full bg-[var(--pc-accent)] text-white"
		>
			<Add size={16} weight="Outline" />
		</a>

		<button
			onclick={toggleMode}
			aria-label="Toggle theme"
			class="grid size-9 place-items-center rounded-full hover:bg-[var(--pc-surface-2)] transition-colors"
			title="Toggle theme"
		>
			{#if mode.current === 'dark'}
				<Sun size={18} weight="Outline" />
			{:else}
				<Moon size={18} weight="Outline" />
			{/if}
		</button>

		<button
			aria-label="Notifications"
			class="relative grid size-9 place-items-center rounded-full hover:bg-[var(--pc-surface-2)] transition-colors"
		>
			<Bell size={18} weight="Outline" />
			<span class="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--pc-accent)] text-[10px] font-700 text-white">3</span>
		</button>

		<a
			href="/you"
			aria-label="Profile"
			class="ml-1 size-8 rounded-full overflow-hidden ring-1 ring-[var(--pc-border)] hover:ring-[var(--pc-border-strong)] transition"
		>
			<img
				src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop"
				alt="avatar"
				class="size-full object-cover"
			/>
		</a>
	</div>
	</div>
</header>

<style>
	header {
		backdrop-filter: saturate(1.2);
	}
</style>
