<script lang="ts">
	import { AlertTriangle, ArrowRight, CheckCircle, Clock } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Card, Chip, StatePanel } from '$lib/components/ui';
	import { incidents } from '$lib/data/workspace';

	let filter = $state<'All' | 'Open' | 'Resolved'>('All');
	let filtered = $derived(incidents.filter((incident) => filter === 'All' || (filter === 'Open' ? incident.status !== 'Resolved' : incident.status === 'Resolved')));
</script>

<svelte:head><title>Service problems | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace" title="Service problems" description="Keep the team response, customer updates, and what we learned in one timeline." actionLabel="Report a service problem" actionHref="/workspace/incidents/new" />
	<div class="flex flex-wrap items-center gap-2 py-5" role="group" aria-label="Service problem filters">
		{#each ['All', 'Open', 'Resolved'] as item}<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition-[background-color,color] duration-150 {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{#if item === 'Resolved'}<CheckCircle size={13} weight="Outline" />{:else}<AlertTriangle size={13} weight="Outline" />{/if}{item}</button>{/each}<span class="ml-auto text-xs text-[var(--pc-text-faint)]">{filtered.length} service problems</span>
	</div>
	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
		<section class="space-y-2" aria-label="Service problem records">{#each filtered as incident (incident.id)}<EntityRow href={incident.workspacePath} kind="Incident" title={incident.title} subtitle={`${incident.productName} · ${incident.severity}`} description={incident.summary} status={incident.status} meta={`${incident.owner} · ${incident.startedAt}`} />{/each}{#if filtered.length === 0}<StatePanel icon={AlertTriangle} title="No service problems in this view" description="Try another filter." />{/if}</section>
		<aside class="space-y-4"><Card padding="md"><div class="flex items-center gap-2"><Clock size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">What happens next</h2></div><div class="mt-3 space-y-2 text-xs text-[var(--pc-text-muted)] opacity-70"><p><strong class="text-[var(--pc-text)]">Report</strong> what is wrong and who is affected.</p><p><strong class="text-[var(--pc-text)]">Respond</strong> by giving the team an owner and a plan.</p><p><strong class="text-[var(--pc-text)]">Update</strong> customers with the latest information.</p><p><strong class="text-[var(--pc-text)]">Learn</strong> by recording what changed afterwards.</p></div><Chip size="xs" variant="accent" class="mt-4">Clear updates for customers</Chip></Card><a href="/status/vercel" class="flex items-center justify-between rounded-[16px] bg-[var(--pc-surface-2)] p-3 text-xs transition-colors hover:bg-[var(--pc-surface)]"><span>Open public status page</span><ArrowRight size={14} weight="Outline" /></a></aside>
	</div>
</div>
