<script lang="ts">
	import { AlertTriangle, ChatDots, Inbox, Plus, Rocket } from 'reicon-svelte';
	import NotePad from '$lib/components/notes/NotePad.svelte';

	let {
		label = 'Create',
		compact = false
	}: {
		label?: string;
		compact?: boolean;
	} = $props();

	let open = $state(false);
	let noteOpen = $state(false);
	let root = $state<HTMLElement | undefined>(undefined);
	let triggerEl = $state<HTMLButtonElement | undefined>(undefined);
	let menuEl = $state<HTMLElement | undefined>(undefined);
	let activeIndex = $state(0);
	let typeaheadBuffer = $state('');
	let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

	type CreateItem = { label: string; icon: typeof Inbox; href?: string; notepad?: boolean };

	// Maker controls, not visitor prompts: every item acts on the maker's own
	// products — triage, publish, declare, record. Labels only, no descriptions.
	const createItems: CreateItem[] = [
		{ label: 'Post a note', icon: ChatDots, notepad: true },
		{ label: 'Review inbox', href: '/workspace/inbox', icon: Inbox },
		{ label: 'Publish update', href: '/workspace/releases', icon: Rocket },
		{ label: 'Declare incident', href: '/workspace/incidents/new', icon: AlertTriangle }
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
		clearTimeout(typeaheadTimer);
		typeaheadBuffer = '';
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

	// APG menu typeahead — first-character (and fast multi-char) navigation,
	// cycling forward from the current item with wrap-around
	function handleTypeahead(key: string) {
		const char = key.toLowerCase();
		clearTimeout(typeaheadTimer);
		typeaheadTimer = setTimeout(() => (typeaheadBuffer = ''), 500);
		const labels = createItems.map((item) => item.label.toLowerCase());
		const start = (activeIndex + 1) % labels.length;
		const findFrom = (prefix: string): number => {
			const ordered = [...labels.slice(start), ...labels.slice(0, start)];
			const found = ordered.findIndex((label) => label.startsWith(prefix));
			return found === -1 ? -1 : (start + found) % labels.length;
		};
		const hit = findFrom(typeaheadBuffer + char);
		if (hit !== -1) {
			typeaheadBuffer += char;
			focusItem(hit);
		} else {
			// Multi-char buffer missed — retry as a fresh single character
			const single = findFrom(char);
			typeaheadBuffer = single === -1 ? '' : char;
			if (single !== -1) focusItem(single);
		}
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
			event.preventDefault();
			handleTypeahead(event.key);
			return;
		}
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
		class="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--pc-surface)] text-[13px] font-medium tracking-[-0.01em] leading-none text-[var(--pc-text)] transition-[background-color,transform] duration-150 hover:bg-[var(--pc-surface-2)] active:scale-[0.96] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] {compact ? 'size-9 justify-center px-0' : 'px-4'}"
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
			aria-labelledby="qc-title"
			class="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(280px,calc(100vw-24px))] rounded-[16px] bg-[var(--pc-bg)] border border-[var(--pc-border-strong)] p-1.5"
			onkeydown={handleMenuKeydown}
		>
			<div class="px-3 pb-1.5 pt-2">
				<p id="qc-title" class="text-[13px] font-normal leading-[1.3] tracking-[-0.01em] text-[var(--pc-text)] antialiased">What are you working on?</p>
			</div>
			<div class="mt-1 space-y-1">
				{#each createItems as item, i (item.label)}
					{@const Icon = item.icon}
					{#if item.notepad}
						<button
							type="button"
							role="menuitem"
							tabindex={i === activeIndex ? 0 : -1}
							onclick={() => {
								open = false;
								noteOpen = true;
							}}
							onmouseenter={() => (activeIndex = i)}
							class="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 transition-[background-color] duration-100 hover:bg-[var(--pc-surface)] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] focus-visible:bg-[var(--pc-surface)] min-h-[44px]"
						>
							<span class="grid size-7 shrink-0 place-items-center rounded-[8px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)] ring-1 ring-[var(--pc-border-strong)]" aria-hidden="true"><Icon size={14} weight="Outline" aria-hidden="true" /></span>
							<span class="min-w-0 flex-1 truncate text-left text-[13px] font-normal leading-[1.3] tracking-[-0.01em] text-[var(--pc-text)]">{item.label}</span>
						</button>
					{:else}
						<a
							href={item.href}
							role="menuitem"
							tabindex={i === activeIndex ? 0 : -1}
							onclick={() => (open = false)}
							onmouseenter={() => (activeIndex = i)}
							class="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 transition-[background-color] duration-100 hover:bg-[var(--pc-surface)] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] focus-visible:bg-[var(--pc-surface)] min-h-[44px]"
						>
							<span class="grid size-7 shrink-0 place-items-center rounded-[8px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)] ring-1 ring-[var(--pc-border-strong)]" aria-hidden="true"><Icon size={14} weight="Outline" aria-hidden="true" /></span>
							<span class="min-w-0 flex-1 truncate text-left text-[13px] font-normal leading-[1.3] tracking-[-0.01em] text-[var(--pc-text)]">{item.label}</span>
						</a>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<NotePad bind:open={noteOpen} />
