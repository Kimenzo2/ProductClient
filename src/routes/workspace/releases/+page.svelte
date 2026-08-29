<script lang="ts">
	import { ArrowRight, History, Rocket } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Button, Card, Chip } from '$lib/components/ui';
	import { releases } from '$lib/data/workspace';

	let filter = $state<'All' | 'Launch' | 'Changelog' | 'Incident'>('All');
	let filtered = $derived(releases.filter((release) => filter === 'All' || release.type === filter.toLowerCase()));
</script>

<svelte:head><title>Product updates | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace" title="Product updates" description="Write, review, publish, and measure every change customers can see from one timeline." actionLabel="Write product update" />
	<div class="flex flex-wrap items-center gap-2 py-5" role="group" aria-label="Release filters">
		{#each ['All', 'Launch', 'Changelog', 'Incident'] as item}
			<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex h-9 items-center rounded-full px-3 text-xs transition-[background-color,color] duration-150 {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{item === 'All' ? 'Everything' : item === 'Incident' ? 'Service problem updates' : item === 'Changelog' ? 'Change updates' : item}</button>
		{/each}
		<span class="ml-auto text-xs text-[var(--pc-text-faint)]">{filtered.length} releases</span>
	</div>
	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
		<section class="space-y-2" aria-label="Release timeline">
			{#each filtered as release (release.id)}<EntityRow href={release.publicPath} kind="Release" title={release.title} subtitle={`${release.productName} · ${release.type} · ${release.postedAt}`} description={release.description} status={release.status} meta={`${release.reads} reads · by ${release.makerName}`} avatar={release.productAvatar} />{/each}
		</section>
		<aside class="space-y-4"><Card padding="md"><div class="flex items-center gap-2"><Rocket size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Update checklist</h2></div><ul class="mt-3 space-y-2 text-xs text-[var(--pc-text-muted)] opacity-70"><li>Link the product decision.</li><li>Add help pages and media.</li><li>Choose who should see it and when.</li><li>Preview the public page.</li><li>Check reads, reactions, and follow-up.</li></ul><Button href="/studio" variant="primary" class="mt-4 w-full justify-center">Open Studio <ArrowRight size={13} weight="Outline" /></Button></Card><Card padding="md"><div class="flex items-center gap-2"><History size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Keep the story together</h2></div><p class="mt-2 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">Each update can link to the product, help pages, feedback, service problems, media, and the public announcement.</p><Chip size="xs" variant="accent" class="mt-3">Add links before publishing</Chip></Card></aside>
	</div>
</div>
