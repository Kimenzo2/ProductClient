<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, Book, Search } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
	import { publicDocs, publicProductBySlug, publicProductStories } from '$lib/data/public';

	let productSlug = $derived(page.params.product ?? '');
	let docSlug = $derived(page.params.slug ?? '');
	let doc = $derived(publicDocs.find((record) => record.productSlug === productSlug && record.slug === docSlug));
	let product = $derived(publicProductBySlug(productSlug));
	let relatedDocs = $derived(publicDocs.filter((record) => record.productSlug === productSlug && record.slug !== docSlug));
	let relatedThread = $derived(publicProductStories.find((thread) => thread.productSlug === productSlug));
	let helpful = $state<boolean | undefined>(undefined);
</script>

<svelte:head><title>{doc?.title ?? 'Help page'} | {product?.name ?? productSlug} | Product Client</title></svelte:head>

{#if doc}
	<div class="mx-auto w-full max-w-[1080px] px-4 sm:px-6">
		<div class="grid gap-8 py-8 sm:py-12 lg:grid-cols-[220px_minmax(0,680px)_220px]">
			<aside class="order-2 lg:order-1"><a href="/search?q={encodeURIComponent(doc.title)}" class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><Search size={13} weight="Outline" /> Search help</a><nav class="mt-3 space-y-1" aria-label="Help pages"><a href={doc.publicPath} aria-current="page" class="block rounded-[10px] bg-[var(--pc-surface-2)] px-3 py-2 text-xs font-medium">{doc.title}</a>{#each relatedDocs as related}<a href={related.publicPath} class="block rounded-[10px] px-3 py-2 text-xs text-[var(--pc-text-muted)] transition-colors hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]">{related.title}</a>{/each}</nav></aside>
			<main class="order-1 min-w-0 lg:order-2"><a href="/" class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" aria-hidden="true" /> Product Client</a><div class="mt-8 flex items-center gap-2"><Chip size="xs" variant="accent">{doc.section}</Chip><span class="text-[10px] text-[var(--pc-text-faint)]">Updated {doc.updatedAt}</span></div><h1 class="mt-4 text-[30px] font-medium leading-tight tracking-tight md:text-[40px]">{doc.title}</h1><p class="mt-3 max-w-[60ch] text-[15px] leading-7 text-[var(--pc-text-muted)] opacity-80">{doc.description}</p><div class="prose-pc mt-8 space-y-5"><p>Product Client keeps the explanation close to the change. This page gives the team and customers one clear place to understand what to do.</p><h2>Start with the answer</h2><p>Write the shortest useful answer first. Then add the details a reader needs without sending them to another tool.</p><div class="rounded-[14px] bg-[var(--pc-surface-2)] p-4"><p class="text-xs font-medium">What this page connects</p><ul class="mt-3 space-y-2 text-sm text-[var(--pc-text-muted)]"><li>The product and who it is for</li><li>The update or change</li><li>Customer feedback</li><li>Service status and follow-up</li></ul></div><h2>Keep pages up to date</h2><p>When a customer asks a question, link the answer. When the product changes, update the page. When a service problem is fixed, explain what happened.</p></div>{#if relatedThread}<div class="mt-8 rounded-[16px] bg-[var(--pc-surface-2)] p-4"><p class="mt-2 text-sm font-medium">This page helps explain "{relatedThread.title}".</p><a href={`/p/${productSlug}`} class="mt-2 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Return to {product?.name ?? productSlug} <ArrowRight size={12} weight="Outline" aria-hidden="true" /></a></div>{/if}<div class="mt-8 rounded-[16px] bg-[var(--pc-surface-2)] p-4" aria-live="polite"><div class="flex flex-wrap items-center justify-between gap-3"><div><p class="text-xs font-medium">Was this page helpful?</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-70">Your answer helps us find missing or unclear answers.</p></div>{#if helpful === undefined}<div class="flex gap-2"><Button variant="outline" size="sm" onclick={() => (helpful = true)}>Yes</Button><Button variant="outline" size="sm" onclick={() => (helpful = false)}>Not quite</Button></div>{:else}<span class="text-xs text-[var(--pc-accent-light)]">Thanks. We saved your feedback for review.</span>{/if}</div></div><div class="mt-10 flex items-center justify-between border-t border-[var(--pc-border-strong)]/30 pt-5"><a href="/search" class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" aria-hidden="true" /> More help pages</a>{#if relatedDocs[0]}<a href={relatedDocs[0].publicPath} class="inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Next: {relatedDocs[0].title} <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a>{/if}</div></main>
			<aside class="order-3"><Card padding="md"><div class="flex items-center gap-2"><Book size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Need help?</h2></div><p class="mt-3 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">Search updates, feedback, and service problems for this product.</p><Button href="/search" variant="ghost" size="sm" class="mt-4 w-full justify-center">Search Product Client</Button></Card></aside>
		</div>
	</div>
{:else}
	<StatePanel size="page" icon={Book} title="Help page not found" description="This page may have moved or is not published yet." actionLabel="Back to Product Client" actionHref="/" class="pc-enter" />
{/if}

<style>
	.prose-pc p, .prose-pc li { max-width: 65ch; color: var(--pc-text-muted); font-size: 15px; line-height: 1.8; }
	.prose-pc h2 { margin-top: 2rem; font-size: 19px; font-weight: 500; letter-spacing: -0.02em; }
</style>
