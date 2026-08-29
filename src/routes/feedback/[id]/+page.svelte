<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, CheckCircle, Message, Share } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
	import { publicFeedback, publicProductBySlug } from '$lib/data/public';

	let id = $derived(page.params.id);
	let item = $derived(publicFeedback.find((record) => record.id === id));
	let product = $derived(item ? publicProductBySlug(item.productSlug) : undefined);
	let voted = $state(false);
</script>

<svelte:head><title>{item?.title ?? 'Feedback'} | Product Client</title></svelte:head>

{#if item}
	<div class="mx-auto w-full max-w-[820px] px-4 sm:px-6">
		<header class="pb-6 pt-8 sm:pt-12"><a href={product?.publicPath ?? '/products'} class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" /> {item.productName}</a><div class="mt-5 flex flex-wrap items-center gap-2"><Chip size="xs" variant="accent">{item.type}</Chip><Chip size="xs">{item.status}</Chip><span class="text-xs text-[var(--pc-text-faint)]">{item.postedAt}</span></div><h1 class="mt-3 max-w-[34ch] text-[26px] font-medium leading-tight tracking-tight md:text-[36px]">{item.title}</h1><p class="mt-2 text-xs text-[var(--pc-text-muted)] opacity-70">A customer message about {item.productName}.</p></header>
		<div class="grid gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_260px]">
			<main class="space-y-4"><Card padding="lg"><p class="text-[15px] leading-8 text-[var(--pc-text-muted)]">{item.body}</p><div class="mt-7 flex flex-wrap items-center gap-2"><button type="button" onclick={() => (voted = !voted)} aria-pressed={voted} class="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,color,transform] duration-150 {voted ? 'bg-[var(--pc-accent)] text-[var(--pc-bg)]' : 'bg-[var(--pc-text)] text-[var(--pc-bg)]'} active:scale-[0.96]"><CheckCircle size={15} weight="Outline" /> {voted ? 'Voted' : 'I want this too'}</button><Button variant="outline" size="md" href="/feedback/new"><Message size={15} weight="Outline" /> Share feedback</Button><Button variant="ghost" size="md" href={product?.publicPath ?? '/products'}><ArrowRight size={15} weight="Outline" /> Product page</Button></div></Card></main>
			<aside class="space-y-4"><Card padding="md"><div class="flex items-center gap-2"><Share size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">What happens next</h2></div><p class="mt-3 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">The team can connect this message to a product choice and tell you when something changes.</p><a href="/wall/{item.productSlug}-proof" class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">See customer stories <ArrowRight size={13} weight="Outline" /></a></Card><Card padding="md"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Sent by</p><p class="mt-2 text-sm font-medium">{item.from}</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">{item.postedAt}</p></Card></aside>
		</div>
	</div>
{:else}
	<StatePanel size="page" icon={Message} title="Feedback not found" description="This feedback record is not available." actionLabel="Share feedback" actionHref="/feedback/new" class="pc-enter" />
{/if}
