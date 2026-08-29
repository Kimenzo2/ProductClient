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

	const createItems = [
		{ label: 'Add feedback', description: 'Share a request, problem, question, or praise', href: '/feedback/new', icon: Inbox },
		{ label: 'Describe a problem', description: 'Explain what is getting in the way', href: '/workspace/problems', icon: Map },
		{ label: 'Choose what to do', description: 'Write down the choice and why you made it', href: '/workspace/decisions?create=decision', icon: Map },
		{ label: 'Write a product update', description: 'Prepare a clear message about a change', href: '/studio', icon: Rocket },
		{ label: 'Write help content', description: 'Explain how a product works', href: '/studio', icon: FileText },
		{ label: 'Report a service problem', description: 'Tell the team what is wrong and who is affected', href: '/workspace/incidents/new', icon: AlertTriangle },
		{ label: 'Add a customer quote', description: 'Save a review or story that you can share', href: '/workspace/proof', icon: Heart }
	];

	function handleWindowClick(event: MouseEvent) {
		if (open && root && !root.contains(event.target as Node)) open = false;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			open = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div bind:this={root} class="relative">
	<button type="button" class="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--pc-accent)] text-[13px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-[var(--pc-accent-hover)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-accent-light)] {compact ? 'size-9 justify-center px-0' : 'px-4'}" aria-haspopup="true" aria-expanded={open} aria-label={compact ? label : undefined} onclick={() => (open = !open)}>
		<Plus size={15} weight="Outline" aria-hidden="true" />
		{#if !compact}<span>{label}</span>{/if}
	</button>

	{#if open}
		<div class="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(360px,calc(100vw-24px))] origin-top-right rounded-[20px] bg-[var(--pc-surface-2)] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.38)] ring-1 ring-[var(--pc-border-strong)]/55" aria-label="Add something to Product Client">
			<div class="px-3 pb-2 pt-2"><p class="text-xs font-medium">What do you want to add?</p><p class="mt-1 text-[11px] leading-relaxed text-[var(--pc-text-muted)] opacity-70">Start with feedback, a question, an update, or a customer quote.</p></div>
			<div class="space-y-0.5">
				{#each createItems as item (item.label)}
					{@const Icon = item.icon}
					<a href={item.href} onclick={() => (open = false)} class="flex items-start gap-2.5 rounded-[14px] px-2.5 py-2.5 transition-[background-color,transform] duration-150 hover:bg-[var(--pc-surface)] active:scale-[0.99]">
						<span class="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)]"><Icon size={15} weight="Outline" aria-hidden="true" /></span>
						<span class="min-w-0 flex-1"><span class="block text-xs font-medium">{item.label}</span><span class="mt-0.5 block text-[11px] leading-snug text-[var(--pc-text-muted)] opacity-70">{item.description}</span></span>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>
