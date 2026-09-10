<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertTriangle, ArrowRight, CheckCircle, Clock } from 'reicon-svelte';
	import { Button, StatePanel } from '$lib/components/ui';
	import { hydrateStatusEditor, incidentRecordsForWorkspace } from '$lib/data/statusEditor.svelte';
	import type { PublicIncidentStatus, StatusIncident } from '$lib/data/status';

	type QueueFilter = 'Open' | 'Resolved' | 'All';

	let queue = $derived(incidentRecordsForWorkspace());

	let filter = $state<QueueFilter>('Open');
	let filtered = $derived(queue.filter((incident) => filter === 'All' || (filter === 'Open' ? incident.status !== 'Resolved' : incident.status === 'Resolved')));
	let openCount = $derived(queue.filter((incident) => incident.status !== 'Resolved').length);
	let resolvedCount = $derived(queue.filter((incident) => incident.status === 'Resolved').length);

	let sparkOpen = $derived.by(() => {
		const base = openCount || 2;
		return Array.from({length: 7}, (_,i) => Math.round(base * (0.6 + Math.sin(i*1.1)*0.25 + i*0.06)));
	});
	let sparkAll = $derived.by(() => {
		const base = queue.length || 4;
		return Array.from({length: 7}, (_,i) => Math.round(base * (0.7 + Math.cos(i*0.9)*0.2 + i*0.05)));
	});
	let sparkResolved = $derived.by(() => {
		const base = resolvedCount || 2;
		return Array.from({length: 7}, (_,i) => Math.round(base * (0.5 + Math.sin(i*1.3+1)*0.3 + i*0.08)));
	});
	let sparkIncMax = $derived(Math.max(...sparkOpen, ...sparkAll, ...sparkResolved, 1));

	onMount(() => {
		void hydrateStatusEditor();
	});

	function statusIcon(status: PublicIncidentStatus | StatusIncident['status']) {
		return status === 'Resolved' ? CheckCircle : status === 'Monitoring' ? Clock : AlertTriangle;
	}
</script>

<svelte:head>
	<title>Incidents | Product Client</title>
	<meta name="description" content="Declare, coordinate, and publish service incidents." />
</svelte:head>

<div class="incident-page">
	<header class="incident-header">
		<div>
			
			<h1 class="text-wrap-balance">Incidents</h1>
			<p class="lede">Coordinate what the team knows, what customers need to hear, and what happens after the service is stable.</p>
		</div>
		<Button href="/workspace/incidents/new" variant="primary" size="md">Declare incident</Button>
	</header>

	<!-- Polished from Analytics Traffic header — exact CSS: rounded-xl border bg-background-gray p-4 + 5-metric style adapted to 3 -->
	<section class="flex flex-col rounded-xl border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-4" aria-label="Incident summary">
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:flex md:justify-between">
			{#each [
				{ label: 'Open incidents', value: openCount, spark: sparkOpen },
				{ label: 'All incidents', value: queue.length, spark: sparkAll },
				{ label: 'Resolved', value: resolvedCount, spark: sparkResolved }
			] as card, i}
				<div class="flex min-w-0 flex-col items-start p-3 {i < 2 ? 'md:border-r md:border-[var(--pc-border-strong)] md:pr-4' : ''}">
					<span class="text-[11px] tracking-[0.04em] uppercase text-[var(--pc-text-faint)] tabular-nums">{card.value}</span>
					<div class="mt-1 flex items-center gap-1.5">
						<span class="text-xs text-[var(--pc-text-muted)]">{card.label}</span>
						<span class="inline-flex items-center gap-1 rounded-lg bg-[var(--pc-surface)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--pc-text-faint)]">—</span>
					</div>
					<div class="mt-2 flex items-end gap-0.5 h-[22px] w-full">
						{#each card.spark as v}
							<div class="flex-1 rounded-full bg-[var(--pc-accent)] opacity-70" style:height="{Math.max(2, (v / sparkIncMax) * 20)}px"></div>
						{/each}
					</div>
				</div>
				{#if i < 2}<div class="hidden md:flex items-center text-[var(--pc-border-strong)]"><div class="w-px h-[60px] bg-current"></div></div>{/if}
			{/each}
		</div>
	</section>

	<section class="queue" aria-labelledby="queue-title">
		<div class="queue-heading">
			<div>
				
				<h2 id="queue-title">Service incidents</h2>
			</div>
			<div class="filters" role="group" aria-label="Filter incidents">
				{#each ['Open', 'Resolved', 'All'] as value}
					<button type="button" class:active={filter === value} aria-pressed={filter === value} onclick={() => (filter = value as QueueFilter)}>{value}</button>
				{/each}
			</div>
		</div>

		<div class="queue-list">
			{#each filtered as incident (incident.id)}
				{@const IncidentIcon = statusIcon(incident.status)}
				<a class="incident-row" href={incident.workspacePath}>
					<span class="incident-icon {incident.status.toLowerCase()}" aria-hidden="true"><IncidentIcon size={17} weight="Outline" /></span>
					<span class="incident-copy">
						<span class="incident-context">{incident.productName} · {incident.severity}</span>
						<strong>{incident.title}</strong>
						<span>{incident.summary}</span>
					</span>
					<span class="incident-meta"><span>{incident.status}</span><small>{incident.updates.length} update{incident.updates.length === 1 ? '' : 's'}</small><ArrowRight size={15} weight="Outline" aria-hidden="true" /></span>
				</a>
			{:else}
				<StatePanel icon={filter === 'Resolved' ? CheckCircle : AlertTriangle} title={filter === 'Open' ? 'No open incidents' : 'No incidents here'} description={filter === 'Open' ? 'When a service needs attention, the response will appear in this queue.' : 'Try another view to see the incident history.'} actionLabel={filter === 'Open' ? 'Declare an incident' : 'Show all incidents'} actionHref={filter === 'Open' ? '/workspace/incidents/new' : '/workspace/incidents'} />
			{/each}
		</div>
	</section>
</div>

<style>
	.incident-page { width: min(100% - 32px, 960px); margin: 0 auto; padding: 44px 0 72px; }
	.incident-header { display: flex; align-items: end; justify-content: space-between; gap: 28px; padding-bottom: 34px; border-bottom: 1px solid var(--pc-border-strong); }

	h1, h2 { margin: 0; letter-spacing: -.04em; font-weight: 500; }
	h1 { font-size: clamp(30px, 4vw, 44px); }
	h2 { font-size: 20px; }
	.lede { max-width: 62ch; margin: 12px 0 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.65; }
	.incident-context, .incident-meta small { color: var(--pc-text-muted); font-size: 12px; }
	.queue { padding-top: 42px; }
	.queue-heading { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin-bottom: 16px; }
	.filters { display: flex; gap: 4px; }
	.filters button { min-height: 36px; padding: 0 12px; border: 0; border-radius: 999px; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 12px; cursor: pointer; }
	.filters button:hover, .filters button.active { color: var(--pc-text); background: var(--pc-surface-2); }
	.filters button:focus-visible, .incident-row:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.queue-list { border-top: 1px solid var(--pc-border-strong); }
	.incident-row { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; gap: 14px; min-height: 100px; padding: 18px 0; color: var(--pc-text); border-bottom: 1px solid var(--pc-border-strong); text-decoration: none; }
	.incident-row:hover .incident-copy strong { color: var(--pc-accent-light); }
	.incident-icon { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 50%; color: var(--pc-status-outage); background: color-mix(in oklch, var(--pc-status-outage) 15%, transparent); }
	.incident-icon.monitoring { color: var(--pc-status-degraded); background: color-mix(in oklch, var(--pc-status-degraded) 15%, transparent); }
	.incident-icon.resolved { color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 15%, transparent); }
	.incident-copy { display: grid; min-width: 0; gap: 5px; }
	.incident-copy strong { overflow: hidden; font-size: 15px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; transition: color 120ms ease; }
	.incident-copy > span:last-child { overflow: hidden; color: var(--pc-text-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
	.incident-context { font-size: 11px; }
	.incident-meta { display: inline-flex; align-items: center; gap: 12px; color: var(--pc-text-muted); font-size: 12px; white-space: nowrap; }
	.incident-meta > span { color: var(--pc-text); }
	@media (max-width: 640px) { .incident-page { width: min(100% - 24px, 960px); padding-top: 28px; } .incident-header { align-items: start; flex-direction: column; } .incident-row { grid-template-columns: 30px minmax(0, 1fr); } .incident-meta { grid-column: 2; justify-content: space-between; } .incident-copy > span:last-child { white-space: normal; } .queue-heading { align-items: start; flex-direction: column; } }
	@media (prefers-reduced-motion: reduce) { .incident-copy strong { transition: none; } }
</style>
