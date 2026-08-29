<script lang="ts">
	import { ArrowRight, ChartBar, Search, TrendUp } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { Card, Chip } from '$lib/components/ui';
	import { decisionThreads, docs, feedback, incidents, products, releases } from '$lib/data/workspace';

	const metrics = [
		{ label: 'Public reads', value: '184.6K', detail: '+18.4% vs last period' },
		{ label: 'Searches', value: '12.8K', detail: '7 searches had no clear answer' },
		{ label: 'Feedback received', value: '326', detail: '42 linked to upcoming work' },
		{ label: 'Incident resolution', value: '1h 48m', detail: '−22m vs last period' }
	];

	const productsByReads = products.map((product, index) => ({ ...product, reads: ['48.2K', '32.6K', '21.4K', '18.9K', '12.7K'][index] ?? '8.4K', share: [86, 68, 54, 42, 31][index] ?? 22 }));
	const loopSteps = [
		{ label: 'Feedback received', value: feedback.length, detail: 'Customer comments to review', href: '/workspace/feedback' },
		{ label: 'Product choices', value: decisionThreads.length, detail: 'Choices linked to feedback', href: '/workspace/decisions' },
		{ label: 'Updates explained', value: releases.length, detail: 'Changes explained for customers', href: '/workspace/releases' },
		{ label: 'Service problems learned from', value: incidents.length, detail: 'Problems with follow-up work', href: '/workspace/incidents' }
	];
</script>

<svelte:head><title>Analytics | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace" title="Analytics" description="See if people can find answers, understand updates, and know what happens next." />
	<div class="grid grid-cols-2 gap-2.5 py-6 lg:grid-cols-4">{#each metrics as metric}<Card padding="md"><p class="text-xs text-[var(--pc-text-muted)] opacity-70">{metric.label}</p><p class="mt-3 text-xl font-medium tracking-tight tabular-nums">{metric.value}</p><p class="mt-1 text-[11px] text-[var(--pc-text-faint)]">{metric.detail}</p></Card>{/each}</div>
	<section class="pb-6" aria-labelledby="loop-title"><div class="mb-3 flex items-end justify-between gap-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">How work moves</p><h2 id="loop-title" class="mt-1 text-lg font-medium">See where each update came from</h2></div><span class="text-xs text-[var(--pc-text-faint)]">Open any list to learn more</span></div><div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{#each loopSteps as step, index}<a href={step.href} class="group rounded-[16px] bg-[var(--pc-surface-2)] p-4 transition-[background-color,transform] duration-150 hover:bg-[var(--pc-surface)] active:scale-[0.99]"><div class="flex items-center justify-between gap-2"><span class="grid size-7 place-items-center rounded-[9px] bg-[var(--pc-surface)] text-[11px] font-medium text-[var(--pc-text-muted)]">{index + 1}</span><ArrowRight size={14} weight="Outline" class="opacity-40 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" /></div><p class="mt-4 text-sm font-medium">{step.label}</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-70">{step.detail}</p><p class="mt-3 text-2xl font-medium tabular-nums tracking-tight">{step.value}</p></a>{/each}</div></section>
	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_300px]">
		<Card padding="lg"><div class="flex items-center justify-between gap-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">People reading your products</p><h2 class="mt-1 text-lg font-medium">Products by public reads</h2></div><TrendUp size={17} weight="Outline" class="opacity-55" /></div><div class="mt-6 space-y-4">{#each productsByReads as product (product.slug)}<a href={product.publicPath} class="block"><div class="flex items-center gap-3"><img src={product.avatar} alt="" class="size-8 rounded-[9px] object-cover" /><span class="min-w-0 flex-1 truncate text-xs font-medium">{product.name}</span><span class="text-xs tabular-nums text-[var(--pc-text-muted)]">{product.reads}</span></div><div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--pc-surface)]"><div class="h-full rounded-full bg-[var(--pc-accent)]" style:width={`${product.share}%`}></div></div></a>{/each}</div></Card>
		<aside class="space-y-4"><Card padding="md"><div class="flex items-center gap-2"><Search size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Search quality</h2></div><p class="mt-3 text-3xl font-medium tabular-nums">94.2%</p><p class="mt-1 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">Searches that found a useful page or answer.</p><a href="/workspace/docs" class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Review missing answers <ArrowRight size={13} weight="Outline" /></a></Card><Card padding="md"><div class="flex items-center gap-2"><ChartBar size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Published content</h2></div><div class="mt-3 space-y-2 text-xs"><div class="flex justify-between"><span class="text-[var(--pc-text-muted)]">Product updates</span><Chip size="xs">{releases.length}</Chip></div><div class="flex justify-between"><span class="text-[var(--pc-text-muted)]">Help pages</span><Chip size="xs">{docs.length}</Chip></div><div class="flex justify-between"><span class="text-[var(--pc-text-muted)]">Products</span><Chip size="xs">{products.length}</Chip></div></div></Card></aside>
	</div>
</div>
