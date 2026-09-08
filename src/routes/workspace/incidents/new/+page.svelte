<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, CheckCircle, Export } from 'reicon-svelte';
	import { Button, Input, Label, Select, Textarea } from '$lib/components/ui';
	import { hostedStatusPage } from '$lib/config/tenant';
	import { products } from '$lib/data/workspace';
	import { hydrateStatusEditor, saveStatusEditor, startPublicIncident, statusEditorPreview, type PublicIncidentStatus, type PublicStatusState } from '$lib/data/statusEditor.svelte';

	type IncidentMode = 'Active' | 'Retrospective' | 'Test';
	type IncidentSeverity = 'Critical' | 'High impact' | 'Medium impact';
	type Stage = 'compose' | 'review' | 'prepared';

	let productSlug = $state(page.url.searchParams.get('product') ?? products[0]?.slug ?? '');
	let mode = $state<IncidentMode>('Active');
	let severity = $state<IncidentSeverity>('High impact');
	let title = $state('');
	let summary = $state('');
	let impact = $state('');
	let lead = $state('');
	let channel = $state('');
	let publicMessage = $state('');
	let initialStatus = $state<Extract<PublicIncidentStatus, 'investigating' | 'identified'>>('investigating');
	let customerImpact = $state<Extract<PublicStatusState, 'degraded' | 'outage'>>('outage');
	let startedAt = $state('');
	let selectedServices = $state<string[]>([]);
	let localTimeZone = $state('');
	let announce = $state(true);
	let postIncident = $state(true);
	let error = $state('');
	let stage = $state<Stage>('compose');
	let isPreparing = $state(false);
	let preparedIncidentId = $state('');
	let product = $derived(products.find((item) => item.slug === productSlug));
	const productOptions = products.map((item) => ({ value: item.slug, label: item.name }));
	const severityOptions = [
		{ value: 'Critical', label: 'Critical' },
		{ value: 'High impact', label: 'High impact' },
		{ value: 'Medium impact', label: 'Medium impact' }
	];
	const lifecycleOptions = [
		{ value: 'investigating', label: 'Investigating' },
		{ value: 'identified', label: 'Identified' }
	];
	const impactOptions = [
		{ value: 'outage', label: 'Outage — customers cannot use the service' },
		{ value: 'degraded', label: 'Degraded — customers may see errors or slowness' }
	];
	let serviceList = $derived(statusEditorPreview.page.services);

	onMount(() => {
		void hydrateStatusEditor();
		if (!startedAt) startedAt = formatLocalDateTime(new Date());
		localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your local time';
	});

	function formatLocalDateTime(date: Date) {
		const pad = (value: number) => String(value).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	function toggleService(id: string) {
		selectedServices = selectedServices.includes(id) ? selectedServices.filter((serviceId) => serviceId !== id) : [...selectedServices, id];
	}

	function validate() {
		if (!title.trim() || !summary.trim() || !impact.trim() || !lead.trim() || !publicMessage.trim() || !startedAt || selectedServices.length === 0) {
			error = 'Add the incident facts, first public update, start time, and at least one affected service before reviewing.';
			return false;
		}
		if (Number.isNaN(new Date(startedAt).getTime())) {
			error = 'Choose a valid start time.';
			return false;
		}
		error = '';
		return true;
	}

	function reviewDeclaration() {
		if (validate()) stage = 'review';
	}

	async function prepareDeclaration() {
		if (isPreparing || !validate()) return;
		isPreparing = true;
		error = '';
		await hydrateStatusEditor();
		const incidentId = startPublicIncident({
			title,
			summary,
			leadName: lead,
			status: initialStatus,
			impact: customerImpact,
			startedAt,
			message: publicMessage,
			affectedServices: selectedServices
		});
		if (!incidentId) {
			error = 'The incident could not be created. Check the declaration and try again.';
			isPreparing = false;
			return;
		}
		const result = await saveStatusEditor();
		if (!result.ok) {
			error = result.message ?? 'The incident could not be published. Try again.';
			isPreparing = false;
			return;
		}
		preparedIncidentId = incidentId;
		stage = 'prepared';
		isPreparing = false;
	}
</script>

<svelte:head>
	<title>Declare incident | Product Client</title>
	<meta name="description" content="Prepare an incident declaration and its customer-facing message." />
</svelte:head>

<div class="declare-page">
	<header class="declare-header">
		<a class="back-link" href="/workspace/incidents"><ArrowLeft size={14} weight="Outline" aria-hidden="true" /> Incidents</a>
		<div class="header-line"><div><h1>Declare an incident</h1><p>Start with the facts. The declaration becomes the response record the team coordinates around and the public update customers can trust.</p></div><Button href={hostedStatusPage.href} target="_blank" variant="outline" size="md"><Export size={14} weight="Outline" aria-hidden="true" /> Open hosted page</Button></div>
	</header>

	{#if stage === 'prepared'}
		<section class="prepared" aria-live="polite"><span class="prepared-mark"><CheckCircle size={22} weight="Outline" aria-hidden="true" /></span><h2>{title}</h2><p class="prepared-copy">The incident was created and its first Investigating update was published to the connected Status Page.</p><div class="prepared-actions"><Button href={preparedIncidentId ? `/workspace/incidents/${preparedIncidentId}` : '/workspace/incidents'} variant="primary" size="md">Open incident</Button><Button href={hostedStatusPage.href} target="_blank" variant="outline" size="md">Open hosted status page</Button></div></section>
	{:else if stage === 'review'}
		<section class="review" aria-labelledby="review-title">
			<div class="review-heading"><div><h2 id="review-title">Review before declaring</h2></div><span>{mode} incident</span></div>
			<div class="review-grid">
				<div><span class="field-name">Incident</span><strong>{title}</strong><p>{summary}</p></div>
				<div><span class="field-name">Impact</span><strong>{product?.name ?? productSlug} · {severity}</strong><p>{impact}</p></div>
				<div><span class="field-name">Response</span><strong>{lead}</strong><p>{channel ? `Coordination channel: ${channel}` : 'No coordination channel added.'}</p></div>
				<div><span class="field-name">Customer update</span><strong>{announce ? 'Will be announced' : 'Team only'}</strong><p>{publicMessage || 'No separate public message. The incident summary will need review before publication.'}</p></div>
			</div>
			{#if mode === 'Test'}<p class="mode-note">Test incidents stay separate from customer-facing history and normal reporting. Paging behavior still depends on the connected escalation rules.</p>{/if}
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<div class="review-actions"><Button variant="ghost" size="md" onclick={() => (stage = 'compose')}>Back to declaration</Button><Button variant="primary" size="md" loading={isPreparing} disabled={isPreparing} onclick={prepareDeclaration}>{isPreparing ? 'Publishing incident' : 'Declare incident'}</Button></div>
		</section>
	{:else}
		<form class="declare-form" onsubmit={(event) => { event.preventDefault(); reviewDeclaration(); }}>
			<div class="mode-switcher" role="group" aria-label="Incident type">
				{#each ['Active', 'Retrospective', 'Test'] as item}
					<button type="button" class:active={mode === item} aria-pressed={mode === item} onclick={() => (mode = item as IncidentMode)}>{item}</button>
				{/each}
			</div>
			{#if mode === 'Retrospective'}<p class="mode-note">This records a historical incident. It will not be treated as an active response until you explicitly announce it.</p>{:else if mode === 'Test'}<p class="mode-note">Test incidents are isolated from normal incident history, insights, announcements, and workflows.</p>{/if}

			<section class="form-section" aria-labelledby="facts-title"><div class="section-heading"><div><h2 id="facts-title">What is happening?</h2></div></div><div class="form-grid"><div class="field"><Label for="declare-product" class="declare-label">Product</Label><Select id="declare-product" bind:value={productSlug} options={productOptions} /></div><div class="field"><Label for="declare-severity" class="declare-label">Severity</Label><Select id="declare-severity" bind:value={severity} options={severityOptions} /></div><div class="field wide"><Label for="declare-title" class="declare-label">Incident name</Label><Input id="declare-title" bind:value={title} placeholder="Some people cannot sign in" class="declare-control" /></div><div class="field wide"><Label for="declare-summary" class="declare-label">Summary</Label><Textarea id="declare-summary" bind:value={summary} rows={4} placeholder="Explain the problem in one clear sentence or two." class="declare-control declare-textarea" /></div><div class="field wide"><Label for="declare-impact" class="declare-label">Who is affected?</Label><Textarea id="declare-impact" bind:value={impact} rows={3} placeholder="Describe who is affected and what they cannot do." class="declare-control declare-textarea" /></div></div></section>

			<section class="form-section" aria-labelledby="response-title"><div class="section-heading"><div><h2 id="response-title">Who is responding?</h2></div></div><div class="form-grid"><div class="field"><Label for="declare-lead" class="declare-label">Incident lead</Label><Input id="declare-lead" bind:value={lead} placeholder="Name or team" class="declare-control" /></div><div class="field"><Label for="declare-channel" class="declare-label">Coordination channel</Label><Input id="declare-channel" bind:value={channel} placeholder="#incident-room (optional)" class="declare-control" /></div></div></section>

			<section class="form-section" aria-labelledby="public-title"><div class="section-heading"><div><h2 id="public-title">What should customers hear?</h2><p>This is the first public incident update. It will appear on the hosted Status Page.</p></div></div><div class="form-grid"><div class="field"><Label for="declare-public-status" class="declare-label">Initial status</Label><Select id="declare-public-status" bind:value={initialStatus} options={lifecycleOptions} /></div><div class="field"><Label for="declare-public-impact" class="declare-label">Customer impact</Label><Select id="declare-public-impact" bind:value={customerImpact} options={impactOptions} /></div><div class="field wide"><Label for="declare-started" class="declare-label">When did this begin?</Label><Input id="declare-started" type="datetime-local" step="60" bind:value={startedAt} class="declare-control" aria-describedby="declare-started-help" /><span id="declare-started-help" class="field-help">Uses your local time ({localTimeZone || 'browser time'}).</span></div><div class="field wide"><Label for="declare-public-message" class="declare-label">First public update</Label><Textarea id="declare-public-message" bind:value={publicMessage} rows={5} placeholder="We are investigating reports of delayed API responses and working to restore normal performance." class="declare-control declare-textarea" /></div></div></section>

			<section class="form-section" aria-labelledby="affected-services-title"><div class="section-heading"><div><h2 id="affected-services-title">Which services are affected?</h2><p>Only selected services will be marked for customers and included in this incident.</p></div></div><div class="service-picker">{#if serviceList.length}{#each serviceList as service (service.id)}<label class="service-option" class:selected={selectedServices.includes(service.id)}><input type="checkbox" name="affectedServices" value={service.id} checked={selectedServices.includes(service.id)} onchange={() => toggleService(service.id)} /><span class="checkbox-mark" aria-hidden="true"><CheckCircle size={15} weight="Outline" /></span><span class="service-option-copy"><strong>{service.name}</strong><small>{service.description}</small></span></label>{/each}{:else}<p class="inline-empty">No services are configured yet. Add a component in the Status Editor before declaring an incident.</p>{/if}</div></section>



			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<div class="form-actions"><Button href="/workspace/incidents" variant="ghost" size="md">Cancel</Button><Button type="submit" variant="primary" size="md">Review declaration <ArrowRight size={14} weight="Outline" aria-hidden="true" /></Button></div>
		</form>
	{/if}
</div>

<style>
	.declare-page { width: min(100% - 32px, 820px); margin: 0 auto; padding: 36px 0 72px; }
	.declare-header { padding-bottom: 32px; border-bottom: 1px solid var(--pc-border-strong); }
	.back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--pc-text-muted); font-size: 12px; text-decoration: none; }
	.back-link:hover { color: var(--pc-text); }
	
	h1, h2 { margin: 0; font-weight: 500; letter-spacing: -.045em; }
	h1 { font-size: clamp(30px, 5vw, 46px); }
	h2 { font-size: 21px; }
	.declare-form, .review { padding-top: 28px; }
	.mode-switcher { display: flex; gap: 4px; padding-bottom: 18px; border-bottom: 1px solid var(--pc-border-strong); }
	.mode-switcher button { min-height: 38px; padding: 0 13px; border: 0; border-radius: 999px; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 12px; cursor: pointer; }
	.mode-switcher button:hover, .mode-switcher button.active { color: var(--pc-text); background: var(--pc-surface-2); }
	.mode-switcher button:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.mode-note { margin: 18px 0 -2px; padding: 12px 14px; border-inline-start: 2px solid var(--pc-accent); color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.form-section { padding-top: 34px; margin-top: 32px; border-top: 1px solid var(--pc-border-strong); }
	.section-heading { margin-bottom: 18px; }
	.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 14px; }
	.field { display: grid; gap: 7px; min-width: 0; }
	.form-grid .wide { grid-column: 1 / -1; }
	.field :global(.declare-label) { color: var(--pc-text-muted); font-size: 11px; }
	.declare-form :global(.pc-select-trigger) { min-height: 40px; border-radius: 10px; background: var(--pc-surface-2); font-size: 12px; }
	.declare-form :global(.declare-control) { width: 100%; min-height: 40px; border: 1px solid var(--pc-border-strong); border-radius: 10px; color: var(--pc-text); background: var(--pc-surface-2); font-size: 12px; outline: none; }
	.declare-form :global(.declare-textarea) { min-height: 94px; padding: 11px; resize: vertical; line-height: 1.55; }
	.declare-form :global(.declare-control:focus-visible), .declare-form :global(.pc-select-trigger:focus-visible) { border-color: var(--pc-focus-ring); outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.form-error { margin: 24px 0 0; color: var(--pc-status-outage); font-size: 12px; }
	.form-actions, .review-actions, .prepared-actions { display: flex; align-items: center; justify-content: flex-end; gap: 9px; margin-top: 28px; }
	.review-heading { display: flex; align-items: end; justify-content: space-between; gap: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--pc-border-strong); }
	.review-heading > span { color: var(--pc-text-muted); font-size: 11px; }
	.review-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 28px; }
	.review-grid > div { padding: 21px 0; border-bottom: 1px solid var(--pc-border-strong); }
	.field-name { display: block; margin-bottom: 8px; color: var(--pc-text-faint); font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
	.review-grid strong { display: block; font-size: 13px; font-weight: 500; }
	.review-grid p { margin: 7px 0 0; color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.prepared { padding: 72px 0; text-align: center; }
	.prepared-mark { display: grid; width: 48px; height: 48px; place-items: center; margin: 0 auto; border-radius: 50%; color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 15%, transparent); }
	.prepared h2 { font-size: 26px; }
	.prepared-copy { max-width: 54ch; margin: 12px auto 0; color: var(--pc-text-muted); font-size: 13px; line-height: 1.6; }
	@media (max-width: 600px) { .declare-page { width: min(100% - 24px, 820px); padding-top: 28px; } .form-grid, .review-grid { grid-template-columns: 1fr; } .form-grid .wide { grid-column: auto; } .review-heading { align-items: start; flex-direction: column; } .form-actions, .review-actions, .prepared-actions { align-items: stretch; flex-direction: column-reverse; } }
</style>
