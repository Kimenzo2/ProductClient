<script lang="ts">
	import { AlertTriangle, FileText, Inbox, Map, Plus, Rocket, Heart } from 'reicon-svelte';

	let {
		label = 'Create',
		compact = false
	}: {
		label?: string;
		compact?: boolean;
	} = $props();

	let open = $state(false);
	let root = $state<HTMLElement | undefined>(undefined);
	let triggerEl = $state<HTMLButtonElement | undefined>(undefined);
	let menuEl = $state<HTMLElement | undefined>(undefined);
	let activeIndex = $state(0);

	const createItems = [
		{ label: 'Add feedback', description: 'Share a request, problem, question, or praise', href: '/feedback/new', icon: Inbox },
		{ label: 'Describe a problem', description: 'Explain what is getting in the way', href: '/workspace/problems', icon: Map },
		{ label: 'Choose what to do', description: 'Write down the choice and why you made it', href: '/workspace/decisions?create=decision', icon: Map },
		{ label: 'Write a product update', description: 'Prepare a clear message about a change', href: '/studio', icon: Rocket },
		{ label: 'Write help content', description: 'Explain how a product works', href: '/studio', icon: FileText },
		{ label: 'Report a service problem', description: 'Tell the team what is wrong and who is affected', href: '/workspace/incidents/new', icon: AlertTriangle },
		{ label: 'Add a customer quote', description: 'Save a review or story that you can share', href: '/workspace/proof', icon: Heart }
	];

	function toggle() {
		if (open) {
			close();
		} else {
			open = true;
			activeIndex = 0;
			requestAnimationFrame(() => {
				const items = menuEl?.querySelectorAll<HTMLElement>('[role="menuitem"]');
				items?.[0]?.focus();
			});
		}
	}

	function close() {
		open = false;
		triggerEl?.focus();
	}

	function focusItem(index: number) {
		const items = menuEl?.querySelectorAll<HTMLElement>('[role="menuitem"]');
		if (items?.[index]) {
			activeIndex = index;
			items[index].focus();
		}
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
			if (!open) {
				event.preventDefault();
				toggle();
			}
		}
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				focusItem(Math.min(activeIndex + 1, createItems.length - 1));
				break;
			case 'ArrowUp':
				event.preventDefault();
				focusItem(Math.max(activeIndex - 1, 0));
				break;
			case 'Home':
				event.preventDefault();
				focusItem(0);
				break;
			case 'End':
				event.preventDefault();
				focusItem(createItems.length - 1);
				break;
			case 'Escape':
				event.preventDefault();
				close();
				break;
			case 'Tab':
				close();
				break;
		}
	}

	function handleWindowClick(event: MouseEvent) {
		if (open && root && !root.contains(event.target as Node)) close();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			close();
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div bind:this={root} class="relative">
	<button
		type="button"
		bind:this={triggerEl}
		class="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--pc-accent)] text-[13px] font-medium tracking-[-0.01em] leading-none text-white transition-[background-color,transform] duration-150 hover:bg-[var(--pc-accent-hover)] active:scale-[0.96] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] {compact ? 'size-9 justify-center px-0' : 'px-4'}"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls="quickcreate-menu"
		aria-label={compact ? label : undefined}
		onclick={toggle}
		onkeydown={handleTriggerKeydown}
	>
		<Plus size={15} weight="Outline" aria-hidden="true" />
		{#if !compact}<span>{label}</span>{/if}
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={menuEl}
			id="quickcreate-menu"
			role="menu"
			tabindex="-1"
			aria-label="Create new"
			class="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(360px,calc(100vw-24px))] origin-top-right rounded-[20px] bg-[var(--pc-bg)] border border-[var(--pc-border-strong)] p-2"
			style="overscroll-behavior: contain;"
			onkeydown={handleMenuKeydown}
		>
			<div class="px-3 pb-2 pt-2">
				<p id="qc-title" class="text-[13px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--pc-text)] antialiased">What do you want to add?</p>
				<p class="mt-1 text-xs leading-[1.5] tracking-[-0.01em] text-[var(--pc-text-muted)] max-w-[32ch] text-pretty">Start with feedback, a question, an update, or a customer quote.</p>
			</div>
			<div class="mt-1 space-y-1" aria-labelledby="qc-title">
				{#each createItems as item, i (item.label)}
					{@const Icon = item.icon}
					<a
						href={item.href}
						role="menuitem"
						tabindex={i === activeIndex ? 0 : -1}
						aria-describedby="qc-desc-{i}"
						onclick={() => (open = false)}
						onmouseenter={() => (activeIndex = i)}
						class="flex items-start gap-3 rounded-[12px] px-2.5 py-2.5 transition-[background-color] duration-100 hover:bg-[var(--pc-surface)] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] focus-visible:bg-[var(--pc-surface)] min-h-[56px]"
					>
						<span class="grid size-8 shrink-0 place-items-center rounded-[8px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)] ring-1 ring-[var(--pc-border-strong)]" aria-hidden="true"><Icon size={15} weight="Outline" aria-hidden="true" /></span>
						<span class="min-w-0 flex-1 text-left">
							<span class="block text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-[var(--pc-text)]">{item.label}</span>
							<span id="qc-desc-{i}" class="mt-0.5 block text-xs leading-[1.4] tracking-[-0.01em] text-[var(--pc-text-muted)] line-clamp-1">{item.description}</span>
						</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
