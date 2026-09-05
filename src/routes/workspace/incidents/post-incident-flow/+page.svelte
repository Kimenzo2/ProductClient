<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, CloseCircle, Export, History, Search, User } from 'reicon-svelte';
	import { Button, Input, Label, Select } from '$lib/components/ui';
	import { hydratePostIncidentFlow, postIncidentFlowPreview, resetPostIncidentFlow, updatePostIncidentTask } from '$lib/data/postIncidentFlow.svelte';
	import { incidents, type IncidentRecord, type PostIncidentTask } from '$lib/data/workspace';

	type FlowPhase = PostIncidentTask['phase'];
	type FlowFilter = 'All flows' | 'Needs action' | 'Complete';
	type FlowIncident = IncidentRecord & {
		tasks: PostIncidentTask[];
		completeCount: number;
		currentPhase: FlowPhase | 'Complete';
		flowStatus: 'In progress' | 'Complete';
	};

	const phases: FlowPhase[] = ['Documenting', 'Reviewing'];
	const filters: FlowFilter[] = ['All flows', 'Needs action', 'Complete'];

	let query = $state('');
	let filter = $state<FlowFilter>('All flows');
	let selectedId = $state('');
	let editingTaskId = $state('');
	let editorStatus = $state<PostIncidentTask['status']>('Open');
	let editorOwner = $state('');
	let editorDue = $state('');
	let saveNotice = $state('');
	let editorPanel = $state<HTMLElement | null>(null);
	let editorTrigger = $state<HTMLElement | null>(null);

	function isClosed(task: PostIncidentTask) {
		return task.status === 'Done' || task.status === 'Not doing';
	}

	function getCurrentPhase(tasks: PostIncidentTask[]): FlowPhase | 'Complete' {
		const phase = phases.find((name) => tasks.some((task) => task.phase === name && !isClosed(task)));
		return phase ?? 'Complete';
	}

	let tasks = $derived(postIncidentFlowPreview.tasks);
	let flowIncidents = $derived<FlowIncident[]>(
		incidents
			.map((incident) => {
				const incidentTasks = tasks.filter((task) => task.incidentId === incident.id);
				const completeCount = incidentTasks.filter(isClosed).length;
				return {
					...incident,
					tasks: incidentTasks,
					completeCount,
					currentPhase: getCurrentPhase(incidentTasks),
					flowStatus: completeCount === incidentTasks.length ? ('Complete' as const) : ('In progress' as const)
				};
			})
			.filter((incident) => incident.tasks.length > 0)
	);
	let openFlowCount = $derived(flowIncidents.filter((flow) => flow.flowStatus !== 'Complete').length);
	let completeFlowCount = $derived(flowIncidents.filter((flow) => flow.flowStatus === 'Complete').length);
	let normalizedQuery = $derived(query.trim().toLowerCase());
	let filteredFlows = $derived(
		flowIncidents.filter((flow) => {
			const matchesFilter = filter === 'All flows' || (filter === 'Complete' ? flow.flowStatus === 'Complete' : flow.flowStatus !== 'Complete');
			const haystack = [flow.title, flow.productName, flow.owner, flow.severity, ...flow.tasks.flatMap((task) => [task.title, task.description, task.owner, task.kind])].join(' ').toLowerCase();
			return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
		})
	);
	let activeFlow = $derived(selectedId ? filteredFlows.find((flow) => flow.id === selectedId) ?? null : null);
	let activeTasks = $derived(activeFlow?.tasks ?? []);
	let activePhase = $derived<FlowPhase | 'Complete'>(activeFlow ? activeFlow.currentPhase : 'Complete');
	let editingTask = $derived(activeTasks.find((task) => task.id === editingTaskId) ?? null);
	let ownerOptions = $derived(
		[...new Set(['Unassigned', ...tasks.map((task) => task.owner).filter(Boolean)])]
			.sort((a, b) => a.localeCompare(b))
			.map((owner) => ({ value: owner, label: owner }))
	);

	onMount(() => {
		hydratePostIncidentFlow();
		const requestedId = page.url.searchParams.get('selected');
		selectedId = flowIncidents.some((flow) => flow.id === requestedId) ? requestedId ?? '' : '';

		const handleEditorKeydown = (event: KeyboardEvent) => {
			if (!editingTask) return;
			if (event.key === 'Escape') {
				event.preventDefault();
				closeEditor();
				return;
			}
			if (event.key !== 'Tab' || !editorPanel) return;
			const focusable = Array.from(editorPanel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		window.addEventListener('keydown', handleEditorKeydown);
		return () => window.removeEventListener('keydown', handleEditorKeydown);
	});

	$effect(() => {
		const current = editingTask;
		if (!current) return;
		editorStatus = current.status;
		editorOwner = current.owner;
		editorDue = current.due;
	});

	$effect(() => {
		if (editingTaskId && !activeTasks.some((task) => task.id === editingTaskId)) editingTaskId = '';
	});

	function statusIcon(status: PostIncidentTask['status']) {
		return status === 'Done' ? CheckCircle : Clock;
	}

	function statusClass(status: PostIncidentTask['status']) {
		return status === 'Done' ? 'done' : status === 'Not doing' ? 'not-doing' : 'open';
	}

	function phaseStatus(phase: FlowPhase) {
		if (!activeFlow) return 'upcoming';
		const phaseTasks = activeTasks.filter((task) => task.phase === phase);
		if (phaseTasks.length > 0 && phaseTasks.every(isClosed)) return 'complete';
		return activePhase === phase ? 'current' : 'upcoming';
	}

	function selectFlow(id: string) {
		selectedId = id;
		editingTaskId = '';
		saveNotice = '';
		void goto(`/workspace/incidents/post-incident-flow?selected=${encodeURIComponent(id)}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function closeEditor() {
		editingTaskId = '';
		requestAnimationFrame(() => editorTrigger?.focus());
	}

	function backToQueue(event: MouseEvent) {
		event.preventDefault();
		selectedId = '';
		editingTaskId = '';
		void goto('/workspace/incidents/post-incident-flow', { replaceState: true, keepFocus: true, noScroll: true });
	}

	function clearFilters() {
		query = '';
		filter = 'All flows';
	}

	function setTaskStatus(task: PostIncidentTask, status: PostIncidentTask['status']) {
		updatePostIncidentTask(task.id, { status });
		saveNotice = status === 'Done' ? 'Task marked complete' : status === 'Not doing' ? 'Task marked not doing' : 'Task reopened';
	}

	function startEditing(task: PostIncidentTask) {
		editorTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		editingTaskId = task.id;
		editorStatus = task.status;
		editorOwner = task.owner;
		editorDue = task.due;
		saveNotice = '';
		requestAnimationFrame(() => editorPanel?.querySelector<HTMLElement>('button, input, select')?.focus());
	}

	function saveTaskEdits(event: SubmitEvent) {
		event.preventDefault();
		if (!editingTask) return;
		updatePostIncidentTask(editingTask.id, {
			status: editorStatus,
			owner: editorOwner.trim() || 'Unassigned',
			due: editorDue.trim() || 'No due date'
		});
		saveNotice = 'Saved to this preview';
	}

	function destinationLabel(task: PostIncidentTask) {
		if (task.href?.startsWith('http')) return 'Open hosted Status Page';
		if (task.kind === 'Follow-ups') return 'Open follow-ups';
		return 'Open incident';
	}
</script>

<svelte:head>
	<title>Post-incident flow | Product Client</title>
	<meta name="description" content="Move resolved incidents through a clear post-incident review flow." />
</svelte:head>

<div class="flow-page" inert={editingTask ? true : undefined}>
	<header class="page-header">
		<div>
			<p class="kicker">Response</p>
			<h1>Post-incident flow</h1>
			<p class="lede">Move resolved incidents through the review work that closes the loop before they leave the response record.</p>
		</div>
		<div class="flow-summary" aria-label="Post-incident flow summary"><span><strong>{openFlowCount}</strong> active</span><span><strong>{completeFlowCount}</strong> complete</span></div>
	</header>

	<div class={activeFlow ? 'toolbar is-hidden' : 'toolbar'}>
		<div class="search-field">
			<Search size={15} weight="Outline" aria-hidden="true" />
			<label for="post-incident-search" class="sr-only">Search post-incident flows</label>
			<Input id="post-incident-search" bind:value={query} placeholder="Search incidents or review tasks" />
		</div>
		<div class="filter-group" role="group" aria-label="Filter post-incident flows">
			{#each filters as item}<button type="button" class:active={filter === item} aria-pressed={filter === item} onclick={() => (filter = item)}>{item}</button>{/each}
		</div>
		<button type="button" class="reset-button" onclick={() => { resetPostIncidentFlow(); saveNotice = 'Preview reset to the sample flow'; }}>Reset preview</button>
	</div>

	{#if saveNotice}<p class="save-notice" role="status" aria-live="polite">{saveNotice}</p>{/if}
	{#if activeFlow}<a class="back-button" href="/workspace/incidents/post-incident-flow" onclick={backToQueue}><ArrowLeft size={14} weight="Outline" aria-hidden="true" />Back to review queue</a>{/if}

	<div class={activeFlow ? 'flow-layout detail-mode' : 'flow-layout'}>
		<section class="flow-list-surface {activeFlow ? 'is-hidden' : ''}" aria-labelledby="flow-list-title">
			<div class="surface-heading"><div><p class="kicker">Review queue</p><h2 id="flow-list-title">Incidents in flow</h2></div><span>{filteredFlows.length} of {flowIncidents.length}</span></div>
			{#if flowIncidents.length === 0}
				<div class="empty-state"><span class="empty-icon" aria-hidden="true"><History size={22} weight="Outline" /></span><h3>No post-incident flow yet</h3><p>When a resolved incident enters review, its completion path will appear here.</p><a href="/workspace/incidents">Open incidents <ArrowRight size={14} weight="Outline" aria-hidden="true" /></a></div>
			{:else if filteredFlows.length === 0}
				<div class="empty-state compact"><span class="empty-icon" aria-hidden="true"><Search size={22} weight="Outline" /></span><h3>No flows match</h3><p>Try a different search or view.</p><Button variant="outline" size="sm" onclick={clearFilters}>Clear filters</Button></div>
			{:else}
				<div class="flow-list">
					{#each filteredFlows as flow (flow.id)}
						<button type="button" class="flow-row" class:active={activeFlow?.id === flow.id} aria-pressed={activeFlow?.id === flow.id} onclick={() => selectFlow(flow.id)}>
							<span class="flow-row-icon {flow.flowStatus === 'Complete' ? 'complete' : 'active'}" aria-hidden="true"><History size={17} weight="Outline" /></span>
							<span class="flow-row-copy"><span class="flow-context">{flow.productName} · {flow.severity}</span><strong>{flow.title}</strong><small>{flow.currentPhase === 'Complete' ? 'Complete' : `${flow.currentPhase} · ${flow.completeCount} of ${flow.tasks.length} tasks complete`}</small></span>
							<span class="flow-row-meta"><span>{flow.flowStatus}</span><ArrowRight size={15} weight="Outline" aria-hidden="true" /></span>
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<aside class="flow-detail-surface {activeFlow ? '' : 'is-hidden'}" aria-labelledby="flow-detail-title">
			{#if activeFlow}
				<div class="detail-heading"><div><p class="kicker">{activeFlow.currentPhase === 'Complete' ? 'Complete' : activeFlow.currentPhase}</p><span class="detail-status {activeFlow.flowStatus === 'Complete' ? 'complete' : 'active'}">{activeFlow.flowStatus}</span></div><span class="detail-count">{activeFlow.completeCount} of {activeFlow.tasks.length}</span></div>
				<h2 id="flow-detail-title">{activeFlow.title}</h2>
				<p class="detail-description">{activeFlow.summary}</p>

				<div class="incident-context"><div><span>Service</span><strong>{activeFlow.productName}</strong></div><div><span>Owner</span><strong>{activeFlow.owner}</strong></div><div><span>Started</span><strong>{activeFlow.startedAt}</strong></div><a href={activeFlow.workspacePath}>Open incident <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a></div>

				<ol class="phase-track" aria-label="Post-incident phases">
					{#each phases as phase, index}
						{@const state = phaseStatus(phase)}
						<li class={state}><span class="phase-marker" aria-hidden="true">{state === 'complete' ? '✓' : index + 1}</span><span><strong>{phase}</strong><small>{state === 'complete' ? 'Complete' : state === 'current' ? 'Current phase' : 'Up next'}</small></span></li>
					{/each}
				</ol>

				<section class="task-section" aria-labelledby="task-list-title"><div class="task-heading"><div><p class="kicker">{activePhase === 'Complete' ? 'Review record' : activePhase}</p><h3 id="task-list-title">Flow tasks</h3></div><span>{activeTasks.filter(isClosed).length} complete</span></div>
					<div class="task-list">
						{#each activeTasks as task (task.id)}
							{@const TaskIcon = statusIcon(task.status)}
							<article class="task-row" class:closed={isClosed(task)}>
								<button type="button" class="task-state {statusClass(task.status)}" aria-label={task.status === 'Done' ? `Reopen ${task.title}` : `Mark ${task.title} complete`} aria-pressed={task.status === 'Done'} onclick={() => setTaskStatus(task, task.status === 'Done' ? 'Open' : 'Done')}><TaskIcon size={16} weight="Outline" aria-hidden="true" /></button>
								<div class="task-copy"><div class="task-title-row"><strong>{task.title}</strong><span class="task-status {statusClass(task.status)}">{task.status}</span></div><p>{task.description}</p><div class="task-meta"><span><User size={13} weight="Outline" aria-hidden="true" />{task.owner}</span><span><Calendar size={13} weight="Outline" aria-hidden="true" />{task.due}</span></div><div class="task-actions"><button type="button" class="quiet-action" onclick={() => startEditing(task)}>Edit task</button>{#if task.href}<a href={task.href} target={task.href.startsWith('http') ? '_blank' : undefined} rel={task.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{destinationLabel(task)} <Export size={12} weight="Outline" aria-hidden="true" /></a>{/if}{#if task.status === 'Open'}<button type="button" class="quiet-action" onclick={() => setTaskStatus(task, 'Not doing')}>Not doing</button>{:else if task.status === 'Not doing'}<button type="button" class="quiet-action" onclick={() => setTaskStatus(task, 'Open')}>Reopen</button>{/if}</div></div>
							</article>
						{/each}
					</div>
				</section>

				<div class="detail-links"><a href="/workspace/incidents/follow-ups">Open follow-up queue <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a></div>
			{:else}
				<div class="detail-empty"><span class="empty-icon" aria-hidden="true"><History size={22} weight="Outline" /></span><h2 id="flow-detail-title">Select an incident</h2><p>Choose a flow from the queue to review its phase and completion work.</p></div>
			{/if}
		</aside>
	</div>
</div>

{#if editingTask}
	<button type="button" class="editor-backdrop" aria-label="Close task editor" onclick={closeEditor}></button>
	<div class="task-editor" bind:this={editorPanel} role="dialog" aria-modal="true" aria-labelledby="task-editor-title" aria-describedby="post-task-help">
		<div class="editor-header">
			<div>
				<p class="kicker">Task ownership</p>
				<h3 id="task-editor-title">Edit task</h3>
			</div>
			<button type="button" class="editor-close" aria-label="Close task editor" onclick={closeEditor}><CloseCircle size={18} weight="Outline" aria-hidden="true" /></button>
		</div>
		<p class="editor-task-name">{editingTask.title}</p>
		<p id="post-task-help" class="editor-help">Keep the owner, status, and due date current so this review can move forward.</p>
		<form onsubmit={saveTaskEdits}>
			<div class="field"><Label for="post-task-status">Status</Label><Select id="post-task-status" bind:value={editorStatus} options={[{ value: 'Open', label: 'Open' }, { value: 'Done', label: 'Done' }, { value: 'Not doing', label: 'Not doing' }]} /></div>
			<div class="field"><Label for="post-task-owner">Owner</Label><Select id="post-task-owner" bind:value={editorOwner} options={ownerOptions} placeholder="Select an owner" /></div>
			<div class="field"><Label for="post-task-due">Due</Label><Input id="post-task-due" bind:value={editorDue} placeholder="e.g. Friday or Sep 7" /></div>
			<div class="editor-actions"><Button type="submit" variant="primary" size="md">Save changes</Button><button type="button" class="quiet-action" onclick={closeEditor}>Cancel</button></div>
		</form>
	</div>
{/if}

<style>
	.flow-page { width: min(100% - 32px, 1160px); margin: 0 auto; padding: 44px 0 72px; }
	.page-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; padding-bottom: 30px; border-bottom: 1px solid var(--pc-border-strong); }
	.kicker { margin: 0 0 8px; color: var(--pc-text-faint); font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
	h1, h2, h3, p { margin-top: 0; }
	h1 { margin-bottom: 0; font-size: clamp(30px, 4vw, 44px); font-weight: 500; letter-spacing: -.05em; line-height: 1.05; }
	.lede { max-width: 62ch; margin: 12px 0 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.6; }
	.flow-summary { display: flex; align-items: center; gap: 16px; color: var(--pc-text-muted); font-size: 12px; white-space: nowrap; }
	.flow-summary span + span { padding-inline-start: 16px; border-inline-start: 1px solid var(--pc-border-strong); }
	.flow-summary strong { margin-inline-end: 4px; color: var(--pc-text); font-size: 18px; font-weight: 500; letter-spacing: -.04em; }
	.toolbar { display: flex; align-items: center; gap: 12px; padding: 20px 0 14px; }
	.search-field { display: flex; align-items: center; width: min(100%, 330px); min-height: 38px; gap: 9px; padding-inline-start: 11px; border-radius: 10px; color: var(--pc-text-faint); background: var(--pc-surface-2); }
	.search-field :global(input) { min-height: 38px; padding-inline-start: 0; border: 0; background: transparent; }
	.filter-group { display: flex; align-items: center; gap: 3px; overflow-x: auto; scrollbar-width: none; }
	.filter-group::-webkit-scrollbar { display: none; }
	.toolbar.is-hidden, .flow-list-surface.is-hidden, .flow-detail-surface.is-hidden { display: none; }
	.filter-group button, .reset-button { min-height: 34px; flex: 0 0 auto; padding: 0 11px; border: 0; border-radius: 999px; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 11px; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
	.filter-group button:hover, .filter-group button.active, .reset-button:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.reset-button { margin-inline-start: auto; color: var(--pc-text-faint); }
	.filter-group button:focus-visible, .reset-button:focus-visible, .flow-row:focus-visible, .task-state:focus-visible, .quiet-action:focus-visible, .task-actions a:focus-visible, .incident-context a:focus-visible, .detail-links a:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.save-notice { margin: 0 0 10px; color: var(--pc-status-operational); font-size: 11px; }
	.back-button { display: inline-flex; align-items: center; gap: 7px; margin: 22px 0 14px; color: var(--pc-text-muted); font-size: 12px; text-decoration: none; }
	.back-button:hover { color: var(--pc-text); }
	.back-button:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.flow-layout { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(420px, .95fr); align-items: start; gap: 18px; }
	.flow-layout.detail-mode { grid-template-columns: minmax(0, 1fr); }
	.flow-list-surface, .flow-detail-surface { min-width: 0; border: 1px solid var(--pc-border-strong); border-radius: 18px; background: var(--pc-bg); }
	.surface-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; padding: 22px 22px 18px; border-bottom: 1px solid var(--pc-border-strong); }
	.surface-heading .kicker { margin-bottom: 6px; }
	.surface-heading h2 { margin-bottom: 0; font-size: 20px; font-weight: 500; letter-spacing: -.04em; }
	.surface-heading > span, .task-heading > span { color: var(--pc-text-faint); font-size: 11px; }
	.flow-list { border-top: 1px solid var(--pc-border-strong); }
	.flow-row { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; align-items: center; gap: 14px; width: 100%; min-height: 102px; padding: 18px 22px; border: 0; border-bottom: 1px solid var(--pc-border-strong); color: var(--pc-text); background: transparent; font: inherit; text-align: start; cursor: pointer; transition: background-color 120ms ease; }
	.flow-row:last-child { border-bottom: 0; }
	.flow-row:hover, .flow-row.active { background: var(--pc-surface-2); }
	.flow-row-icon, .empty-icon, .phase-marker, .task-state { display: grid; place-items: center; border-radius: 50%; }
	.flow-row-icon { width: 32px; height: 32px; color: var(--pc-status-degraded); background: color-mix(in oklch, var(--pc-status-degraded) 14%, transparent); }
	.flow-row-icon.complete { color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 14%, transparent); }
	.flow-row-copy { display: grid; min-width: 0; gap: 5px; }
	.flow-context { color: var(--pc-text-muted); font-size: 11px; }
	.flow-row-copy strong { overflow: hidden; font-size: 15px; font-weight: 500; letter-spacing: -.02em; text-overflow: ellipsis; white-space: nowrap; }
	.flow-row-copy small { overflow: hidden; color: var(--pc-text-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
	.flow-row-meta { display: inline-flex; align-items: center; gap: 12px; color: var(--pc-text-faint); font-size: 11px; white-space: nowrap; }
	.flow-row:hover .flow-row-meta, .flow-row.active .flow-row-meta { color: var(--pc-text); }
	.empty-state, .detail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 310px; padding: 44px 24px; text-align: center; }
	.empty-state.compact { min-height: 260px; }
	.empty-icon { width: 44px; height: 44px; color: var(--pc-text-muted); background: var(--pc-surface-2); }
	.empty-state h3, .detail-empty h2 { margin: 16px 0 0; font-size: 16px; font-weight: 500; letter-spacing: -.02em; }
	.empty-state p, .detail-empty p { max-width: 38ch; margin: 8px 0 0; color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.empty-state a, .task-actions a, .incident-context a, .detail-links a { display: inline-flex; align-items: center; gap: 6px; color: var(--pc-text); font-size: 12px; text-decoration: underline; text-underline-offset: 4px; }
	.empty-state a { margin-top: 18px; }
	.flow-detail-surface { padding: 22px; }
	.detail-heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
	.detail-heading .kicker { margin-bottom: 5px; }
	.detail-status { color: var(--pc-status-degraded); font-size: 11px; font-weight: 500; }
	.detail-status.complete { color: var(--pc-status-operational); }
	.detail-count { color: var(--pc-text-faint); font-size: 11px; }
	.flow-detail-surface > h2 { max-width: 30ch; margin: 15px 0 0; font-size: 24px; font-weight: 500; letter-spacing: -.045em; line-height: 1.1; }
	.detail-description { max-width: 58ch; margin: 10px 0 0; color: var(--pc-text-muted); font-size: 13px; line-height: 1.6; }
	.incident-context { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; align-items: end; gap: 14px; margin-top: 24px; padding: 16px 0; border-top: 1px solid var(--pc-border-strong); border-bottom: 1px solid var(--pc-border-strong); }
	.incident-context div { display: grid; gap: 5px; min-width: 0; }
	.incident-context div > span { color: var(--pc-text-faint); font-size: 10px; }
	.incident-context strong { overflow: hidden; font-size: 12px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.incident-context a { justify-self: end; white-space: nowrap; }
	.phase-track { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 0; margin: 22px 0 0; list-style: none; }
	.phase-track li { display: flex; align-items: center; gap: 9px; min-width: 0; color: var(--pc-text-faint); }
	.phase-track li + li { padding-inline-start: 10px; border-inline-start: 1px solid var(--pc-border-strong); }
	.phase-track li.current { color: var(--pc-text); }
	.phase-track li.complete { color: var(--pc-status-operational); }
	.phase-marker { width: 24px; height: 24px; flex: 0 0 auto; border: 1px solid currentColor; font-size: 11px; }
	.phase-track li span:last-child { display: grid; gap: 3px; min-width: 0; }
	.phase-track strong { font-size: 12px; font-weight: 500; }
	.phase-track small { color: var(--pc-text-faint); font-size: 10px; }
	.task-section { margin-top: 28px; }
	.task-heading { display: flex; align-items: end; justify-content: space-between; gap: 14px; margin-bottom: 12px; }
	.task-heading .kicker { margin-bottom: 5px; }
	.task-heading h3, .task-editor h3 { margin-bottom: 0; font-size: 17px; font-weight: 500; letter-spacing: -.03em; }
	.task-list { border-top: 1px solid var(--pc-border-strong); }
	.task-row { display: grid; grid-template-columns: 26px minmax(0, 1fr); align-items: start; gap: 11px; padding: 15px 0; border-bottom: 1px solid var(--pc-border-strong); }
	.task-state { width: 26px; height: 26px; border: 1px solid var(--pc-text-faint); color: var(--pc-text-faint); background: transparent; cursor: pointer; }
	.task-state.done { border-color: var(--pc-status-operational); color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 12%, transparent); }
	.task-state.not-doing { border-color: var(--pc-border-strong); color: var(--pc-text-faint); }
	.task-copy { min-width: 0; }
	.task-title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
	.task-title-row strong { font-size: 13px; font-weight: 500; }
	.task-status { flex: 0 0 auto; color: var(--pc-text-muted); font-size: 10px; }
	.task-status.done { color: var(--pc-status-operational); }
	.task-status.not-doing { color: var(--pc-text-faint); }
	.task-copy > p { max-width: 58ch; margin: 6px 0 0; color: var(--pc-text-muted); font-size: 12px; line-height: 1.5; }
	.task-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 9px; color: var(--pc-text-faint); font-size: 10px; }
	.task-meta span { display: inline-flex; align-items: center; gap: 5px; }
	.task-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 11px; }
	.task-actions a, .quiet-action { color: var(--pc-text-muted); font-size: 11px; }
	.task-actions a:hover, .quiet-action:hover, .detail-links a:hover, .incident-context a:hover { color: var(--pc-text); }
	.quiet-action { padding: 0; border: 0; background: transparent; font: inherit; cursor: pointer; }
	.editor-backdrop { position: fixed; z-index: 60; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; background: rgb(7 7 7 / .44); backdrop-filter: none; cursor: default; }
	.task-editor { position: fixed; z-index: 61; inset-block: 0; inset-inline-end: 0; display: flex; flex-direction: column; width: min(520px, calc(100vw - 16px)); max-width: 100%; block-size: 100dvh; overflow-y: auto; overscroll-behavior: contain; padding: 32px 32px max(28px, env(safe-area-inset-bottom)); border: 1px solid var(--pc-border-strong); border-inline-end: 0; border-start-start-radius: 26px; border-end-start-radius: 26px; color: var(--pc-text); background: var(--pc-surface-raised); }
	.editor-header { display: flex; align-items: start; justify-content: space-between; gap: 16px; padding-bottom: 22px; border-bottom: 1px solid var(--pc-border-strong); }
	.editor-header .kicker { margin-bottom: 6px; }
	.editor-header h3 { margin: 0; font-size: 20px; font-weight: 500; letter-spacing: -.035em; line-height: 1.2; }
	.editor-close { display: grid; flex: 0 0 auto; place-items: center; width: 40px; height: 40px; margin: -5px -5px 0 0; padding: 0; border: 0; border-radius: 50%; color: var(--pc-text-muted); background: transparent; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
	.editor-close:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.editor-task-name { margin: 24px 0 0; color: var(--pc-text); font-size: 16px; font-weight: 500; line-height: 1.45; }
	.editor-help { max-width: 42ch; margin: 7px 0 26px; color: var(--pc-text-muted); font-size: 13px; line-height: 1.55; text-wrap: pretty; }
	.task-editor form { display: flex; flex: 1; flex-direction: column; gap: 18px; }
	.task-editor :global(input) { min-height: 44px; border: 1px solid var(--pc-border-strong); color: var(--pc-text); background: var(--pc-bg); }
	.task-editor :global(input:focus-visible), .task-editor :global(.pc-select-trigger:focus-visible), .editor-close:focus-visible, .editor-backdrop:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.field { display: grid; gap: 8px; }
	.editor-actions { display: flex; align-items: center; gap: 16px; margin-top: auto; padding-top: 24px; border-top: 1px solid var(--pc-border-strong); }
	.detail-links { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--pc-border-strong); }
	@media (max-width: 1020px) { .flow-layout { grid-template-columns: minmax(0, 1fr); } .flow-detail-surface { order: -1; } }
	@media (max-width: 720px) { .flow-page { width: min(100% - 24px, 1160px); padding-top: 28px; } .page-header { align-items: start; flex-direction: column; gap: 14px; } .toolbar { align-items: stretch; flex-wrap: wrap; } .search-field { width: 100%; } .filter-group { order: 3; width: 100%; } .reset-button { margin-inline-start: auto; } .flow-row { grid-template-columns: 30px minmax(0, 1fr); align-items: start; padding: 16px; } .flow-row-meta { grid-column: 2; justify-content: space-between; } .incident-context { grid-template-columns: repeat(2, minmax(0, 1fr)); } .incident-context a { grid-column: 1 / -1; justify-self: start; } }
	@media (max-width: 460px) { .flow-detail-surface { padding: 17px; } .flow-summary { gap: 11px; } .flow-summary span + span { padding-inline-start: 11px; } .phase-track { grid-template-columns: 1fr; gap: 11px; } .phase-track li + li { padding-block-start: 11px; padding-inline-start: 0; border-block-start: 1px solid var(--pc-border-strong); border-inline-start: 0; } .task-title-row { align-items: start; flex-direction: column; gap: 5px; } .task-editor { width: min(100% - 16px, 520px); padding: 24px 20px max(22px, env(safe-area-inset-bottom)); border-start-start-radius: 22px; border-end-start-radius: 22px; } .editor-actions { align-items: stretch; flex-direction: column; gap: 10px; } .editor-actions :global(a), .editor-actions :global(button) { width: 100%; } }
	@media (prefers-reduced-motion: reduce) { .filter-group button, .reset-button, .flow-row, .editor-close { transition: none; } }
</style>
