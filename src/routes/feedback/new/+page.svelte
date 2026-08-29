<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, CheckCircle, Send } from 'reicon-svelte';
	import { Button, Card, Chip, Input, Label, Textarea } from '$lib/components/ui';
	import { publicProducts } from '$lib/data/public';

	let productSlug = $state(page.url.searchParams.get('product') ?? publicProducts[0]?.slug ?? '');
	let type = $state<'Request' | 'Bug' | 'Praise'>('Request');
	let title = $state('');
	let body = $state('');
	let email = $state('');
	let submitted = $state(false);
	let error = $state('');

	function submit() {
		error = '';
		if (!title.trim() || !body.trim()) { error = 'Add a short title and explain what happened.'; return; }
		if (email && !email.includes('@')) { error = 'Enter a valid email or leave it blank.'; return; }
		submitted = true;
	}
</script>

<svelte:head><title>Share feedback | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[760px] px-4 sm:px-6">
	<header class="pb-6 pt-8 sm:pt-12"><a href="/" class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" /> Back to Product Client</a><p class="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Customer voice</p><h1 class="mt-2 text-[26px] font-medium tracking-tight md:text-[34px]">Tell us what you think.</h1><p class="mt-2 max-w-[58ch] text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-75">Tell the team what worked, what went wrong, or what would make the product better.</p></header>
	{#if submitted}
		<Card padding="lg" class="mb-12 text-center"><div class="mx-auto grid size-11 place-items-center rounded-full bg-[var(--pc-accent)]/15 text-[var(--pc-accent-light)]"><CheckCircle size={22} weight="Outline" /></div><h2 class="mt-4 text-lg font-medium">Feedback received</h2><p class="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-75">The {publicProducts.find((product) => product.slug === productSlug)?.name ?? 'product'} team can now review your message and decide what to do next.</p><Button href="/" variant="primary" class="mt-5">Explore products</Button></Card>
	{:else}
		<form onsubmit={(event) => { event.preventDefault(); submit(); }} class="mb-12 space-y-5">
			<Card padding="lg">
				<div class="grid gap-5 sm:grid-cols-2">
					<div><Label for="feedback-product">Product</Label><select id="feedback-product" bind:value={productSlug} class="mt-2 h-10 w-full rounded-[10px] bg-[var(--pc-surface)] px-3 text-[13px] outline-none focus:ring-2 focus:ring-[var(--pc-accent)]">{#each publicProducts as product}<option value={product.slug}>{product.name}</option>{/each}</select></div>
					<div><Label for="feedback-email">Email <span class="text-[var(--pc-text-faint)]">(optional)</span></Label><Input id="feedback-email" type="email" bind:value={email} placeholder="you@company.com" class="mt-2" /></div>
				</div>
				<div class="mt-5">
					<span class="text-xs font-medium">What kind of feedback is this?</span>
					<div class="mt-2 flex flex-wrap gap-2" role="group" aria-label="Feedback type">{#each ['Request', 'Bug', 'Praise'] as item}<button type="button" onclick={() => (type = item as typeof type)} aria-pressed={type === item} class="inline-flex h-9 items-center rounded-full px-3 text-xs transition-[background-color,color] duration-150 {type === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-border-strong)]'}">{item}</button>{/each}</div>
				</div>
				<div class="mt-5"><Label for="feedback-title">Short title</Label><Input id="feedback-title" bind:value={title} placeholder="What should the team know?" class="mt-2" /></div>
				<div class="mt-5"><Label for="feedback-body">Tell us more</Label><Textarea id="feedback-body" bind:value={body} placeholder="What happened? What were you trying to do? What would make it better?" class="mt-2 min-h-[140px]" /></div>
				{#if error}<p class="mt-4 rounded-[10px] bg-[var(--red-6)]/10 px-3 py-2 text-xs text-[var(--red-6)]" role="alert">{error}</p>{/if}
			</Card>
			<div class="flex items-center justify-end gap-2"><Button href="/" variant="ghost" size="md">Cancel</Button><Button type="submit" variant="primary" size="md"><Send size={15} weight="Outline" /> Send feedback</Button></div>
		</form>
	{/if}
</div>
