<script lang="ts">
	import { CheckCircle, Map, Plus } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { Button, Card, Chip } from '$lib/components/ui';
	import { roadmapItems } from '$lib/data/workspace';

	const lanes = ['Now', 'Next', 'Later', 'Shipped'] as const;
</script>

<svelte:head><title>Roadmap | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Choose" title="Roadmap" description="Keep upcoming work connected to the feedback and product updates that explain it." actionLabel="Choose what to do" actionHref="/workspace/decisions" />
	<div class="grid gap-3 py-6 md:grid-cols-2 xl:grid-cols-4">
		{#each lanes as lane}
			<section class="min-w-0" aria-labelledby={`lane-${lane}`}>
				<div class="mb-2 flex items-center justify-between px-1"><h2 id={`lane-${lane}`} class="text-[13px] font-medium">{lane}</h2><span class="text-[10px] text-[var(--pc-text-faint)]">{roadmapItems.filter((item) => item.status === lane).length}</span></div>
				<div class="space-y-2">
					{#each roadmapItems.filter((item) => item.status === lane) as item (item.id)}
						<Card padding="md" class="group" id={item.id}>
							<div class="flex items-start gap-2"><span class="grid size-7 shrink-0 place-items-center rounded-[9px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)]">{#if lane === 'Shipped'}<CheckCircle size={14} weight="Outline" />{:else}<Map size={14} weight="Outline" />{/if}</span><div class="min-w-0"><h3 class="text-[13px] font-medium leading-snug">{item.title}</h3><p class="mt-1 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">{item.description}</p></div></div>
							<div class="mt-4 flex items-center gap-2"><Chip size="xs" variant="accent">{item.productName}</Chip></div>
						</Card>
					{/each}
					{#if roadmapItems.filter((item) => item.status === lane).length === 0}<div class="rounded-[16px] bg-[var(--pc-surface)] px-3 py-8 text-center text-xs text-[var(--pc-text-faint)]">Nothing here yet</div>{/if}
				</div>
			</section>
		{/each}
	</div>
</div>
