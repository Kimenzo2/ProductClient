<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { CheckCircle, Edit, Export, History, X } from 'reicon-svelte';
	import { tenantStatusUrl } from '$lib/tenant';
	import { Button, Input, Label, Select, Textarea } from '$lib/components/ui';
	import {
			hydrateStatusEditor,
			addStatusService,
			statusEditorPreview,
			updateStatusPageDetails,
			updateServiceStatus,
			saveStatusEditor,
			isStatusEditorDirty,
			type PublicStatusState
	} from '$lib/data/statusEditor.svelte';

	const serviceOptions = [
		{ value: 'operational', label: 'Operational' },
		{ value: 'degraded', label: 'Degraded' },
		{ value: 'outage', label: 'Outage' },
		{ value: 'unknown', label: 'Unknown' }
	];

	let notice = $state('');
	let addServiceOpen = $state(false);
	let newServiceName = $state('');
	let newServiceDescription = $state('');
	let pageTitleDraft = $state('');
	let pageDescriptionDraft = $state('');
	let incidentHistoryOpen = $state(false);
	let selectedIncidentId = $state('');
	let pageData = $derived(statusEditorPreview.page);
	let hostedStatusHref = $derived(tenantStatusUrl(pageData.productSlug));
	let incidentCount = $derived(pageData.incidents.length);
	let selectedIncident = $derived(pageData.incidents.find((incident) => incident.id === selectedIncidentId));
	let publishing = $derived(statusEditorPreview.saveState === 'saving');
	let dirty = $derived.by(() => {
		try {
			return isStatusEditorDirty();
		} catch {
			return false;
		}
	});
	let saveLabel = $derived(
		statusEditorPreview.saveState === 'saving'
			? 'Publishing…'
			: statusEditorPreview.saveState === 'error'
				? statusEditorPreview.saveError
				: dirty
					? 'Unpublished changes'
					: statusEditorPreview.saveState === 'saved'
						? statusEditorPreview.edgeSynced ? 'Published ✓' : 'Published — hosted page still syncing'
						: statusEditorPreview.saveState === 'local'
							? 'Local preview — sign in to publish'
							: 'Published'
	);

	onMount(async () => {
		await hydrateStatusEditor();
		pageTitleDraft = pageData.pageTitle;
		pageDescriptionDraft = pageData.pageDescription;
		if (page.url.searchParams.has('incident')) notice = 'Incident started and published to the Status Page.';
	});

	$effect(() => {
		const handler = (e: BeforeUnloadEvent) => {
			if (dirty && !publishing) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	async function publish() {
		if (!dirty || publishing) return;
		const result = await saveStatusEditor();
		notice = result.ok ? 'Published — hosted Status Page updated.' : (result.message ?? 'Publishing failed.');
	}

	function discardChanges() {
		// Reload last published snapshot by re-hydrating and dropping local draft
		try {
			sessionStorage.removeItem(`productclient.status-editor.preview.v2.${pageData.productSlug}`);
		} catch {}
		location.reload();
	}

	function incidentStatusLabel(status: string) {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	function openIncidentHistory() {
		selectedIncidentId = pageData.incidents[0]?.id ?? '';
		incidentHistoryOpen = true;
	}

	function closeIncidentHistory() {
		incidentHistoryOpen = false;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && incidentHistoryOpen) closeIncidentHistory();
	}

	function formatDate(value: string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
	}

	function changeServiceStatus(id: string, value: string) {
		updateServiceStatus(id, value as PublicStatusState);
		notice = 'Service status updated — click Publish to go live.';
	}

	function savePageDetails(event: SubmitEvent) {
		event.preventDefault();
		if (!updateStatusPageDetails(pageTitleDraft, pageDescriptionDraft)) {
			notice = 'Add a page title and description before saving.';
			return;
		}
		notice = 'Details updated — click Publish to go live.';
	}

	function createService(event: SubmitEvent) {
		event.preventDefault();
		const id = addStatusService({ name: newServiceName, description: newServiceDescription });
		if (!id) {
			notice = 'Add a component name and description first.';
			return;
		}
		newServiceName = '';
		newServiceDescription = '';
		addServiceOpen = false;
		notice = 'Component added — click Publish to go live.';
	}
</script>

<svelte:head>
	<title>Status editor | Product Client</title>
	<meta name="description" content="Prepare the customer-facing status page and publish incident updates." />
</svelte:head>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="status-editor-page">
	<header class="page-header">
		<div>
			<h1 class="text-wrap-balance">Status editor</h1>
			<p class="lede">Prepare what customers see when a service is healthy, degraded, or unavailable. Nothing goes live until you publish.</p>
		</div>
		<div class="header-actions">
			<Button variant="primary" size="lg" disabled={!dirty || publishing} loading={publishing} onclick={publish}><CheckCircle size={15} weight="Outline" aria-hidden="true" />{publishing ? 'Publishing…' : 'Publish'}</Button>
			<Button href="/workspace/status/incidents/new" variant="primary" size="lg"><Edit size={15} weight="Outline" aria-hidden="true" />Start an incident</Button>
			<button type="button" class="history-trigger" onclick={openIncidentHistory} aria-haspopup="dialog"><History size={15} weight="Outline" aria-hidden="true" /><span>Incident history</span><span class="history-count">{incidentCount}</span></button>
			<Button href={hostedStatusHref} target="_blank" aria-label="Open hosted Status Page in a new tab" variant="outline" size="lg"><Export size={15} weight="Outline" aria-hidden="true" />Open hosted page</Button>
		</div>
	</header>

	<div class="toolbar" style="display:flex;align-items:center;gap:12px;padding:16px 0 0;">
		<span class="save-notice {statusEditorPreview.saveState === 'error' ? 'error' : ''}" role="status" aria-live="polite"><CheckCircle size={14} weight="Outline" aria-hidden="true" />{saveLabel}</span>
		{#if dirty}<button type="button" class="text-action" onclick={discardChanges}>Discard changes</button>{/if}
	</div>
	{#if notice}<p class="context-notice" role="status">{notice}</p>{/if}
	{#if statusEditorPreview.loadError}<p class="editor-warning" role="status">{statusEditorPreview.loadError}</p>{/if}

	<section class="editor-section" aria-labelledby="services-title">
		<div class="section-heading">
			<div>
				<h2 id="services-title">Customer-facing services</h2>
				<p>These states are reflected in the hosted Status Page service list.</p>
			</div>
			<div class="section-heading-actions"><span>{pageData.services.length} services</span><button type="button" class="text-action" onclick={() => (addServiceOpen = !addServiceOpen)}>{addServiceOpen ? 'Close' : 'Add component'}</button></div>
		</div>
		{#if addServiceOpen}
			<form class="add-service-form" onsubmit={createService}>
				<div class="field"><Label for="new-service-name" required>Component name</Label><Input id="new-service-name" bind:value={newServiceName} placeholder="Billing" /></div>
				<div class="field"><Label for="new-service-description" required>Customer-facing description</Label><Input id="new-service-description" bind:value={newServiceDescription} placeholder="Invoices and payment history" /></div>
				<div class="add-service-actions"><Button type="submit" variant="primary" size="sm">Add component</Button><button type="button" class="text-action" onclick={() => (addServiceOpen = false)}>Cancel</button></div>
			</form>
		{/if}
		<div class="service-list">
			{#each pageData.services as service (service.id)}
				<div class="service-row">
					<div class="service-mark {service.status}" aria-hidden="true"><CheckCircle size={16} weight="Outline" /></div>
					<div class="service-copy">
						<strong>{service.name}</strong>
						<span>{service.description}</span>
					</div>
					<div class="service-uptime"><strong>{service.uptime}</strong><span>uptime</span></div>
					<div class="service-state">
						<label for="service-status-{service.id}" class="sr-only">Status for {service.name}</label>
						<Select id="service-status-{service.id}" value={service.status} options={serviceOptions} onValueChange={(value) => changeServiceStatus(service.id, value)} />
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="editor-section" aria-labelledby="page-settings-title">
		<div class="section-heading">
			<div>
				<h2 id="page-settings-title">Status Page details</h2>
				<p>Set the name and short description customers see on the hosted Status Page.</p>
			</div>
		</div>
		<form class="page-settings-form" onsubmit={savePageDetails}>
			<div class="field"><Label for="status-page-title" required>Page title</Label><Input id="status-page-title" bind:value={pageTitleDraft} maxlength="120" /></div>
			<div class="field"><Label for="status-page-description" required>Description</Label><Textarea id="status-page-description" bind:value={pageDescriptionDraft} rows={2} maxlength="280" /></div>
			<div class="page-settings-actions"><Button type="submit" variant="outline" size="sm">Save details</Button></div>
		</form>
	</section>

</div>

{#if incidentHistoryOpen}
	<button type="button" class="history-backdrop" aria-label="Close incident history" onclick={closeIncidentHistory}></button>
	<div class="history-modal" role="dialog" aria-modal="true" aria-labelledby="incident-history-title" aria-describedby="incident-history-help">
		<header class="history-modal-header">
			<div>
				<h2 id="incident-history-title">Public incident history</h2>
				<p id="incident-history-help">Review the incident updates published to the hosted Status Page.</p>
			</div>
			<button type="button" class="modal-close" onclick={closeIncidentHistory} aria-label="Close incident history"><X size={18} weight="Outline" aria-hidden="true" /></button>
		</header>
		{#if pageData.incidents.length}
			<div class="history-modal-body">
				<nav class="history-picker" aria-label="Public incidents">
					{#each pageData.incidents as incident (incident.id)}
						<button type="button" class="history-option" class:selected={selectedIncidentId === incident.id} onclick={() => (selectedIncidentId = incident.id)} aria-pressed={selectedIncidentId === incident.id}>
							<span class="history-option-title">{incident.title}</span>
							<span class="history-option-meta"><span class="incident-state {incident.status}">{incidentStatusLabel(incident.status)}</span> · {formatDate(incident.startedAt)}</span>
						</button>
					{/each}
				</nav>
				{#if selectedIncident}
					<div class="history-detail">
						<div class="detail-heading"><div><span>{incidentStatusLabel(selectedIncident.status)}</span><h3>{selectedIncident.title}</h3></div><span class="detail-date">Started {formatDate(selectedIncident.startedAt)}</span></div>
						<p class="detail-summary">{selectedIncident.summary}</p>
						<div class="detail-facts">
							<div><span>Affected services</span><strong>{selectedIncident.affectedServices.map((serviceId) => pageData.services.find((service) => service.id === serviceId)?.name ?? serviceId).join(', ') || 'None listed'}</strong></div>
							<div><span>Updates</span><strong>{selectedIncident.updates.length}</strong></div>
							{#if selectedIncident.leadName}<div><span>Incident lead</span><strong>{selectedIncident.leadName}</strong></div>{/if}
						</div>
						<div class="update-list">
							{#each [...selectedIncident.updates].reverse() as update (update.id)}
								<article class="update-row"><div class="update-row-heading"><strong>{incidentStatusLabel(update.status)}</strong><time datetime={update.publishedAt}>{formatDate(update.publishedAt)}</time></div><p>{update.message}</p></article>
							{/each}
						</div>
					</div>
				{:else}
					<div class="history-detail empty-detail"><History size={22} weight="Outline" aria-hidden="true" /><p>Select an incident to review its published updates.</p></div>
				{/if}
			</div>
		{:else}
			<div class="history-empty"><History size={24} weight="Outline" aria-hidden="true" /><h3>No public incidents yet</h3><p>Start a public incident when customers need a clear explanation.</p><a href="/workspace/status/incidents/new" onclick={closeIncidentHistory}>Start an incident</a></div>
		{/if}
	</div>
{/if}

<style>
	.status-editor-page { width: min(100% - 40px, 1160px); margin: 0 auto; padding: 44px 0 72px; }
	.page-header { display: flex; align-items: end; justify-content: space-between; gap: 28px; padding-bottom: 30px; border-bottom: 1px solid var(--pc-border-strong); }
	h1, h2, h3, p { margin-top: 0; }
	h1 { margin-bottom: 0; font-size: clamp(30px, 4vw, 44px); font-weight: 500; letter-spacing: -.05em; line-height: 1.05; }
	h2 { margin-bottom: 0; font-size: 22px; font-weight: 500; letter-spacing: -.04em; line-height: 1.15; }
	.lede, .section-heading p { color: var(--pc-text-muted); font-size: 14px; line-height: 1.55; }
	.lede { max-width: 54ch; margin: 12px 0 0; }
	.header-actions, .section-heading-actions { display: flex; align-items: center; gap: 10px; }
	.header-actions { flex-wrap: wrap; justify-content: end; }
	.history-trigger { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border: 1px solid var(--pc-border-strong); border-radius: 999px; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 12px; cursor: pointer; }
	.history-trigger:hover { border-color: var(--pc-text-faint); color: var(--pc-text); background: var(--pc-surface-2); }
	.history-trigger:focus-visible, .modal-close:focus-visible, .history-backdrop:focus-visible, .history-option:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.history-count { min-width: 18px; color: var(--pc-text-faint); text-align: center; }
	.save-notice, .context-notice, .editor-warning { display: flex; align-items: center; gap: 7px; margin: 18px 0 0; color: var(--pc-status-operational); font-size: 12px; }
	.save-notice.error, .editor-warning { color: var(--pc-status-outage); }
	.context-notice { color: var(--pc-text-muted); }
	.service-mark { display: grid; place-items: center; border-radius: 50%; color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 14%, transparent); width: 32px; height: 32px; }
	.service-mark.degraded { color: var(--pc-status-degraded); background: color-mix(in oklch, var(--pc-status-degraded) 14%, transparent); }
	.service-mark.outage { color: var(--pc-status-outage); background: color-mix(in oklch, var(--pc-status-outage) 14%, transparent); }
	.service-mark.unknown { color: var(--pc-text-muted); background: var(--pc-surface-2); }
	.editor-section { margin-top: 24px; border-top: 1px solid var(--pc-border-strong); }
	.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; padding: 24px 0 18px; }
	.section-heading p { margin: 8px 0 0; font-size: 12px; }
	.section-heading-actions > span { color: var(--pc-text-faint); font-size: 11px; white-space: nowrap; }
	.text-action { border: 0; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 12px; cursor: pointer; }
	.text-action:hover { color: var(--pc-text); }
	.text-action:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.add-service-form { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr) auto; align-items: end; gap: 14px; padding: 16px 0; border-top: 1px solid var(--pc-border-strong); border-bottom: 1px solid var(--pc-border-strong); }
	.page-settings-form { display: grid; grid-template-columns: minmax(0, .7fr) minmax(0, 1.3fr) auto; align-items: end; gap: 14px; padding: 0 0 22px; }
	.field { display: grid; gap: 7px; }
	.add-service-actions { display: flex; align-items: center; gap: 12px; padding-bottom: 2px; }
	.page-settings-actions { display: flex; align-items: center; padding-bottom: 2px; }
	.service-list { border-top: 1px solid var(--pc-border-strong); }
	.service-row { display: grid; align-items: center; gap: 14px; min-width: 0; padding: 16px 0; border-bottom: 1px solid var(--pc-border-strong); }
	.service-row { grid-template-columns: 32px minmax(0, 1fr) auto 160px; }
	.service-copy { display: grid; gap: 4px; min-width: 0; }
	.service-copy strong { overflow: hidden; color: var(--pc-text); font-size: 14px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.service-copy span { overflow: hidden; color: var(--pc-text-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
	.service-uptime { display: grid; gap: 3px; min-width: 80px; text-align: end; }
	.service-uptime strong { color: var(--pc-text); font-size: 12px; font-weight: 500; }
	.service-uptime span { color: var(--pc-text-faint); font-size: 10px; }
	.service-state :global(.pc-select-trigger) { min-height: 40px; }
	.incident-state { flex: 0 0 auto; color: var(--pc-status-degraded); font-size: 11px; }
	.incident-state.resolved { color: var(--pc-status-operational); }
	.incident-state.investigating, .incident-state.identified { color: var(--pc-status-outage); }
	.history-backdrop { position: fixed; z-index: 60; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; background: rgb(7 7 7 / .56); cursor: default; }
	.history-modal { position: fixed; z-index: 61; inset: 50% auto auto 50%; display: flex; flex-direction: column; width: min(calc(100% - 32px), 900px); max-height: min(760px, calc(100dvh - 32px)); transform: translate(-50%, -50%); overflow: hidden; border: 1px solid var(--pc-border-strong); border-radius: 18px; color: var(--pc-text); background: var(--pc-bg); }
	.history-modal-header { display: flex; align-items: start; justify-content: space-between; gap: 24px; padding: 28px 30px 24px; border-bottom: 1px solid var(--pc-border-strong); }
	.eyebrow { margin: 0 0 8px; color: var(--pc-accent-light); font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
	.history-modal h2 { margin: 0; font-size: 26px; }
	.history-modal-header > div > p:last-child { margin: 8px 0 0; color: var(--pc-text-muted); font-size: 13px; }
	.modal-close { display: grid; flex: 0 0 auto; place-items: center; width: 34px; height: 34px; border: 1px solid var(--pc-border-strong); border-radius: 50%; color: var(--pc-text-muted); background: transparent; cursor: pointer; }
	.modal-close:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.history-modal-body { display: grid; grid-template-columns: minmax(220px, .72fr) minmax(0, 1.45fr); min-height: 0; flex: 1; }
	.history-picker { overflow-y: auto; padding: 18px 0; border-inline-end: 1px solid var(--pc-border-strong); }
	.picker-heading, .update-list-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--pc-text-faint); font-size: 11px; }
	.picker-heading { padding: 0 20px 10px; text-transform: uppercase; letter-spacing: .12em; }
	.history-option { display: grid; gap: 7px; width: 100%; padding: 15px 20px; border: 0; border-inline-start: 2px solid transparent; color: inherit; background: transparent; text-align: start; cursor: pointer; }
	.history-option:hover { background: var(--pc-surface-2); }
	.history-option.selected { border-inline-start-color: var(--pc-accent); background: var(--pc-surface-2); }
	.history-option-title { overflow: hidden; color: var(--pc-text); font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.history-option-meta { color: var(--pc-text-faint); font-size: 11px; }
	.history-detail { min-width: 0; overflow-y: auto; padding: 26px 30px 30px; }
	.detail-heading { display: flex; align-items: start; justify-content: space-between; gap: 20px; }
	.detail-heading h3 { margin: 0; font-size: 22px; font-weight: 500; letter-spacing: -.04em; }
	.detail-date { flex: 0 0 auto; color: var(--pc-text-faint); font-size: 11px; }
	.detail-summary { max-width: 60ch; margin: 12px 0 0; color: var(--pc-text-muted); font-size: 13px; line-height: 1.6; }
	.detail-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 24px; padding: 16px 0; border-top: 1px solid var(--pc-border-strong); border-bottom: 1px solid var(--pc-border-strong); }
	.detail-facts div { display: grid; gap: 5px; min-width: 0; }
	.detail-facts span { color: var(--pc-text-faint); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
	.detail-facts strong { overflow: hidden; color: var(--pc-text); font-size: 12px; font-weight: 500; text-overflow: ellipsis; }
	.update-list { margin-top: 24px; }
	.update-list-heading { padding-bottom: 10px; border-bottom: 1px solid var(--pc-border-strong); text-transform: uppercase; letter-spacing: .12em; }
	.update-row { padding: 15px 0; border-bottom: 1px solid var(--pc-border-strong); }
	.update-row-heading { display: flex; align-items: center; gap: 12px; }
	.update-row-heading strong { color: var(--pc-text); font-size: 12px; font-weight: 500; }
	.update-row-heading time { color: var(--pc-text-faint); font-size: 11px; }
	.update-row p { margin: 7px 0 0; color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.history-empty, .empty-detail { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260px; padding: 34px; color: var(--pc-text-muted); text-align: center; }
	.history-empty h3 { margin: 14px 0 0; color: var(--pc-text); font-size: 16px; font-weight: 500; }
	.history-empty p, .empty-detail p { max-width: 38ch; margin: 8px 0 0; font-size: 12px; line-height: 1.55; }
	.history-empty a { margin-top: 17px; color: var(--pc-text); font-size: 12px; text-decoration: underline; text-underline-offset: 4px; }
	@media (max-width: 760px) {
		.status-editor-page { width: min(100% - 24px, 1160px); padding-top: 28px; }
		.page-header { align-items: start; flex-direction: column; gap: 18px; }
		.header-actions { justify-content: start; }
		.section-heading { align-items: start; flex-direction: column; gap: 12px; }
		.section-heading-actions { justify-content: space-between; width: 100%; }
		.add-service-form, .page-settings-form { grid-template-columns: minmax(0, 1fr); align-items: stretch; }
		.add-service-actions { padding: 0; }
		.service-row { grid-template-columns: 32px minmax(0, 1fr); }
		.service-uptime { grid-column: 2; grid-row: 2; justify-self: start; display: flex; gap: 5px; text-align: start; }
		.service-state { grid-column: 2; grid-row: 3; }
		.history-modal { width: min(calc(100% - 20px), 900px); max-height: calc(100dvh - 20px); }
		.history-modal-header { padding: 22px 20px 18px; }
		.history-modal-body { grid-template-columns: 1fr; overflow-y: auto; }
		.history-picker { max-height: 190px; border-inline-end: 0; border-bottom: 1px solid var(--pc-border-strong); }
		.history-detail { overflow: visible; padding: 22px 20px 26px; }
		.detail-facts { grid-template-columns: 1fr 1fr; }
		.detail-facts div:last-child { grid-column: 1 / -1; }
	}
</style>
