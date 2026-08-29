<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, CheckCircle } from 'reicon-svelte';
	import { Button, Card, Input, Label, Textarea } from '$lib/components/ui';
	import { products } from '$lib/data/workspace';

	let productSlug = $state(page.url.searchParams.get('product') ?? products[0]?.slug ?? '');
	let title = $state('');
	let summary = $state('');
	let impact = $state('');
	let declared = $state(false);
	let error = $state('');

	function declareIncident() {
		error = '';
		if (!title.trim() || !summary.trim() || !impact.trim()) { error = 'Add a title, explain what is happening, and say who is affected.'; return; }
		declared = true;
	}
</script>

<svelte:head><title>Report a service problem | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[760px] px-4 sm:px-6">
	<header class="pb-6 pt-8 sm:pt-10"><a href="/workspace/incidents" class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" /> Service problems</a><p class="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Service response</p><h1 class="mt-2 text-[26px] font-medium tracking-tight md:text-[34px]">Report a service problem.</h1><p class="mt-2 max-w-[58ch] text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-75">Tell us what is wrong, who is affected, and what customers should know.</p></header>
	{#if declared}<Card padding="lg" class="mb-12 text-center"><div class="mx-auto grid size-11 place-items-center rounded-full bg-[var(--pc-accent)]/15 text-[var(--pc-accent-light)]"><CheckCircle size={22} weight="Outline" /></div><h2 class="mt-4 text-lg font-medium">Service problem reported</h2><p class="mt-2 text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-75">The team can now assign an owner, keep a timeline, and publish the right update for customers.</p><Button href="/workspace/incidents" variant="primary" class="mt-5">Return to service problems</Button></Card>
	{:else}<form onsubmit={(event) => { event.preventDefault(); declareIncident(); }} class="mb-12 space-y-5"><Card padding="lg"><div><Label for="incident-product">Product</Label><select id="incident-product" bind:value={productSlug} class="mt-2 h-10 w-full rounded-[10px] bg-[var(--pc-surface)] px-3 text-[13px] outline-none focus:ring-2 focus:ring-[var(--pc-accent)]">{#each products as product}<option value={product.slug}>{product.name}</option>{/each}</select></div><div class="mt-5"><Label for="incident-title">Service problem</Label><Input id="incident-title" bind:value={title} placeholder="e.g., Some people cannot sign in" class="mt-2" /></div><div class="mt-5"><Label for="incident-summary">What is happening?</Label><Textarea id="incident-summary" bind:value={summary} placeholder="Tell us what is going wrong right now." class="mt-2 min-h-[120px]" /></div><div class="mt-5"><Label for="incident-impact">Who is affected?</Label><Textarea id="incident-impact" bind:value={impact} placeholder="Tell us who is affected and what they can expect." class="mt-2 min-h-[100px]" /></div>{#if error}<p class="mt-4 text-xs text-[var(--red-6)]" role="alert">{error}</p>{/if}</Card><div class="flex items-center justify-end gap-2"><Button href="/workspace/incidents" variant="ghost" size="md">Cancel</Button><Button type="submit" variant="primary" size="md">Report problem</Button></div></form>{/if}
</div>
