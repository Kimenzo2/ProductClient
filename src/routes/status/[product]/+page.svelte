<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, Bell, CheckCircle, Clock, History } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
	import { publicIncidents, publicProductBySlug } from '$lib/data/public';

	let slug = $derived(page.params.product ?? '');
	let product = $derived(publicProductBySlug(slug));
	let productIncidents = $derived(publicIncidents.filter((incident) => incident.productSlug === slug));
	let operational = $derived(productIncidents.every((incident) => incident.status === 'Resolved'));
	let subscribed = $state(false);
</script>

<svelte:head><title>Status | {product?.name ?? slug} | Product Client</title></svelte:head>

{#if product}
	<div class="mx-auto w-full max-w-[820px] px-4 sm:px-6">
		<header class="pb-6 pt-8 sm:pt-12"><a href={product.publicPath} class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" aria-hidden="true" /> {product.name}</a><div class="mt-7 flex items-start justify-between gap-4"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Public status</p><h1 class="mt-2 text-[28px] font-medium tracking-tight md:text-[38px]">{product.name} status</h1><p class="mt-2 text-sm text-[var(--pc-text-muted)] opacity-75">See what is working, what is being fixed, and what happened before.</p></div><Button variant={subscribed ? 'primary' : 'outline'} size="sm" onclick={() => (subscribed = !subscribed)}><Bell size={14} weight="Outline" aria-hidden="true" /> {subscribed ? 'Subscribed' : 'Subscribe to updates'}</Button></div></header>
		<Card padding="lg" class="mb-6"><div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-full {operational ? 'bg-[var(--color-green-600)]/15 text-[var(--color-green-600)]' : 'bg-[var(--pc-accent)]/15 text-[var(--pc-accent-light)]'}">{#if operational}<CheckCircle size={20} weight="Outline" />{:else}<Clock size={20} weight="Outline" />{/if}</span><div><h2 class="text-base font-medium">{operational ? 'All systems operational' : 'Some systems need attention'}</h2><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">{operational ? 'No active service problems are affecting this product.' : 'The team is investigating or watching an active service problem.'}</p></div></div></Card>
		<section aria-labelledby="history-title" class="pb-12"><div class="mb-3 flex items-center gap-2"><History size={16} weight="Outline" class="opacity-55" aria-hidden="true" /><h2 id="history-title" class="text-lg font-medium">Past service problems</h2></div><div class="space-y-2">{#each productIncidents as incident (incident.id)}<article id={incident.id} class="rounded-[16px] bg-[var(--pc-surface-2)] p-4"><div class="flex flex-wrap items-center gap-2"><span class="size-1.5 rounded-full" style:background={incident.status === 'Resolved' ? 'var(--color-green-600)' : 'var(--pc-accent)'} aria-hidden="true"></span><span class="text-xs font-medium">{incident.title}</span><Chip size="xs">{incident.status}</Chip><span class="ml-auto text-[10px] text-[var(--pc-text-faint)]">{incident.severity}</span></div><p class="mt-2 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">{incident.summary}</p><p class="mt-2 text-[10px] text-[var(--pc-text-faint)]">Started {incident.startedAt}{incident.resolvedAt ? ` · Resolved ${incident.resolvedAt}` : ''}</p></article>{/each}{#if productIncidents.length === 0}<Card padding="md"><p class="text-sm font-medium">No past service problems.</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-65">We will publish an update here if the product has a problem.</p></Card>{/if}</div></section>
	</div>
{:else}
	<StatePanel size="page" icon={Bell} title="Status page not found" description={`There is no public status page for “${slug}”.`} actionLabel="Back to Product Client" actionHref="/" class="pc-enter" />
{/if}
