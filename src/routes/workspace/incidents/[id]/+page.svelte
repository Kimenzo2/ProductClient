<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { ArrowLeft, CheckCircle, CloseCircle } from 'reicon-svelte';
	import { Button, Input, Label, Select, StatePanel, Textarea } from '$lib/components/ui';
	import { statusPages, type PublicIncidentStatus, type StatusIncident, type StatusIncidentUpdate } from '$lib/data/status';

	const incidents = statusPages.flatMap((statusPage) => statusPage.incidents);
	let id = $derived(page.params.id);
	let incident = $derived(incidents.find((record) => record.id === id));
	let draftUpdates = $state<StatusIncidentUpdate[]>([]);
	let updateStatus = $state<PublicIncidentStatus>('Identified');
	let updateMessage = $state('');
	let updateError = $state('');
	let updateTimestamp = $state('');
	let visibleUpdates = $derived([...(incident?.updates ?? []), ...draftUpdates]);
	let updateDialogOpen = $state(false);
	let updatePanel = $state<HTMLElement | null>(null);
	let updateTrigger = $state<HTMLElement | null>(null);
	const updateStatusOptions = [
		{ value: 'Investigating', label: 'Investigating' },
		{ value: 'Identified', label: 'Identified' },
		{ value: 'Monitoring', label: 'Monitoring' },
		{ value: 'Resolved', label: 'Resolved' }
	];

	onMount(() => {
		const handleDialogKeydown = (event: KeyboardEvent) => {
			if (!updateDialogOpen) return;
			if (event.key === 'Escape') {
				event.preventDefault();
				closeUpdateDialog();
				return;
			}
			if (event.key !== 'Tab' || !updatePanel) return;
			const focusable = Array.from(updatePanel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
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

		window.addEventListener('keydown', handleDialogKeydown);
		return () => window.removeEventListener('keydown', handleDialogKeydown);
	});

	function stageUpdate() {
		updateError = '';
		if (!updateMessage.trim()) {
			updateError = 'Write the message customers or the team need next.';
			requestAnimationFrame(() => updatePanel?.querySelector<HTMLElement>('#incident-update-message')?.focus());
			return;
		}
		const update: StatusIncidentUpdate = {
			id: `draft-${draftUpdates.length + 1}`,
			status: updateStatus,
			timestamp: formatUpdateTimestamp(updateTimestamp),
			message: updateMessage.trim()
		};
		draftUpdates = [...draftUpdates, update];
		updateMessage = '';
		updateTimestamp = '';
		closeUpdateDialog();
	}

	function formatUpdateTimestamp(value: string) {
		if (!value) return 'Drafted just now';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		const formatted = new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'short'
		}).format(date);
		return formatted.replace(/, (?=\d)/, ' at ');
	}

	function openUpdateDialog() {
		updateTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		updateError = '';
		updateDialogOpen = true;
		requestAnimationFrame(() => updatePanel?.querySelector<HTMLElement>('select, input, textarea, button')?.focus());
	}

	function closeUpdateDialog() {
		updateDialogOpen = false;
		updateError = '';
		requestAnimationFrame(() => updateTrigger?.focus());
	}

	function statusTone(status: PublicIncidentStatus | StatusIncident['status']) {
		return status === 'Resolved' ? 'resolved' : status === 'Monitoring' ? 'monitoring' : 'active';
	}
</script>

<svelte:head>
	<title>{incident?.title ?? 'Incident'} | Product Client</title>
	<meta name="description" content="Coordinate an incident response and its customer-facing updates." />
</svelte:head>

{#if incident}
	<div class="incident-detail" inert={updateDialogOpen ? true : undefined}>
		<header class="detail-header">
			<a class="back-link" href="/workspace/incidents"><ArrowLeft size={14} weight="Outline" aria-hidden="true" /> Incidents</a>
			<div class="detail-meta"><span class="state {statusTone(incident.status)}">{incident.status}</span><span>{incident.severity}</span><span>Started {incident.startedAt}</span></div>
			<h1>{incident.title}</h1>
			<p class="detail-lede">{incident.summary}</p>
			<p class="detail-context">{incident.productName}</p>
		</header>

		<div class="detail-layout">
			<main>
				<section class="response-section" aria-labelledby="timeline-title">
					<div class="section-heading"><div><h2 id="timeline-title">Updates</h2></div><div class="section-heading-actions"><span>{visibleUpdates.length} entries</span><Button variant="outline" size="sm" aria-haspopup="dialog" aria-expanded={updateDialogOpen} onclick={openUpdateDialog}>Stage an update</Button></div></div>
					<div class="timeline">
						{#each [...visibleUpdates].reverse() as update (update.id)}
							<article class="timeline-entry">
								<span class="timeline-marker {statusTone(update.status)}" aria-hidden="true">{update.status === 'Resolved' ? '✓' : '•'}</span>
								<div class="timeline-content"><div class="update-heading"><strong>{update.status}</strong><time>{update.timestamp}</time></div><p>{update.message}</p></div>
							</article>
						{/each}
					</div>
				</section>
			</main>
		</div>
	</div>

	{#if updateDialogOpen}
		<button type="button" class="update-backdrop" aria-label="Close update composer" onclick={closeUpdateDialog}></button>
		<div class="update-dialog" bind:this={updatePanel} role="dialog" aria-modal="true" aria-labelledby="update-dialog-title" aria-describedby="update-dialog-help">
			<div class="dialog-header">
				<div>
					<h2 id="update-dialog-title">Stage an update</h2>
				</div>
				<button type="button" class="dialog-close" aria-label="Close update composer" onclick={closeUpdateDialog}><CloseCircle size={19} weight="Outline" aria-hidden="true" /></button>
			</div>
			<p id="update-dialog-help" class="dialog-help">Choose the current lifecycle state and write the next factual update for this incident.</p>
			<form onsubmit={(event) => { event.preventDefault(); stageUpdate(); }}>
				<div class="form-grid">
					<div class="field"><Label for="incident-update-status">Status</Label><Select id="incident-update-status" bind:value={updateStatus} options={updateStatusOptions} /></div>
					<div class="field"><Label for="incident-update-timestamp">When did this update happen?</Label><Input id="incident-update-timestamp" type="datetime-local" step="60" bind:value={updateTimestamp} class="dialog-control timestamp-control" /></div>
				</div>
				<div class="field"><Label for="incident-update-message">Message</Label><Textarea id="incident-update-message" bind:value={updateMessage} rows={7} placeholder="What has changed, and what should people expect next?" class="dialog-control dialog-textarea" invalid={Boolean(updateError)} aria-describedby={updateError ? 'update-message-error' : undefined} /></div>
				{#if updateError}<p id="update-message-error" class="form-error" role="alert">{updateError}</p>{/if}
				<div class="dialog-actions"><p>This draft is local to the preview until persistence is connected.</p><div><button type="button" class="quiet-action" onclick={closeUpdateDialog}>Cancel</button><Button type="submit" variant="primary" size="md">Stage update</Button></div></div>
			</form>
		</div>
	{/if}
{:else}
	<div class="missing-detail"><StatePanel size="page" icon={CheckCircle} title="Incident not found" description="This response record is not in the current workspace." actionLabel="Back to incidents" actionHref="/workspace/incidents" /></div>
{/if}

<style>
	.incident-detail { width: min(100% - 32px, 1080px); margin: 0 auto; padding: 36px 0 72px; }
	.detail-header { padding-bottom: 32px; border-bottom: 1px solid var(--pc-border-strong); }
	.back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--pc-text-muted); font-size: 12px; text-decoration: none; }
	.back-link:hover { color: var(--pc-text); }
	.detail-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; color: var(--pc-text-muted); font-size: 11px; }
	.detail-meta > span:not(.state) + span:not(.state)::before { margin-inline-end: 10px; content: '·'; color: var(--pc-text-faint); }
	.state { display: inline-flex; align-items: center; min-height: 24px; padding: 0 9px; border-radius: 999px; color: var(--pc-status-outage); background: color-mix(in oklch, var(--pc-status-outage) 14%, transparent); }
	.state.monitoring { color: var(--pc-status-degraded); background: color-mix(in oklch, var(--pc-status-degraded) 14%, transparent); }
	.state.resolved { color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 14%, transparent); }
	h1 { max-width: 24ch; margin: 14px 0 0; font-size: clamp(30px, 5vw, 48px); font-weight: 500; letter-spacing: -.05em; line-height: 1.05; }
	.detail-lede { max-width: 68ch; margin: 14px 0 0; color: var(--pc-text-muted); font-size: 15px; line-height: 1.65; }
	.detail-context { margin: 12px 0 0; color: var(--pc-text-faint); font-size: 12px; }
	.detail-layout { display: grid; grid-template-columns: minmax(0, 1fr); padding-top: 42px; }
	main { min-width: 0; }
	.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
	.section-heading-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
	.section-heading h2 { margin: 0; font-size: 20px; font-weight: 500; letter-spacing: -.04em; }
	.section-heading-actions > span { color: var(--pc-text-faint); font-size: 11px; }
	.timeline { position: relative; padding-inline-start: 28px; }
	.timeline::before { position: absolute; inset-block: 10px; inset-inline-start: 6px; width: 1px; content: ''; background: var(--pc-border-strong); }
	.timeline-entry { position: relative; display: grid; grid-template-columns: 1fr; padding: 0 0 30px; }
	.timeline-marker { position: absolute; inset-block-start: 0; inset-inline-start: -28px; display: grid; width: 14px; height: 14px; place-items: center; border: 2px solid var(--pc-status-outage); border-radius: 50%; color: transparent; background: var(--pc-bg); font-size: 9px; line-height: 1; }
	.timeline-marker.monitoring { border-color: var(--pc-status-degraded); }
	.timeline-marker.resolved { border-color: var(--pc-status-operational); color: var(--pc-status-operational); }
	.timeline-content { padding-bottom: 2px; }
	.update-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
	.update-heading strong { font-size: 14px; font-weight: 600; }
	.update-heading time { color: var(--pc-text-faint); font-size: 11px; }
	.timeline-content p { max-width: 68ch; margin: 8px 0 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.65; }
	.update-backdrop { position: fixed; z-index: 60; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; background: rgb(7 7 7 / .44); cursor: default; }
	.update-dialog { position: fixed; z-index: 61; inset-block: 0; inset-inline-end: 0; display: flex; flex-direction: column; width: min(640px, calc(100vw - 20px)); max-width: 100%; block-size: 100dvh; overflow-y: auto; overscroll-behavior: contain; padding: 40px 40px max(32px, env(safe-area-inset-bottom)); border: 1px solid var(--pc-border-strong); border-inline-end: 0; border-start-start-radius: 30px; border-end-start-radius: 30px; color: var(--pc-text); background: var(--pc-surface-raised); }
	.dialog-header { display: flex; align-items: start; justify-content: space-between; gap: 20px; padding-bottom: 24px; border-bottom: 1px solid var(--pc-border-strong); }
	.dialog-header h2 { margin: 0; font-size: 26px; font-weight: 500; letter-spacing: -.045em; line-height: 1.1; }
	.dialog-close { display: grid; flex: 0 0 auto; place-items: center; width: 42px; height: 42px; margin: -6px -6px 0 0; padding: 0; border: 0; border-radius: 50%; color: var(--pc-text-muted); background: transparent; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
	.dialog-close:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.dialog-help { max-width: 48ch; margin: 24px 0 30px; color: var(--pc-text-muted); font-size: 14px; line-height: 1.6; }
	.update-dialog form { display: flex; flex: 1; flex-direction: column; gap: 20px; }
	.form-grid { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 14px; }
	.field { display: grid; gap: 8px; min-width: 0; }
	.update-dialog :global(.pc-select-trigger) { min-height: 44px; border-radius: 12px; background: var(--pc-surface-2); font-size: 13px; }
	.update-dialog :global(.dialog-control) { width: 100%; min-height: 44px; border: 1px solid var(--pc-border-strong); border-radius: 12px; color: var(--pc-text); background: var(--pc-surface-2); font-size: 13px; outline: none; }
	.update-dialog :global(.dialog-textarea) { min-height: 150px; padding-block: 13px; resize: vertical; line-height: 1.55; }
	.update-dialog :global(.dialog-control:focus-visible), .update-dialog :global(.pc-select-trigger:focus-visible) { border-color: var(--pc-focus-ring); outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.dialog-actions { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin-top: auto; padding-top: 26px; border-top: 1px solid var(--pc-border-strong); }
	.dialog-actions p { max-width: 32ch; margin: 0; color: var(--pc-text-faint); font-size: 11px; line-height: 1.5; }
	.dialog-actions > div { display: flex; align-items: center; gap: 16px; }
	.quiet-action { padding: 0; border: 0; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 12px; cursor: pointer; }
	.quiet-action:hover { color: var(--pc-text); }
	.dialog-close:focus-visible, .update-backdrop:focus-visible, .quiet-action:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.form-error { color: var(--pc-status-outage) !important; }
	.missing-detail { width: min(100% - 32px, 960px); margin: 0 auto; padding-top: 48px; }
	@media (max-width: 760px) { .incident-detail { width: min(100% - 24px, 1080px); padding-top: 28px; } .detail-layout { padding-top: 34px; } }
	@media (max-width: 540px) { .section-heading { align-items: start; flex-direction: column; } .section-heading-actions { justify-content: space-between; width: 100%; } .form-grid { grid-template-columns: 1fr; } .update-dialog { width: min(100% - 12px, 640px); padding: 28px 22px max(24px, env(safe-area-inset-bottom)); border-start-start-radius: 24px; border-end-start-radius: 24px; } .dialog-header h2 { font-size: 23px; } .dialog-actions { align-items: stretch; flex-direction: column; } .dialog-actions > div { justify-content: space-between; } }
	@media (prefers-reduced-motion: reduce) { .dialog-close { transition: none; } }
</style>
