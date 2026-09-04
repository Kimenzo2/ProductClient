<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, CheckCircle, Inbox, Map, UserSquare } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
	import { feedback, productBySlug, problemsForFeedback } from '$lib/data/workspace';

	let id = $derived(page.params.id);
	let item = $derived(feedback.find((record) => record.id === id));
	let product = $derived(item ? productBySlug(item.productSlug) : undefined);
	let linkedProblem = $derived(item ? problemsForFeedback(item.id)[0] : undefined);
</script>

<svelte:head><title>{item?.title ?? 'Feedback'} | Inbox | Product Client</title></svelte:head>

{#if item}
	<div class="mx-auto w-full max-w-[920px] px-4 sm:px-6">
		<header class="pb-6 pt-8 sm:pt-10"><a href="/workspace/inbox" class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" /> Inbox</a><div class="mt-5 flex flex-wrap items-center gap-2"><Chip variant="accent" size="xs">{item.type}</Chip><Chip size="xs">{item.status}</Chip><span class="text-xs text-[var(--pc-text-faint)]">{item.priority} priority · {item.postedAt}</span></div><h1 class="mt-3 max-w-[32ch] text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-balance md:text-[21px]">{item.title}</h1><p class="mt-2 text-xs text-[var(--pc-text-muted)] opacity-70">Sent by {item.from} about <a class="text-[var(--pc-accent-light)] hover:underline" href={product?.publicPath ?? '/products'}>{item.productName}</a></p></header>
		<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
			<main class="space-y-4"><div class="min-h-[180px] py-4" aria-hidden="true"></div><div class="min-h-[180px] py-4" aria-hidden="true"></div></main>
			<aside class="space-y-4"><Card padding="md"><div class="flex items-center gap-2"><UserSquare size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Who sent it</h2></div><p class="mt-3 text-sm font-medium">{item.from}</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">Customer feedback · {item.postedAt}</p><a href={item.publicPath} class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Public view <ArrowRight size={13} weight="Outline" /></a></Card><Card padding="md"><div class="flex items-center gap-2"><Inbox size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Related product</h2></div>{#if product}<a href={product.workspacePath} class="mt-3 flex items-center gap-2.5 rounded-[11px] bg-[var(--pc-surface)] p-2"><img src={product.avatar} alt="" class="size-8 rounded-[9px] object-cover" /><span class="text-xs font-medium">{product.name}</span></a>{/if}</Card></aside>
		</div>
	</div>
{:else}
	<StatePanel size="page" icon={Inbox} title="Feedback not found" description="We could not find this feedback in the workspace." actionLabel="Back to inbox" actionHref="/workspace/inbox" class="pc-enter" />
{/if}
