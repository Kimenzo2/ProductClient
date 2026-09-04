<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { AlertTriangle, ArrowRight, Calendar, CheckCircle, Clock, Export, History, Search, User } from 'reicon-svelte';
	import { Button, Input, Label, Select } from '$lib/components/ui';
	import { hydratePostIncidentFlow, postIncidentFlowPreview, resetPostIncidentFlow, updatePostIncidentTask } from '$lib/data/postIncidentFlow.svelte';
	import { incidents, type IncidentRecord, type PostIncidentTask } from '$lib/data/workspace';

	type FlowFilter = 'Everything' | PostIncidentTask['status'];
	type EnrichedTask = PostIncidentTask & { incident?: IncidentRecord };

	const filters: FlowFilter[] = ['Everything', 'Open', 'In progress', 'Done'];

	let query = $state('');
	let filter = $state<FlowFilter>('Everything');
	let selectedId = $state('');
	let editorStatus = $state<PostIncidentTask['status']>('Open');
	let editorOwner = $state('');
	let editorDue = $state('');
	let saveNotice = $state('');

	let tasks = $derived<EnrichedTask[]>(postIncidentFlowPreview.tasks.map((task) => ({
		...task,
		incident: incidents.find((incident) => incident.id === task.incidentId)
	})));
	let openCount = $derived(tasks.filter((task) => task.status !== 'Done').length);
	let completedCount = $derived(tasks.filter((task) => task.status === 'Done').length);
	let normalizedQuery = $derived(query.trim().toLowerCase());
	let filtered = $derived(
		tasks.filter((task) => {
			const matchesStatus = filter === 'Everything' || task.status === filter;
			const haystack = [
				task.title,
				task.description,
				task.owner,
				task.kind,
				task.incident?.title ?? '',
				task.incident?.productName ?? ''
			].join(' ').toLowerCase();
			return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
		})
	);
	let activeTask = $derived(filtered.find((task) => task.id === selectedId) ?? filtered[0] ?? null);
	let ownerOptions = $derived(
		[...new Set(['Unassigned', ...tasks.map((task) => task.owner).filter(Boolean)])]
			.sort((a, b) => a.localeCompare(b))
			.map((owner) => ({ value: owner, label: owner }))
	);

	onMount(() => {
		hydratePostIncidentFlow();
		const requestedId = page.url.searchParams.get('selected');
		selectedId = tasks.some((task) => task.id === requestedId) ? requestedId ?? '' : tasks[0]?.id ?? '';
	});

	$effect(() => {
		const current = activeTask;
		if (!current) return;
		editorStatus = current.status;
		editorOwner = current.owner;
		editorDue = current.due;
	});

	function statusIcon(status: PostIncidentTask['status']) {
		return status === 'Done' ? CheckCircle : status === 'In progress' ? Clock : AlertTriangle;
	}

	function statusClass(status: PostIncidentTask['status']) {
		return status === 'Done' ? 'done' : status === 'In progress' ? 'in-progress' : 'open';
	}

	function selectTask(id: string) {
		selectedId = id;
		saveNotice = '';
		void goto(`/workspace/incidents/post-incident-flow?selected=${encodeURIComponent(id)}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function clearFilters() {
		query = '';
		filter = 'Everything';
	}

	function saveEdits(event: SubmitEvent) {
		event.preventDefault();
		if (!activeTask) return;

		updatePostIncidentTask(activeTask.id, {
			status: editorStatus,
			owner: editorOwner.trim() || 'Unassigned',
			due: editorDue.trim() || 'No due date'
		});
		saveNotice = 'Saved to this preview';
	}

	function resetPreview() {
		resetPostIncidentFlow();
		saveNotice = 'Preview reset to the sample flow';
	}
</script>

<svelte:head>
	<title>Post-incident flow | Product Client</title>
	<meta name="description" content="Move resolved incidents through a clear post-incident review flow." />
</svelte:head>

<div class="flow-page">
	<header class="page-header">
		<div>
			
			<h1>Post-incident flow</h1>
			<p class="lede">Close the loop after resolution with a clear review path, accountable owners, and the next decision.</p>
		</div>
		<div class="flow-summary" aria-label="Post-incident flow summary">
			<span><strong>{openCount}</strong> open</span>
			<span><strong>{completedCount}</strong> complete</span>
		</div>
	</header>

	<div class="toolbar">
		<div class="search-field">
			<Search size={15} weight="Outline" aria-hidden="true" />
			<label for="post-incident-search" class="sr-only">Search post-incident tasks</label>
			<Input id="post-incident-search" bind:value={query} placeholder="Search tasks, incidents, or owners" />
		</div>
		<div class="filter-group" role="group" aria-label="Filter post-incident tasks by status">
			{#each filters as item}
				<button type="button" class:active={filter === item} aria-pressed={filter === item} onclick={() => (filter = item)}>{item}</button>
			{/each}
		</div>
		<button type="button" class="reset-button" onclick={resetPreview}>Reset preview</button>
	</div>

	{#if saveNotice}<p class="save-notice" role="status" aria-live="polite">{saveNotice}</p>{/if}

	<div class="flow-layout">
		<section class="queue-surface" aria-labelledby="flow-queue-title">
			<div class="surface-heading">
				<div>
					
					<h2 id="flow-queue-title">Post-incident tasks</h2>
				</div>
				<span>{filtered.length} of {tasks.length}</span>
			</div>

			{#if tasks.length === 0}
				<div class="empty-state">
					<span class="empty-icon" aria-hidden="true"><History size={22} weight="Outline" /></span>
					<h3>No post-incident flow yet</h3>
					<p>When an incident is resolved, its review steps will appear here for the team to own and complete.</p>
					<a href="/workspace/incidents">Open incidents <ArrowRight size={14} weight="Outline" aria-hidden="true" /></a>
				</div>
			{:else if filtered.length === 0}
				<div class="empty-state compact">
					<span class="empty-icon" aria-hidden="true"><Search size={22} weight="Outline" /></span>
					<h3>No post-incident tasks match</h3>
					<p>Try a different search or status view.</p>
					<Button variant="outline" size="sm" onclick={clearFilters}>Clear filters</Button>
				</div>
			{:else}
				<div class="list-header" aria-hidden="true">
					<span>Task</span><span>Owner</span><span>Due</span><span>Status</span>
				</div>
				<div class="queue-list">
					{#each filtered as task (task.id)}
						{@const StatusIcon = statusIcon(task.status)}
						<button type="button" class="queue-row" class:active={activeTask?.id === task.id} aria-pressed={activeTask?.id === task.id} onclick={() => selectTask(task.id)}>
							<span class="status-icon {statusClass(task.status)}" aria-hidden="true"><StatusIcon size={16} weight="Outline" /></span>
							<span class="row-main"><strong>{task.title}</strong><small>{task.incident ? `${task.incident.title} · ${task.incident.productName}` : 'Incident unavailable'}</small></span>
							<span class="row-owner"><User size={13} weight="Outline" aria-hidden="true" />{task.owner}</span>
							<span class="row-due"><Calendar size={13} weight="Outline" aria-hidden="true" />{task.due}</span>
							<span class="row-status {statusClass(task.status)}">{task.status}</span>
							<ArrowRight class="row-arrow" size={15} weight="Outline" aria-hidden="true" />
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<aside class="detail-surface" aria-labelledby="task-detail-title">
			{#if activeTask}
				{@const DetailStatusIcon = statusIcon(activeTask.status)}
				<div class="detail-heading">
					<div class="detail-type"><span class="detail-icon {statusClass(activeTask.status)}" aria-hidden="true"><DetailStatusIcon size={15} weight="Outline" /></span><span>{activeTask.kind}</span></div>
					<span class="detail-state {statusClass(activeTask.status)}">{activeTask.status}</span>
				</div>
				<h2 id="task-detail-title">{activeTask.title}</h2>
				<p class="detail-description">{activeTask.description}</p>

				<div class="context-list">
					<div><span>Incident</span>{#if activeTask.incident}<a href={activeTask.incident.workspacePath}>{activeTask.incident.title} <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a>{:else}<strong>Incident unavailable</strong>{/if}</div>
					<div><span>Service</span><strong>{activeTask.incident?.productName ?? 'Unknown service'}</strong></div>
				</div>

				<form class="edit-form" onsubmit={saveEdits}>
					
					<div class="field">
						<Label for="post-incident-status">Status</Label>
						<Select id="post-incident-status" bind:value={editorStatus} options={[
							{ value: 'Open', label: 'Open' },
							{ value: 'In progress', label: 'In progress' },
							{ value: 'Done', label: 'Done' }
						]} />
					</div>
					<div class="field">
						<Label for="post-incident-owner">Owner</Label>
						<Select id="post-incident-owner" bind:value={editorOwner} options={ownerOptions} placeholder="Select an owner" />
					</div>
					<div class="field">
						<Label for="post-incident-due">Due</Label>
						<Input id="post-incident-due" bind:value={editorDue} placeholder="e.g. Friday or Sep 7" />
					</div>
					<Button type="submit" variant="primary" size="md">Save changes</Button>
				</form>

				<div class="detail-links">
					<a href="/workspace/incidents/follow-ups?selected=follow-up-1">Open follow-up queue <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a>
					{#if activeTask.href}<a href={activeTask.href} target={activeTask.href.startsWith('http') ? '_blank' : undefined} rel={activeTask.href.startsWith('http') ? 'noopener noreferrer' : undefined}>Open linked work <Export size={13} weight="Outline" aria-hidden="true" /></a>{/if}
				</div>
			{:else}
				<div class="detail-empty">
					<span class="empty-icon" aria-hidden="true"><History size={22} weight="Outline" /></span>
					<h2 id="task-detail-title">Select a task</h2>
					<p>Choose a review step from the queue to see its incident context and ownership.</p>
				</div>
			{/if}
		</aside>
	</div>
</div>

<style>
	.flow-page { width: min(100% - 32px, 1160px); margin: 0 auto; padding: 44px 0 72px; }
	.page-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; padding-bottom: 30px; border-bottom: 1px solid var(--pc-border-strong); }
	.kicker { margin: 0 0 8px; color: var(--pc-accent-light); font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
	h1, h2, h3, p { margin-top: 0; }
	h1 { margin-bottom: 0; font-size: clamp(30px, 4vw, 44px); font-weight: 500; letter-spacing: -.05em; line-height: 1.05; }
	.lede { max-width: 58ch; margin: 12px 0 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.6; }
	.flow-summary { display: flex; align-items: center; gap: 16px; color: var(--pc-text-muted); font-size: 12px; white-space: nowrap; }
	.flow-summary span + span { padding-left: 16px; border-left: 1px solid var(--pc-border-strong); }
	.flow-summary strong { margin-right: 4px; color: var(--pc-text); font-size: 18px; font-weight: 500; letter-spacing: -.04em; }
	.toolbar { display: flex; align-items: center; gap: 12px; padding: 20px 0 14px; }
	.search-field { display: flex; align-items: center; width: min(100%, 330px); min-height: 38px; gap: 9px; padding-left: 11px; border-radius: 10px; color: var(--pc-text-faint); background: var(--pc-surface-2); }
	.search-field :global(input) { min-height: 38px; padding-left: 0; border: 0; background: transparent; }
	.filter-group { display: flex; align-items: center; gap: 3px; overflow-x: auto; scrollbar-width: none; }
	.filter-group::-webkit-scrollbar { display: none; }
	.filter-group button, .reset-button { min-height: 34px; flex: 0 0 auto; padding: 0 11px; border: 0; border-radius: 999px; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 11px; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
	.filter-group button:hover, .filter-group button.active, .reset-button:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.reset-button { margin-left: auto; color: var(--pc-text-faint); }
	.filter-group button:focus-visible, .reset-button:focus-visible, .queue-row:focus-visible, .context-list a:focus-visible, .detail-links a:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.save-notice { margin: 0 0 10px; color: var(--pc-status-operational); font-size: 11px; }
	.flow-layout { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(320px, .8fr); align-items: start; gap: 18px; }
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
	.edit-form :global(.pc-select-trigger), .edit-form :global(input) { min-height: 40px; }
	.edit-form :global(button[type="submit"]) { width: 100%; margin-top: 2px; }
	.detail-links { display: grid; gap: 12px; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--pc-border-strong); }
	@media (max-width: 980px) { .flow-layout { grid-template-columns: minmax(0, 1fr); } .detail-surface { order: -1; } }
	@media (max-width: 720px) { .flow-page { width: min(100% - 24px, 1160px); padding-top: 28px; } .page-header { align-items: start; flex-direction: column; gap: 14px; } .toolbar { align-items: stretch; flex-wrap: wrap; } .search-field { width: 100%; } .filter-group { order: 3; width: 100%; } .reset-button { margin-left: auto; } .list-header { display: none; } .queue-row { grid-template-columns: 24px minmax(0, 1fr) auto; align-items: start; min-height: 82px; padding: 15px; } .row-owner, .row-due { grid-column: 2; } .row-owner { margin-top: 4px; } .row-due { grid-column: 3; grid-row: 2; justify-self: end; } .row-status { grid-column: 2; grid-row: 3; margin-top: 3px; text-align: start; } .row-arrow { grid-column: 3; grid-row: 1; } }
	@media (prefers-reduced-motion: reduce) { .filter-group button, .reset-button, .queue-row, .row-arrow { transition: none; } }
</style>
