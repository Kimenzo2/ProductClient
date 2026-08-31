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
			// Focus first menu item after render
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
				// Allow Tab to close the menu and move focus naturally
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
		class="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--pc-accent)] text-[13px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[var(--pc-accent-hover)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-accent-light)] {compact ? 'size-9 justify-center px-0' : 'px-4'}"
		aria-haspopup="menu"
		aria-expanded={open}
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
			role="menu"
			tabindex="-1"
			aria-label="Create new"
			class="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(360px,calc(100vw-24px))] origin-top-right rounded-[20px] bg-[var(--pc-surface-2)] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.38)] ring-1 ring-[var(--pc-border-strong)]/55"
			onkeydown={handleMenuKeydown}
		>
			<div class="px-3 pb-2 pt-2"><p class="text-xs font-medium">What do you want to add?</p><p class="mt-1 text-[11px] leading-relaxed text-[var(--pc-text-muted)] opacity-70">Start with feedback, a question, an update, or a customer quote.</p></div>
			<div class="space-y-0.5">
				{#each createItems as item, i (item.label)}
					{@const Icon = item.icon}
					<a
						href={item.href}
						role="menuitem"
						tabindex={i === activeIndex ? 0 : -1}
						onclick={() => (open = false)}
						onmouseenter={() => (activeIndex = i)}
						class="flex items-start gap-2.5 rounded-[14px] px-2.5 py-2.5 transition-[background-color,transform] duration-150 hover:bg-[var(--pc-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-accent-light)] focus-visible:bg-[var(--pc-surface)] active:scale-[0.99]"
					>
						<span class="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)]"><Icon size={15} weight="Outline" aria-hidden="true" /></span>
						<span class="min-w-0 flex-1"><span class="block text-xs font-medium">{item.label}</span><span class="mt-0.5 block text-[11px] leading-snug text-[var(--pc-text-muted)] opacity-70">{item.description}</span></span>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>
