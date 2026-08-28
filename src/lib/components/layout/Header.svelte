<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Menu, Play, Search, CloseCircle, Mic, Add, Sun, Moon, Bell } from 'reicon-svelte';

	let {
		sidebarCollapsed = false,
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
	class="sticky top-0 z-40 flex h-[var(--pc-header-h)] items-center gap-4 border-b border-[var(--pc-border)] bg-[var(--pc-surface)] px-3 md:px-4"
>
	<!-- Left -->
	<div class="flex items-center gap-2 md:gap-3">
		<button
			aria-label="Toggle sidebar"
			onclick={onToggleSidebar}
			class="grid size-10 place-items-center rounded-full hover:bg-[var(--pc-surface-2)] transition-colors"
		>
			<Menu size={20} weight="Outline" />
		</button>

		<a href="/" class="flex items-center gap-2.5">
			<span
				class="grid size-8 place-items-center rounded-[8px] bg-[var(--pc-accent)] text-white shadow-[var(--pc-shadow-card)]"
			>
				<Play size={16} weight="Outline" color="white" />
			</span>
			<span class="hidden sm:block">
				<span class="text-[15px] font-700 tracking-tight leading-none">Product Client</span>
				<span class="block text-[10px] font-600 tracking-[0.12em] uppercase text-[var(--pc-text-faint)] leading-none">BUILD • SHIP • FOCUS</span
				>
			</span>
			<span class="sm:hidden text-[15px] font-800 tracking-tight">PC</span>
		</a>
	</div>

	<!-- Center – Search -->
	<div class="flex flex-1 justify-center px-2 md:px-8">
		<div class="flex w-full max-w-[640px] items-center">
			<div
				class="flex flex-1 items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-1.5 focus-within:border-[var(--pc-border-strong)] focus-within:bg-[var(--pc-surface)] transition-colors shadow-sm"
			>
				<input
					bind:value={search}
					onkeydown={(e) => {
						if (e.key === 'Enter') onSearch?.(search);
					}}
					placeholder="Search products, makers, launches..."
					class="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--pc-text-faint)] py-1"
				/>
				{#if search}
					<button
						onclick={() => {
							search = '';
							onSearch?.('');
						}}
						class="grid size-6 place-items-center rounded-full hover:bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)]"
						aria-label="Clear"
					>
						<CloseCircle size={14} weight="Outline" />
					</button>
				{/if}
			</div>
			<button
				onclick={() => onSearch?.(search)}
				aria-label="Search"
				class="ml-2 grid size-9 md:size-10 place-items-center rounded-full bg-[var(--pc-surface-2)] hover:bg-[var(--pc-border)] border border-[var(--pc-border)] transition-colors"
			>
				<Search size={18} weight="Outline" />
			</button>
			<button
				aria-label="Voice search"
				class="ml-2 hidden md:grid size-10 place-items-center rounded-full bg-[var(--pc-surface-2)] hover:bg-[var(--pc-border)] transition-colors"
			>
				<Mic size={18} weight="Outline" />
			</button>
		</div>
	</div>

	<!-- Right -->
	<div class="flex items-center gap-1 md:gap-2">
		<a
			href="/studio"
			class="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--pc-surface-2)] hover:bg-[var(--pc-border)] px-4 py-2 text-sm font-600 transition-colors border border-[var(--pc-border)]"
		>
			<Add size={16} weight="Outline" />
			Create
		</a>
		<a
			href="/studio"
			aria-label="Create"
			class="grid md:hidden size-9 place-items-center rounded-full bg-[var(--pc-surface-2)] border border-[var(--pc-border)]"
		>
			<Add size={16} weight="Outline" />
		</a>

		<button
			onclick={toggleMode}
			aria-label="Toggle theme"
			class="grid size-9 md:size-10 place-items-center rounded-full hover:bg-[var(--pc-surface-2)] transition-colors"
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
			class="relative grid size-9 md:size-10 place-items-center rounded-full hover:bg-[var(--pc-surface-2)] transition-colors"
		>
			<Bell size={18} weight="Outline" />
			<span class="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--pc-accent)] text-[10px] font-700 text-white">3</span>
		</button>

		<button
			aria-label="Profile"
			class="ml-1 size-8 md:size-8 rounded-full overflow-hidden ring-2 ring-[var(--pc-border)] hover:ring-[var(--pc-border-strong)] transition"
		>
			<img
				src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop"
				alt="avatar"
				class="size-full object-cover"
			/>
		</button>
	</div>
</header>

<style>
	header {
		backdrop-filter: saturate(1.2);
	}
</style>
