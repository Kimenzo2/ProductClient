<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, Book, Export, Inbox, Map, Rocket } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
	import RelationList from '$lib/components/workspace/RelationList.svelte';
	import StatusBadge from '$lib/components/workspace/StatusBadge.svelte';
	import VisibilityBadge from '$lib/components/workspace/VisibilityBadge.svelte';
	import { releases, productBySlug, feedbackForProduct, docs, roadmapItems, incidents, type ThreadRelation } from '$lib/data/workspace';

	let id = $derived(page.params.id);
	let release = $derived(releases.find((record) => record.id === id));
	let product = $derived(release ? productBySlug(release.productSlug) : undefined);
	let relatedFeedback = $derived(release ? feedbackForProduct(release.productSlug).slice(0, 2) : []);
	let relatedDocs = $derived(release ? docs.filter((doc) => doc.productSlug === release.productSlug).slice(0, 2) : []);
	let relatedRoadmap = $derived(release ? roadmapItems.find((item) => item.productSlug === release.productSlug && item.status !== 'Shipped') : undefined);
	let relatedIncident = $derived(release ? incidents.find((item) => item.productSlug === release.productSlug) : undefined);
	let releaseRelations = $derived([
		...(relatedRoadmap ? [{ kind: 'Roadmap' as const, title: relatedRoadmap.title, detail: `${relatedRoadmap.status} · ${relatedRoadmap.feedbackCount} customer comments · ${relatedRoadmap.owner}`, href: `/workspace/roadmap#${relatedRoadmap.id}`, status: relatedRoadmap.status }] : []),
		...relatedFeedback.map((item) => ({ kind: 'Feedback' as const, title: item.title, detail: `${item.from} · ${item.priority} priority`, href: item.workspacePath, status: item.status })),
		...relatedDocs.map((doc) => ({ kind: 'Doc' as const, title: doc.title, detail: `${doc.section} · updated ${doc.updatedAt}`, href: doc.publicPath, status: 'Published' })),
		...(relatedIncident ? [{ kind: 'Incident' as const, title: relatedIncident.title, detail: `${relatedIncident.severity} · ${relatedIncident.owner}`, href: relatedIncident.workspacePath, status: relatedIncident.status }] : [])
	] as ThreadRelation[]);
</script>

<svelte:head><title>{release?.title ?? 'Product update'} | Product Client</title></svelte:head>

{#if release}
	<div class="mx-auto w-full max-w-[920px] px-4 sm:px-6">
		<header class="pb-6 pt-8 sm:pt-10"><a href="/workspace/releases" class="inline-flex items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" aria-hidden="true" /> Product updates</a><div class="mt-5 flex flex-wrap items-center gap-2"><Chip size="xs" variant="accent">{release.type}</Chip><StatusBadge label={release.status} tone="success" /><VisibilityBadge label="Public preview" /><span class="text-xs text-[var(--pc-text-faint)]">{release.postedAt} · {release.reads} reads</span></div><h1 class="mt-3 max-w-[36ch] text-[26px] font-medium leading-tight tracking-tight md:text-[34px]">{release.title}</h1><p class="mt-2 text-xs text-[var(--pc-text-muted)] opacity-70">{release.productName} · owned by {release.makerName}</p></header>
		<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
			<main class="space-y-4"><Card padding="lg"><p class="text-sm leading-7 text-[var(--pc-text-muted)]">{release.description}</p><div class="mt-6 flex flex-wrap gap-2"><Button href={release.publicPath} variant="primary" size="sm"><Export size={14} weight="Outline" aria-hidden="true" /> View public update</Button><Button href="/studio" variant="outline" size="sm">Edit update</Button></div></Card><Card padding="md"><div class="flex items-center gap-2"><Map size={15} weight="Outline" class="opacity-55" aria-hidden="true" /><h2 class="text-[13px] font-medium">Update checklist</h2></div><ul class="mt-4 space-y-3 text-xs text-[var(--pc-text-muted)]"><li class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-[var(--color-green-600)]" aria-hidden="true"></span> Customer summary is written</li><li class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-[var(--color-green-600)]" aria-hidden="true"></span> People can find the public update</li><li class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-[var(--pc-accent)]" aria-hidden="true"></span> Link the feedback and help pages</li></ul></Card><Card padding="md"><RelationList relations={releaseRelations} label="Related pages" /></Card></main>
			<aside class="space-y-4">{#if product}<Card padding="md"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Product</p><a href={product.workspacePath} class="mt-3 flex items-center gap-2.5"><img src={product.avatar} alt="" class="size-8 rounded-[9px] object-cover" /><span class="text-xs font-medium">{product.name}</span></a></Card>{/if}<Card padding="md"><div class="flex items-center gap-2"><Inbox size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Customer feedback</h2></div>{#each relatedFeedback as item (item.id)}<a href={item.workspacePath} class="mt-3 block rounded-[11px] bg-[var(--pc-surface)] p-2.5 text-xs">{item.title}</a>{/each}{#if relatedFeedback.length === 0}<p class="mt-3 text-xs text-[var(--pc-text-muted)] opacity-65">No feedback linked yet.</p>{/if}<a href="/workspace/inbox" class="mt-3 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Open inbox <ArrowRight size={13} weight="Outline" /></a></Card><Card padding="md"><div class="flex items-center gap-2"><Book size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Help docs</h2></div>{#each relatedDocs as doc (doc.slug)}<a href={doc.publicPath} class="mt-3 block text-xs text-[var(--pc-accent-light)] hover:underline">{doc.title}</a>{/each}</Card></aside>
		</div>
	</div>
{:else}
	<div class="px-4 sm:px-6"><StatePanel size="page" icon={Rocket} title="Product update not found" description="This product update is not in the current workspace index." actionLabel="Back to product updates" actionHref="/workspace/releases" class="pc-enter" /></div>
{/if}
