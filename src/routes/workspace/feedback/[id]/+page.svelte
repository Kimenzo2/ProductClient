<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { ArrowLeft, ArrowRight, CheckCircle, Inbox, Map, UserSquare } from 'reicon-svelte';
	import { Button, Card, Chip, Input, StatePanel } from '$lib/components/ui';
	import { feedback as mockFeedback, productBySlug, problemsForFeedback } from '$lib/data/workspace';
	import { loadFeedbackItemById } from '$lib/data/feedbackInbox';
	import { supabase } from '$lib/supabaseClient';
	import { activeProductStore, hydrateActiveProduct } from '$lib/stores/activeProduct.svelte';

	let id = $derived(page.params.id);
	// Mock records first (dev fixtures / legacy ids); live rows load by id when
	// no mock record matches. RLS scopes the live read to owned products.
	let mockItem = $derived(mockFeedback.find((record) => record.id === id));
	let liveDetail = $state<Awaited<ReturnType<typeof loadFeedbackItemById>>>(null);
	let liveChecked = $state(false);
	let item = $derived(
		mockItem ?? (liveDetail ? { ...liveDetail.item, publicPath: '/workspace/feedback' } : undefined)
	);
	let typeLabel = $derived(item ? ('typeLabel' in item ? item.typeLabel : item.type) : '');
	let priority = $derived(item && 'priority' in item ? (item.priority as string) : null);
	let product = $derived(item ? (liveDetail?.product ?? (mockItem ? productBySlug(mockItem.productSlug) : undefined)) : undefined);
	let linkedProblem = $derived(item ? problemsForFeedback(item.id)[0] : undefined);
	let activeSlug = $derived(activeProductStore.activeProduct?.slug ?? null);
	let githubBusy = $state(false);
	let githubMessage = $state('');
	let githubReference = $state('');
	onMount(() => {
		void hydrateActiveProduct();
		const rowId = id;
		if (rowId) {
			loadFeedbackItemById(rowId).then((detail) => {
				liveDetail = detail;
				liveChecked = true;
			});
		} else {
			liveChecked = true;
		}
	});

	async function githubAction(action: 'create' | 'link') {
		if (!id) return;
		githubBusy = true;
		githubMessage = '';
		try {
			const session = await supabase?.auth.getSession();
			const token = session?.data.session?.access_token;
			if (!token) throw new Error('Sign in again to connect GitHub.');
			const response = await fetch('/api/github/feedback', {
				method: 'POST',
				headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
				body: JSON.stringify({ feedback_id: id, action, reference: githubReference })
			});
			const result = await response.json().catch(() => null);
			if (!response.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'GitHub action failed');
			githubReference = result.issue.url;
			githubMessage = action === 'create' ? 'Issue created and linked.' : 'Issue linked.';
		} catch (error) {
			githubMessage = error instanceof Error ? error.message : String(error);
		} finally {
			githubBusy = false;
		}
	}
	$effect(() => {
		if (item && item.productSlug && activeSlug && item.productSlug !== activeSlug) {
			void goto('/workspace/feedback', { replaceState: true });
		}
	});
</script>

<svelte:head><title>{item?.title ?? 'Feedback'} | Inbox | Product Client</title></svelte:head>

{#if item}
	<div class="mx-auto w-full max-w-[920px] px-4 sm:px-6">
		<header class="pb-6 pt-8 sm:pt-10"><a href="/workspace/inbox" class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" /> Inbox</a><div class="mt-5 flex flex-wrap items-center gap-2"><Chip variant="accent" size="xs">{typeLabel}</Chip><Chip size="xs">{item.status}</Chip><span class="text-xs text-[var(--pc-text-faint)]">{#if priority}{priority} priority · {/if}{item.postedAt}</span></div><h1 class="mt-3 max-w-[32ch] text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-balance md:text-[21px] text-wrap-balance">{item.title}</h1><p class="mt-2 text-xs text-[var(--pc-text-muted)] opacity-70">Sent by {item.from} about <a class="text-[var(--pc-accent-light)] hover:underline" href={product?.publicPath ?? '/products'}>{item.productName}</a></p></header>
		<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
			<main class="space-y-4">
				{#if liveDetail}
					<Card padding="md">
						<div class="flex items-center justify-between gap-3"><h2 class="text-[13px] font-medium">GitHub issue</h2><span class="text-[11px] text-[var(--pc-text-faint)]">Linked repository</span></div>
						<p class="mt-2 text-xs text-[var(--pc-text-muted)]">Create or link a GitHub issue to track this feedback.</p>
						<div class="mt-3 flex flex-wrap gap-2"><Button size="sm" loading={githubBusy} onclick={() => githubAction('create')}>Create issue</Button><div class="flex min-w-[230px] flex-1 gap-2"><Input bind:value={githubReference} placeholder="owner/repo#123 or URL" aria-label="GitHub issue URL" /><Button size="sm" variant="outline" loading={githubBusy} onclick={() => githubAction('link')}>Link issue</Button></div></div>
						{#if githubMessage}<p class="mt-2 text-xs text-[var(--pc-text-muted)]" role="status">{githubMessage}</p>{/if}
					</Card>
				{:else}
					<div class="min-h-[180px] py-4" aria-hidden="true"></div><div class="min-h-[180px] py-4" aria-hidden="true"></div>
				{/if}
			</main>
			<aside class="space-y-4"><Card padding="md"><div class="flex items-center gap-2"><UserSquare size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Who sent it</h2></div><p class="mt-3 text-sm font-medium">{item.from}</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">Customer feedback · {item.postedAt}</p><a href={item.publicPath} class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Public view <ArrowRight size={13} weight="Outline" /></a></Card><Card padding="md"><div class="flex items-center gap-2"><Inbox size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Related product</h2></div>{#if product}<a href={product.workspacePath} class="mt-3 flex items-center gap-2.5 rounded-[11px] bg-[var(--pc-surface)] p-2"><img src={product.avatar} alt="" class="size-8 rounded-[9px] object-cover" /><span class="text-xs font-medium">{product.name}</span></a>{/if}</Card></aside>
		</div>
	</div>
{:else if !liveChecked}
	<div class="mx-auto w-full max-w-[920px] px-4 sm:px-6"><div class="mt-10 h-[220px] animate-pulse rounded-[24px] bg-[var(--pc-surface-2)]" aria-hidden="true"></div></div>
{:else}
	<StatePanel size="page" icon={Inbox} title="Feedback not found" description="We could not find this feedback in the workspace." actionLabel="Back to inbox" actionHref="/workspace/inbox" class="pc-enter" />
{/if}
