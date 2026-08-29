<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, Heart, Message, QuoteUp } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
	import { publicProductBySlug, publicProofs } from '$lib/data/public';

	let slug = $derived(page.params.slug ?? '');
	let productSlug = $derived(slug.endsWith('-proof') ? slug.slice(0, -6) : slug);
	let product = $derived(publicProductBySlug(productSlug));
	let productProof = $derived(publicProofs.filter((proof) => proof.productSlug === productSlug));
</script>

<svelte:head><title>{product?.name ?? 'Customer stories'} | Wall of Love | Product Client</title></svelte:head>

{#if product}
	<div class="mx-auto w-full max-w-[1060px] px-4 sm:px-6">
		<header class="pb-8 pt-8 sm:pt-12"><a href={product.publicPath} class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" /> {product.name}</a><div class="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Customer stories</p><h1 class="mt-2 text-[28px] font-medium tracking-tight md:text-[40px]">Why teams choose {product.name}</h1><p class="mt-2 max-w-[58ch] text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-75">Real words from people who use this product at work.</p></div><Button href="/feedback/new" variant="primary" size="md"><Message size={15} weight="Outline" /> Share your experience</Button></div></header>
		{#if productProof.length > 0}<div class="grid gap-3 pb-12 md:grid-cols-2">{#each productProof as proof (proof.id)}<Card padding="lg" class="flex min-h-[220px] flex-col"><QuoteUp size={20} weight="Outline" class="text-[var(--pc-accent-light)] opacity-70" /><blockquote class="mt-5 text-[17px] leading-8 tracking-tight">"{proof.quote}"</blockquote><div class="mt-auto flex items-center gap-3 pt-7"><img src={proof.avatar} alt="" class="size-9 rounded-full object-cover" /><div class="min-w-0"><p class="text-xs font-medium">{proof.name}</p><p class="mt-0.5 text-[11px] text-[var(--pc-text-muted)] opacity-70">{proof.role}</p></div><Chip size="xs" class="ml-auto"><Heart size={11} weight="Outline" /> {proof.tags[0]}</Chip></div></Card>{/each}</div>{:else}<StatePanel icon={Heart} title="We are still collecting stories" description="Be the first person to share what this product changed for you." actionLabel="Share your experience" actionHref="/feedback/new" class="mb-12" />{/if}
	</div>
{:else}
	<StatePanel size="page" icon={Heart} title="Customer stories not found" description="This page is not published yet." actionLabel="Back to Product Client" actionHref="/" class="pc-enter" />
{/if}
