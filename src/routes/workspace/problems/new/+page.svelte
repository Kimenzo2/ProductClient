<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, CheckCircle, Compass } from 'reicon-svelte';
	import { Button, Card, Input, Label, StatePanel, Textarea } from '$lib/components/ui';
	import { feedback, products } from '$lib/data/workspace';

	const feedbackId = page.url.searchParams.get('feedback') ?? '';
	const source = feedback.find((item) => item.id === feedbackId);

	let productSlug = $state(source?.productSlug ?? products[0]?.slug ?? '');
	let title = $state('');
	let statement = $state(source?.body ?? '');
	let affectedAudience = $state('');
	let workaround = $state('');
	let submitted = $state(false);
	let error = $state('');

	function submit() {
		error = '';
		if (!title.trim() || !statement.trim() || !affectedAudience.trim()) {
			error = 'Add a short name, explain the need, and say who is affected.';
			return;
		}
		submitted = true;
	}
</script>

<svelte:head><title>Describe a problem | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[760px] px-4 sm:px-6">
	<header class="pb-6 pt-8 sm:pt-12">
		<a href={source ? `/workspace/feedback/${source.id}` : '/workspace/problems'} class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" aria-hidden="true" /> {source ? 'Back to feedback' : 'Back to problems'}</a>
		<p class="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Understand the need</p>
		<h1 class="mt-2 text-[26px] font-medium tracking-tight md:text-[34px]">Describe the problem.</h1>
		<p class="mt-2 max-w-[58ch] text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-75">A message may suggest a fix. This short note explains what people need before the team chooses how to help.</p>
	</header>

	{#if submitted}
		<StatePanel variant="success" size="page" icon={CheckCircle} title="Your problem note is ready" description="Here is the note you just wrote. Check it before deciding what to do next." actionLabel={source ? 'Return to feedback' : 'Back to problems'} actionHref={source ? `/workspace/feedback/${source.id}` : '/workspace/problems'} class="mb-12">
			<div class="mt-6 w-full max-w-[460px] rounded-[14px] bg-[var(--pc-surface)] p-4 text-left">
				<p class="text-sm font-medium">{title}</p>
				<p class="mt-2 text-xs leading-relaxed text-[var(--pc-text-muted)]">{statement}</p>
				<p class="mt-3 text-[11px] text-[var(--pc-text-faint)]">For: {affectedAudience}</p>
			</div>
		</StatePanel>
	{:else}
		<form onsubmit={(event) => { event.preventDefault(); submit(); }} class="mb-12 space-y-5">
			<Card padding="lg">
				<div><Label for="problem-product">Product</Label><select id="problem-product" bind:value={productSlug} class="mt-2 h-10 w-full rounded-[10px] bg-[var(--pc-surface)] px-3 text-[13px] outline-none focus:ring-2 focus:ring-[var(--pc-accent)]">{#each products as product}<option value={product.slug}>{product.name}</option>{/each}</select></div>
				<div class="mt-5"><Label for="problem-title">Short name</Label><Input id="problem-title" bind:value={title} placeholder="What is getting in the way?" class="mt-2" /></div>
				<div class="mt-5"><Label for="problem-statement">What are people trying to do?</Label><Textarea id="problem-statement" bind:value={statement} placeholder="Explain the need in plain language, without choosing a solution yet." class="mt-2 min-h-[120px]" /></div>
				<div class="mt-5"><Label for="problem-audience">Who is affected?</Label><Input id="problem-audience" bind:value={affectedAudience} placeholder="For example: new customers on a mobile phone" class="mt-2" /></div>
				<div class="mt-5"><Label for="problem-workaround">What do people do today? <span class="text-[var(--pc-text-faint)]">(optional)</span></Label><Textarea id="problem-workaround" bind:value={workaround} placeholder="Describe the workaround, delay, or extra help they need." class="mt-2 min-h-[100px]" /></div>
				{#if source}<div class="mt-5 flex items-start gap-2 rounded-[11px] bg-[var(--pc-surface)] p-3 text-xs leading-relaxed text-[var(--pc-text-muted)]"><Compass size={14} weight="Outline" class="mt-0.5 shrink-0 opacity-55" aria-hidden="true" /><span>This note started from “{source.title}”. The original customer message stays unchanged.</span></div>{/if}
				{#if error}<p class="mt-4 rounded-[10px] bg-[var(--red-6)]/10 px-3 py-2 text-xs text-[var(--red-6)]" role="alert">{error}</p>{/if}
			</Card>
			<div class="flex items-center justify-end gap-2"><Button href={source ? `/workspace/feedback/${source.id}` : '/workspace/problems'} variant="ghost" size="md">Cancel</Button><Button type="submit" variant="primary" size="md">Review problem note</Button></div>
		</form>
	{/if}
</div>
