<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { AlertTriangle, ArrowRight, Calendar, CheckCircle, Clock, Export, History, Search, User } from 'reicon-svelte';
	import { Button, Input, Label, Select } from '$lib/components/ui';
	import { followUpPreview, hydrateFollowUps, resetFollowUps, updateFollowUp } from '$lib/data/followUps.svelte';
	import { incidents, type FollowUpRecord, type IncidentRecord } from '$lib/data/workspace';

	type FollowUpFilter = 'Everything' | FollowUpRecord['status'];
	type EnrichedFollowUp = FollowUpRecord & { incident?: IncidentRecord };

	const filters: FollowUpFilter[] = ['Everything', 'Open', 'In progress', 'Done'];

	let query = $state('');
	let filter = $state<FollowUpFilter>('Everything');
	let selectedId = $state('');
	let editorStatus = $state<FollowUpRecord['status']>('Open');
	let editorOwner = $state('');
	let editorDue = $state('');
	let saveNotice = $state('');

	let records = $derived<EnrichedFollowUp[]>(followUpPreview.records.map((followUp) => ({
		...followUp,
		incident: incidents.find((incident) => incident.id === followUp.incidentId)
	})));
	let openCount = $derived(records.filter((followUp) => followUp.status !== 'Done').length);
	let normalizedQuery = $derived(query.trim().toLowerCase());
	let filtered = $derived(
		records.filter((followUp) => {
			const matchesStatus = filter === 'Everything' || followUp.status === filter;
			const haystack = [
				followUp.title,
				followUp.description,
				followUp.owner,
				followUp.kind,
				followUp.incident?.title ?? '',
				followUp.incident?.productName ?? ''
			].join(' ').toLowerCase();
			return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
		})
	);
	let activeFollowUp = $derived(filtered.find((followUp) => followUp.id === selectedId) ?? filtered[0] ?? null);
	let ownerOptions = $derived(
		[...new Set(records.map((followUp) => followUp.owner).filter(Boolean))]
			.sort((a, b) => a.localeCompare(b))
			.map((owner) => ({ value: owner, label: owner }))
	);

	onMount(() => {
		hydrateFollowUps();
		const requestedId = page.url.searchParams.get('selected');
		selectedId = records.some((followUp) => followUp.id === requestedId) ? requestedId ?? '' : records[0]?.id ?? '';
	});

	$effect(() => {
		const current = activeFollowUp;
		if (!current) return;
		editorStatus = current.status;
		editorOwner = current.owner;
		editorDue = current.due;
	});

	function statusIcon(status: FollowUpRecord['status']) {
		return status === 'Done' ? CheckCircle : status === 'In progress' ? Clock : AlertTriangle;
	}

	function statusClass(status: FollowUpRecord['status']) {
		return status === 'Done' ? 'done' : status === 'In progress' ? 'in-progress' : 'open';
	}

	function selectFollowUp(id: string) {
		selectedId = id;
		saveNotice = '';
		void goto(`/workspace/incidents/follow-ups?selected=${encodeURIComponent(id)}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function clearFilters() {
		query = '';
		filter = 'Everything';
	}

	function saveEdits(event: SubmitEvent) {
		event.preventDefault();
		if (!activeFollowUp) return;

		updateFollowUp(activeFollowUp.id, {
			status: editorStatus,
			owner: editorOwner.trim() || 'Unassigned',
			due: editorDue.trim() || 'No due date'
		});
		saveNotice = 'Saved to this preview';
	}

	function resetPreview() {
		resetFollowUps();
		saveNotice = 'Preview reset to the sample data';
	}
</script>

<svelte:head>
	<title>Follow-ups | Product Client</title>
	<meta name="description" content="Track the work that follows a Product Client incident." />
</svelte:head>

<div class="follow-up-page">
	<header class="page-header">
		<div>
			
			<h1>Follow-ups</h1>
			<p class="lede">Keep the work after an incident visible, owned, and moving.</p>
		</div>
		<span class="open-summary">{openCount} open item{openCount === 1 ? '' : 's'}</span>
	</header>

	<div class="toolbar">
		<div class="search-field">
			<Search size={15} weight="Outline" aria-hidden="true" />
			<label for="follow-up-search" class="sr-only">Search follow-ups</label>
			<Input id="follow-up-search" bind:value={query} placeholder="Search follow-ups, incidents, or owners" />
		</div>
		<div class="filter-group" role="group" aria-label="Filter follow-ups by status">
			{#each filters as item}
				<button type="button" class:active={filter === item} aria-pressed={filter === item} onclick={() => (filter = item)}>{item}</button>
			{/each}
		</div>
		<button type="button" class="reset-button" onclick={resetPreview}>Reset preview</button>
	</div>

	{#if saveNotice}<p class="save-notice" role="status" aria-live="polite">{saveNotice}</p>{/if}

	<div class="follow-up-layout">
		<section class="queue-surface" aria-labelledby="queue-title">
			<div class="surface-heading">
				<div>
					
					<h2 id="queue-title">Incident work</h2>
				</div>
				<span>{filtered.length} of {records.length}</span>
			</div>

			{#if records.length === 0}
				<div class="empty-state">
					<span class="empty-icon" aria-hidden="true"><History size={22} weight="Outline" /></span>
					<h3>No follow-ups yet</h3>
					<p>When an incident leaves work behind, it will appear here with an owner and a next step.</p>
					<a href="/workspace/incidents">Open incidents <ArrowRight size={14} weight="Outline" aria-hidden="true" /></a>
				</div>
			{:else if filtered.length === 0}
				<div class="empty-state compact">
					<span class="empty-icon" aria-hidden="true"><Search size={22} weight="Outline" /></span>
					<h3>No follow-ups match</h3>
					<p>Try a different search or status view.</p>
					<Button variant="outline" size="sm" onclick={clearFilters}>Clear filters</Button>
				</div>
			{:else}
				<div class="list-header" aria-hidden="true">
					<span>Follow-up</span><span>Owner</span><span>Due</span><span>Status</span>
				</div>
				<div class="queue-list">
					{#each filtered as followUp (followUp.id)}
						{@const StatusIcon = statusIcon(followUp.status)}
						<button type="button" class="queue-row" class:active={activeFollowUp?.id === followUp.id} aria-pressed={activeFollowUp?.id === followUp.id} onclick={() => selectFollowUp(followUp.id)}>
							<span class="status-icon {statusClass(followUp.status)}" aria-hidden="true"><StatusIcon size={16} weight="Outline" /></span>
							<span class="row-main"><strong>{followUp.title}</strong><small>{followUp.incident ? `${followUp.incident.title} · ${followUp.incident.productName}` : 'Incident unavailable'}</small></span>
							<span class="row-owner"><User size={13} weight="Outline" aria-hidden="true" />{followUp.owner}</span>
							<span class="row-due"><Calendar size={13} weight="Outline" aria-hidden="true" />{followUp.due}</span>
							<span class="row-status {statusClass(followUp.status)}">{followUp.status}</span>
							<ArrowRight class="row-arrow" size={15} weight="Outline" aria-hidden="true" />
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<aside class="detail-surface" aria-labelledby="detail-title">
			{#if activeFollowUp}
				{@const DetailStatusIcon = statusIcon(activeFollowUp.status)}
				<div class="detail-heading">
					<div class="detail-type"><span class="detail-icon {statusClass(activeFollowUp.status)}" aria-hidden="true"><DetailStatusIcon size={15} weight="Outline" /></span><span>{activeFollowUp.kind}</span></div>
					<span class="detail-state {statusClass(activeFollowUp.status)}">{activeFollowUp.status}</span>
				</div>
				<h2 id="detail-title">{activeFollowUp.title}</h2>
				<p class="detail-description">{activeFollowUp.description}</p>

				<div class="context-list">
					<div><span>Incident</span>{#if activeFollowUp.incident}<a href={activeFollowUp.incident.workspacePath}>{activeFollowUp.incident.title} <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a>{:else}<strong>Incident unavailable</strong>{/if}</div>
					<div><span>Service</span><strong>{activeFollowUp.incident?.productName ?? 'Unknown service'}</strong></div>
				</div>

				<form class="edit-form" onsubmit={saveEdits}>
					
					<div class="field">
						<Label for="follow-up-status">Status</Label>
						<Select id="follow-up-status" bind:value={editorStatus} options={[
							{ value: 'Open', label: 'Open' },
							{ value: 'In progress', label: 'In progress' },
							{ value: 'Done', label: 'Done' }
						]} />
					</div>
					<div class="field">
						<Label for="follow-up-owner">Owner</Label>
						<Select id="follow-up-owner" bind:value={editorOwner} options={ownerOptions} placeholder="Select an owner" />
					</div>
					<div class="field">
						<Label for="follow-up-due">Due</Label>
						<Input id="follow-up-due" bind:value={editorDue} placeholder="e.g. Friday or Sep 7" />
					</div>
					<Button type="submit" variant="primary" size="md">Save changes</Button>
				</form>

				<div class="detail-links">
					<a href={activeFollowUp.href} target={activeFollowUp.href.startsWith('http') ? '_blank' : undefined} rel={activeFollowUp.href.startsWith('http') ? 'noopener noreferrer' : undefined}>Open linked work <Export size={13} weight="Outline" aria-hidden="true" /></a>
				</div>
			{:else}
				<div class="detail-empty">
					<span class="empty-icon" aria-hidden="true"><History size={22} weight="Outline" /></span>
					<h2 id="detail-title">Select a follow-up</h2>
					<p>Choose an item from the queue to review its context and ownership.</p>
				</div>
			{/if}
		</aside>
	</div>
</div>

<style>
	.follow-up-page { width: min(100% - 32px, 1160px); margin: 0 auto; padding: 44px 0 72px; }
	.page-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; padding-bottom: 30px; border-bottom: 1px solid var(--pc-border-strong); }
	.kicker { margin: 0 0 8px; color: var(--pc-accent-light); font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
	h1, h2, h3, p { margin-top: 0; }
	h1 { margin-bottom: 0; font-size: clamp(30px, 4vw, 44px); font-weight: 500; letter-spacing: -.05em; line-height: 1.05; }
	.lede { max-width: 54ch; margin: 12px 0 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.6; }
	.open-summary { color: var(--pc-text-muted); font-size: 12px; white-space: nowrap; }
	.toolbar { display: flex; align-items: center; gap: 12px; padding: 20px 0 14px; }
	.search-field { display: flex; align-items: center; width: min(100%, 330px); min-height: 38px; gap: 9px; padding-inline-start: 11px; border-radius: 10px; color: var(--pc-text-faint); background: var(--pc-surface-2); }
	.search-field :global(input) { min-height: 38px; padding-inline-start: 0; border: 0; background: transparent; }
	.filter-group { display: flex; align-items: center; gap: 3px; overflow-x: auto; scrollbar-width: none; }
	.filter-group::-webkit-scrollbar { display: none; }
	.filter-group button, .reset-button { min-height: 34px; flex: 0 0 auto; padding: 0 11px; border: 0; border-radius: 999px; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 11px; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
	.filter-group button:hover, .filter-group button.active { color: var(--pc-text); background: var(--pc-surface-2); }
	.reset-button { margin-inline-start: auto; color: var(--pc-text-faint); }
	.reset-button:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.filter-group button:focus-visible, .reset-button:focus-visible, .queue-row:focus-visible, .context-list a:focus-visible, .detail-links a:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.save-notice { margin: 0 0 10px; color: var(--pc-status-operational); font-size: 11px; }
	.follow-up-layout { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(320px, .8fr); align-items: start; gap: 18px; }
	.queue-surface, .detail-surface { min-width: 0; border: 1px solid var(--pc-border-strong); border-radius: 18px; background: var(--pc-bg); }
	.surface-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; padding: 22px 22px 18px; border-bottom: 1px solid var(--pc-border-strong); }
	
	.surface-heading h2 { margin-bottom: 0; font-size: 20px; font-weight: 500; letter-spacing: -.04em; }
	.surface-heading > span { color: var(--pc-text-faint); font-size: 11px; }
	.list-header { display: grid; grid-template-columns: minmax(0, 1fr) 118px 102px 92px; gap: 12px; padding: 12px 22px 10px 60px; color: var(--pc-text-faint); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
	.list-header span:last-child { text-align: right; }
	.queue-list { border-top: 1px solid var(--pc-border-strong); }
	.queue-row { display: grid; grid-template-columns: 24px minmax(0, 1fr) 118px 102px 92px 15px; align-items: center; gap: 12px; width: 100%; min-height: 78px; padding: 14px 22px; border: 0; border-bottom: 1px solid var(--pc-border-strong); color: var(--pc-text); background: transparent; font: inherit; text-align: start; cursor: pointer; transition: background-color 120ms ease; }
	.queue-row:last-child { border-bottom: 0; }
	.queue-row:hover, .queue-row.active { background: var(--pc-surface-2); }
	.status-icon, .detail-icon { display: grid; place-items: center; border-radius: 50%; }
	.status-icon { width: 24px; height: 24px; color: var(--pc-status-outage); background: color-mix(in oklch, var(--pc-status-outage) 14%, transparent); }
	.status-icon.in-progress, .detail-icon.in-progress { color: var(--pc-status-degraded); background: color-mix(in oklch, var(--pc-status-degraded) 14%, transparent); }
	.status-icon.done, .detail-icon.done { color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 14%, transparent); }
	.row-main { display: grid; min-width: 0; gap: 4px; }
	.row-main strong { overflow: hidden; font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.row-main small { overflow: hidden; color: var(--pc-text-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
	.row-owner, .row-due { display: inline-flex; align-items: center; min-width: 0; gap: 6px; overflow: hidden; color: var(--pc-text-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
	.row-owner :global(svg), .row-due :global(svg) { flex: 0 0 auto; color: var(--pc-text-faint); }
	.row-status, .detail-state { color: var(--pc-status-outage); font-size: 11px; white-space: nowrap; }
	.row-status.in-progress, .detail-state.in-progress { color: var(--pc-status-degraded); }
	.row-status.done, .detail-state.done { color: var(--pc-status-operational); }
	.row-status { text-align: right; }
	.row-arrow { color: var(--pc-text-faint); transition: color 120ms ease, transform 120ms ease; }
	.queue-row:hover .row-arrow, .queue-row.active .row-arrow { color: var(--pc-text); transform: translateX(2px); }
	.empty-state, .detail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 310px; padding: 44px 24px; text-align: center; }
	.empty-state.compact { min-height: 260px; }
	.empty-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 50%; color: var(--pc-text-muted); background: var(--pc-surface-2); }
	.empty-state h3, .detail-empty h2 { margin: 16px 0 0; font-size: 16px; font-weight: 500; letter-spacing: -.02em; }
	.empty-state p, .detail-empty p { max-width: 38ch; margin: 8px 0 0; color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.empty-state a, .detail-links a, .context-list a { display: inline-flex; align-items: center; gap: 6px; color: var(--pc-text); font-size: 12px; text-decoration: underline; text-underline-offset: 4px; }
	.empty-state a { margin-top: 18px; }
	.detail-surface { padding: 22px; }
	.detail-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
	.detail-type { display: inline-flex; align-items: center; gap: 8px; color: var(--pc-text-muted); font-size: 11px; }
	.detail-icon { width: 26px; height: 26px; color: var(--pc-status-outage); background: color-mix(in oklch, var(--pc-status-outage) 14%, transparent); }
	.detail-state { font-weight: 500; }
	.detail-surface h2 { max-width: 28ch; margin: 18px 0 0; font-size: 22px; font-weight: 500; letter-spacing: -.045em; line-height: 1.1; }
	.detail-description { margin: 10px 0 0; color: var(--pc-text-muted); font-size: 13px; line-height: 1.6; }
	.context-list { display: grid; gap: 14px; margin-top: 24px; padding: 16px 0; border-top: 1px solid var(--pc-border-strong); border-bottom: 1px solid var(--pc-border-strong); }
	.context-list div { display: grid; grid-template-columns: 72px minmax(0, 1fr); align-items: start; gap: 12px; font-size: 12px; }
	.context-list div > span { color: var(--pc-text-faint); }
	.context-list strong { min-width: 0; overflow: hidden; color: var(--pc-text); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.context-list a { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.edit-form { display: grid; gap: 14px; margin-top: 24px; }
	
	.field { display: grid; gap: 7px; }
	.edit-form :global(.pc-select-trigger) { min-height: 40px; }
	.edit-form :global(input) { min-height: 40px; }
	.edit-form :global(button[type="submit"]) { width: 100%; margin-top: 2px; }
	.detail-links { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--pc-border-strong); }
	@media (max-width: 980px) { .follow-up-layout { grid-template-columns: minmax(0, 1fr); } .detail-surface { order: -1; } }
	@media (max-width: 720px) { .follow-up-page { width: min(100% - 24px, 1160px); padding-top: 28px; } .page-header { align-items: start; flex-direction: column; gap: 14px; } .toolbar { align-items: stretch; flex-wrap: wrap; } .search-field { width: 100%; } .filter-group { order: 3; width: 100%; } .reset-button { margin-inline-start: auto; } .list-header { display: none; } .queue-row { grid-template-columns: 24px minmax(0, 1fr) auto; align-items: start; min-height: 82px; padding: 15px; } .row-owner, .row-due { grid-column: 2; } .row-owner { margin-top: 4px; } .row-due { grid-column: 3; grid-row: 2; justify-self: end; } .row-status { grid-column: 2; grid-row: 3; margin-top: 3px; text-align: start; } .row-arrow { grid-column: 3; grid-row: 1; } }
	@media (prefers-reduced-motion: reduce) { .filter-group button, .reset-button, .queue-row, .row-arrow { transition: none; } }
</style>
