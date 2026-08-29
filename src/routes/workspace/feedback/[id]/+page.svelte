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
		<header class="pb-6 pt-8 sm:pt-10"><a href="/workspace/inbox" class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" /> Inbox</a><div class="mt-5 flex flex-wrap items-center gap-2"><Chip variant="accent" size="xs">{item.type}</Chip><Chip size="xs">{item.status}</Chip><span class="text-xs text-[var(--pc-text-faint)]">{item.priority} priority · {item.postedAt}</span></div><h1 class="mt-3 max-w-[36ch] text-[26px] font-medium leading-tight tracking-tight md:text-[34px]">{item.title}</h1><p class="mt-2 text-xs text-[var(--pc-text-muted)] opacity-70">Sent by {item.from} about <a class="text-[var(--pc-accent-light)] hover:underline" href={product?.publicPath ?? '/products'}>{item.productName}</a></p></header>
		<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
			<main class="space-y-4"><Card padding="lg"><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">Original customer message</p><p class="mt-3 text-sm leading-7 text-[var(--pc-text-muted)]">{item.body}</p><div class="mt-6 flex flex-wrap gap-2">{#if linkedProblem}<Button variant="primary" size="sm" href={linkedProblem.workspacePath}><Map size={14} weight="Outline" /> Open the clear problem</Button>{:else}<Button variant="primary" size="sm" href={`/workspace/problems/new?feedback=${item.id}`}><Map size={14} weight="Outline" /> Describe the problem</Button>{/if}<Button variant="outline" size="sm" href="/studio">Reply to customer</Button></div></Card><Card padding="md"><div class="flex items-center gap-2"><CheckCircle size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">What happens next</h2></div><ol class="mt-4 space-y-3 text-xs leading-relaxed text-[var(--pc-text-muted)]"><li class="flex gap-3"><span class="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--pc-text)] text-[10px] text-[var(--pc-bg)]">1</span><span>Keep this message unchanged so the original meaning is not lost.</span></li><li class="flex gap-3"><span class="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[10px]">2</span><span>Describe the need behind it before choosing a fix.</span></li><li class="flex gap-3"><span class="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[10px]">3</span><span>Tell the customer what changed when the work is done.</span></li></ol></Card></main>
			<aside class="space-y-4"><Card padding="md"><div class="flex items-center gap-2"><UserSquare size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Who sent it</h2></div><p class="mt-3 text-sm font-medium">{item.from}</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">Customer feedback · {item.postedAt}</p><a href={item.publicPath} class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Public view <ArrowRight size={13} weight="Outline" /></a></Card><Card padding="md"><div class="flex items-center gap-2"><Inbox size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Related product</h2></div>{#if product}<a href={product.workspacePath} class="mt-3 flex items-center gap-2.5 rounded-[11px] bg-[var(--pc-surface)] p-2"><img src={product.avatar} alt="" class="size-8 rounded-[9px] object-cover" /><span class="text-xs font-medium">{product.name}</span></a>{/if}</Card></aside>
		</div>
	</div>
{:else}
	<StatePanel size="page" icon={Inbox} title="Feedback not found" description="We could not find this feedback in the workspace." actionLabel="Back to inbox" actionHref="/workspace/inbox" class="pc-enter" />
{/if}
