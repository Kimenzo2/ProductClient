<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Box, ChevronDown, Add, Check } from 'reicon-svelte';
	import { activeProductStore, hydrateActiveProduct, setActiveProduct } from '$lib/stores/activeProduct.svelte';
	import { page } from '$app/state';

	let open = $state(false);
	let triggerEl: HTMLButtonElement | undefined = $state(undefined);
	let panelEl: HTMLDivElement | undefined = $state(undefined);
	let focusedIndex = $state(0);

	let products = $derived(activeProductStore.products);
	let active = $derived(activeProductStore.activeProduct);
	let hydrated = $derived(activeProductStore.hydrated);

	onMount(() => {
		void hydrateActiveProduct();
	});

	function toggle() {
		open = !open;
		if (open) {
			tick().then(() => {
				const idx = products.findIndex((p) => p.id === active?.id);
				focusedIndex = idx >= 0 ? idx : 0;
				panelEl?.focus();
				// focus first item for keyboard
				const first = panelEl?.querySelector<HTMLElement>('[role="menuitemradio"]');
				first?.focus();
			});
		}
	}

	function closeAndRestore() {
		open = false;
		queueMicrotask(() => triggerEl?.focus());
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (!open) toggle();
		}
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			closeAndRestore();
		}
	}

	function handlePanelKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeAndRestore();
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			focusedIndex = Math.min(focusedIndex + 1, products.length - 1);
			focusItem(focusedIndex);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			focusedIndex = Math.max(focusedIndex - 1, 0);
			focusItem(focusedIndex);
		} else if (event.key === 'Home') {
			event.preventDefault();
			focusedIndex = 0;
			focusItem(0);
		} else if (event.key === 'End') {
			event.preventDefault();
			focusedIndex = products.length - 1;
			focusItem(focusedIndex);
		} else if (event.key === 'Tab') {
			// Trap focus inside panel while open — Svelte menu should not leak
			const items = panelEl?.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitem"]');
			if (!items || items.length === 0) return;
			const first = items[0];
			const last = items[items.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	}

	function focusItem(index: number) {
		const items = panelEl?.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
		items?.[index]?.focus();
	}

	async function selectProduct(id: string) {
		const chosen = products.find((p) => p.id === id);
		if (!chosen) return;
		await setActiveProduct(id);

		// Stay on same section if possible. Dashboard routes are product-agnostic today (e.g. /workspace/docs);
		// if the route were deep like /workspace/docs/<docId> that belongs to another product, the consumer
		// will detect missing record and redirect to index. We keep the path, just close the menu.
		open = false;
		queueMicrotask(() => triggerEl?.focus());
	}

	function handleClickOutside(event: MouseEvent) {
		if (!open) return;
		const target = event.target as Node;
		if (triggerEl?.contains(target) || panelEl?.contains(target)) return;
		open = false;
	}

	onMount(() => {
		const onDocClick = (e: MouseEvent) => handleClickOutside(e);
		document.addEventListener('mousedown', onDocClick);
		return () => document.removeEventListener('mousedown', onDocClick);
	});

	let label = $derived(active ? active.name : products.length === 0 ? 'Select a product' : 'Switch product');
	let sublabel = $derived(active ? active.slug : products.length === 0 ? 'Add product' : `${products.length} products`);
</script>

<div class="product-switcher relative inline-flex items-center">
	<button
		bind:this={triggerEl}
		type="button"
		onclick={toggle}
		onkeydown={handleTriggerKeydown}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls="product-switcher-menu"
		aria-label={active ? `Switch product — current ${active.name}` : 'Switch product'}
		class="group inline-flex items-center gap-2 rounded-full border bg-[var(--pc-surface)] px-2 py-1 text-left transition-[background-color,border-color,transform] duration-150 hover:bg-[var(--pc-surface-2)] active:scale-[0.98] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] {open ? 'border-[var(--pc-border-strong)] bg-[var(--pc-surface-2)]' : 'border-transparent'}"
		style:min-height="36px"
	>
		<span class="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)]" aria-hidden="true">
			{#if active?.avatar || active?.logo_url}
				<img src={active.avatar ?? active.logo_url ?? ''} alt="" class="size-7 rounded-full object-cover" />
			{:else}
				<Box size={14} weight="Outline" />
			{/if}
		</span>
		<span class="hidden min-w-0 flex-col items-start leading-none sm:flex" aria-hidden="true">
			<span class="max-w-[14ch] truncate text-[13px] font-medium tracking-[-0.01em] text-[var(--pc-text)]">{label}</span>
			<span class="max-w-[14ch] truncate text-[11px] leading-[1.1] text-[var(--pc-text-faint)] tabular-nums">{sublabel}</span>
		</span>
		<span class="hidden sm:inline-flex"><ChevronDown size={12} weight="Outline" aria-hidden="true" class="shrink-0 text-[var(--pc-text-faint)] transition-transform duration-150 {open ? 'rotate-180' : ''}" /></span>
		<!-- Hit-area extension: 44px target from 36px visual -->
		<span class="pointer-events-none absolute -inset-1 rounded-full" aria-hidden="true"></span>
	</button>

	{#if open}
		<!-- Backdrop for click outside on mobile; invisible but captures -->
		<button type="button" class="fixed inset-0 z-40 cursor-default bg-transparent" aria-label="Close product menu" onclick={closeAndRestore}></button>
		<div
			bind:this={panelEl}
			id="product-switcher-menu"
			role="menu"
			aria-label="Switch product"
			tabindex="-1"
			onkeydown={handlePanelKeydown}
			class="absolute left-0 top-[calc(100%+8px)] z-50 w-[300px] overflow-hidden rounded-[16px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-1.5 outline-none"
		>
			<div class="max-h-[min(48vh,320px)] overflow-y-auto py-1" style="scrollbar-width: thin; scrollbar-color: var(--pc-border-strong) transparent;">
				{#if products.length === 0}
					<div class="px-3 py-8 text-center">
						<div class="mx-auto grid size-9 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)]"><Box size={16} weight="Outline" aria-hidden="true" /></div>
						<p class="mx-auto mt-4 max-w-[22ch] text-[12px] leading-[1.5] text-[var(--pc-text-muted)]">Create your first product to start publishing docs and updates.</p>
						<a href="/submit" onclick={() => (open = false)} class="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[var(--pc-text)] px-4 text-[13px] font-medium text-[var(--pc-bg)] transition-opacity hover:opacity-[0.88] active:scale-[0.96]"><Add size={14} weight="Outline" /> Add product</a>
					</div>
				{:else}
					<div class="space-y-0.5">
						{#each products as product, index (product.id)}
							{@const isActive = product.id === active?.id}
							<button
								type="button"
								role="menuitemradio"
								aria-checked={isActive}
								aria-current={isActive ? 'true' : undefined}
								tabindex={focusedIndex === index ? 0 : -1}
								onclick={() => selectProduct(product.id)}
								onfocus={() => (focusedIndex = index)}
								class="flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2.5 text-left transition-[background-color,color] duration-100 focus-visible:outline-[0.5px] focus-visible:outline-offset-[-0.5px] focus-visible:outline-[var(--pc-focus-ring)] {isActive ? 'bg-[var(--pc-surface)] text-[var(--pc-text)]' : 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)]'}"
							>
								<span class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--pc-surface-2)]">
									{#if product.avatar || product.logo_url}
										<img src={product.avatar ?? product.logo_url ?? ''} alt="" class="size-8 rounded-full object-cover outline outline-1 -outline-offset-1 outline-white/10" />
									{:else}
										<Box size={14} weight="Outline" aria-hidden="true" />
									{/if}
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-[13px] font-medium leading-[1.3] tracking-[-0.01em] {isActive ? 'text-[var(--pc-text)]' : ''}">{product.name}</span>
									<span class="block truncate text-[11px] leading-[1.2] text-[var(--pc-text-faint)] tabular-nums">{product.slug}{#if product.category} · {product.category}{/if}</span>
								</span>
								{#if isActive}
									<span class="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--pc-accent)] text-white"><Check size={12} weight="Outline" aria-hidden="true" /></span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="border-t border-[var(--pc-border-strong)]/10 px-1.5 pb-1 pt-2">
				<a
					href="/submit"
					role="menuitem"
					onclick={() => (open = false)}
					class="flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--pc-surface)] px-3 py-2.5 text-[13px] font-medium text-[var(--pc-text)] transition-[background-color] duration-150 hover:bg-[var(--pc-surface-2)] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]"
				>
					<Add size={14} weight="Outline" aria-hidden="true" /> Add product
				</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.product-switcher :global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
