<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
import { ArrowLeft, ArrowRight, InfoCircle } from 'reicon-svelte';
import { Button, Input, Label, Select, Textarea } from '$lib/components/ui';
import { tooltip } from '$lib/components/Tooltip.svelte';
	import {
		hydrateStatusEditor,
		saveStatusEditor,
		startPublicIncident,
		statusEditorPreview,
		type PublicIncidentStatus,
		type PublicStatusState
	} from '$lib/data/statusEditor.svelte';

	const lifecycleOptions = [
		{ value: 'investigating', label: 'Investigating' },
		{ value: 'identified', label: 'Identified' }
	];
	const impactOptions = [
		{ value: 'outage', label: 'Outage — customers cannot use the service' },
		{ value: 'degraded', label: 'Degraded — customers may see errors or slowness' }
	];
	const modeOptions = [
		{ value: 'Active', label: 'Active' },
		{ value: 'Retrospective', label: 'Retrospective' },
		{ value: 'Test', label: 'Test' }
	];
	const severityOptions = [
		{ value: 'Critical', label: 'Critical' },
		{ value: 'High impact', label: 'High impact' },
		{ value: 'Medium impact', label: 'Medium impact' }
	];
	const productOptions = [{ value: 'current', label: 'Current product' }];

	let title = $state('');
	let summary = $state('');
	let productSlug = $state('current');
	let leadName = $state('');
	let status = $state<Extract<PublicIncidentStatus, 'investigating' | 'identified'>>('investigating');
	let impact = $state<Extract<PublicStatusState, 'degraded' | 'outage'>>('outage');
	let startedAt = $state('');
	let message = $state('');
	let selectedServices = $state<string[]>([]);
	let mode = $state('Active');
	let severity = $state('High impact');
	let internalImpact = $state('');
	let coordinationChannel = $state('');
	let stage = $state<'compose' | 'review'>('compose');
	let errorMessage = $state('');
	let isSubmitting = $state(false);
	let localTimeZone = $state('');
	let serviceList = $derived(statusEditorPreview.page.services);

	onMount(async () => {
		await hydrateStatusEditor();
		if (!startedAt) startedAt = formatLocalDateTime(new Date());
		localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your local time';
	});

	function formatLocalDateTime(date: Date) {
		const pad = (value: number) => String(value).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	function toggleService(id: string, event: Event) {
		const checked = (event.currentTarget as HTMLInputElement).checked;
		selectedServices = checked
			? selectedServices.includes(id) ? selectedServices : [...selectedServices, id]
			: selectedServices.filter((serviceId) => serviceId !== id);
	}

	function reviewDeclaration(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';

		const selectedServiceIds = new Set(selectedServices);
		const hasAffectedService = serviceList.some((service) => selectedServiceIds.has(service.id));
		const missing = [
			['incident title', !title.trim()],
			['summary', !summary.trim()],
			['incident lead', !leadName.trim()],
			['who is affected', !internalImpact.trim()],
			['coordination channel', !coordinationChannel.trim()],
			['first public update', !message.trim()],
			['start time', !startedAt],
			['at least one affected service', !hasAffectedService]
		].filter(([, isMissing]) => isMissing).map(([label]) => label);
		if (missing.length) {
			errorMessage = `Complete ${missing.join(', ')} before reviewing.`;
			return;
		}
		if (Number.isNaN(new Date(startedAt).getTime())) {
			errorMessage = 'Choose a valid start time.';
			return;
		}

		stage = 'review';
	}

	async function createIncident() {
		if (isSubmitting) return;
		errorMessage = '';
		const incidentId = startPublicIncident({
			title,
			summary,
			leadName,
			status,
			impact,
			startedAt,
			message,
			affectedServices: selectedServices,
			mode: mode as 'Active' | 'Retrospective' | 'Test',
			severity: severity as 'Critical' | 'High impact' | 'Medium impact',
			coordinationChannel
		});
		if (!incidentId) {
			errorMessage = 'Choose a valid start time.';
			return;
		}
		isSubmitting = true;
		const result = await saveStatusEditor();
		isSubmitting = false;
		if (!result.ok) {
			errorMessage = result.message ?? 'Unable to publish the incident. Try again.';
			return;
		}
		void goto(`/workspace/status?incident=${encodeURIComponent(incidentId)}`);
	}
</script>

<svelte:head>
	<title>Start public incident | Product Client</title>
	<meta name="description" content="Start a customer-facing incident for the hosted Status Page." />
</svelte:head>

<div class="start-incident-page">
	<nav class="back-nav" aria-label="Status editor navigation">
		<a href="/workspace/status"><ArrowLeft size={15} weight="Outline" aria-hidden="true" />Back to Status editor</a>
	</nav>

	<header class="page-header">
		<div>
			<h1 class="inline-flex items-center gap-2">Start a public incident <span use:tooltip={{ text: 'Write the first factual update customers will see on the hosted Status Page.', island: true, typeY: 'bottom' }} class="inline-flex"><InfoCircle size={14} weight="Outline" aria-hidden="true" class="opacity-60" /></span></h1>
		</div>
	</header>

	{#if !statusEditorPreview.hydrated}
		<p class="loading-state" role="status">Loading the saved Status Page configuration…</p>
	{:else}
	{#if stage === 'review'}
	<section class="review" aria-labelledby="review-title">
		<div class="section-heading"><h2 id="review-title">Review before declaring</h2><p>{mode} incident · {severity}</p></div>
		<div class="review-grid"><div><span>Incident</span><strong>{title}</strong><p>{summary}</p></div><div><span>Impact</span><strong>{internalImpact}</strong><p>{productSlug} · {severity}</p></div><div><span>Response</span><strong>{leadName}</strong><p>{coordinationChannel}</p></div><div><span>Customer update</span><strong>{status === 'investigating' ? 'Investigating' : 'Identified'}</strong><p>{message}</p></div></div>
		{#if mode === 'Test'}<p class="mode-note">Test incidents stay separate from normal customer-facing history and reporting.</p>{/if}
		{#if errorMessage}<p class="form-error" role="alert">{errorMessage}</p>{/if}
		<div class="form-actions"><Button variant="ghost" size="lg" onclick={() => (stage = 'compose')}>Back to declaration</Button><Button variant="primary" size="lg" loading={isSubmitting} onclick={createIncident}>Start public incident <ArrowRight size={15} weight="Outline" aria-hidden="true" /></Button></div>
	</section>
	{:else}
	<form class="incident-form" onsubmit={reviewDeclaration}>
		<section class="form-section" aria-labelledby="response-facts-title"><div class="section-heading"><h2 id="response-facts-title" class="inline-flex items-center gap-2">How should the team coordinate? <span use:tooltip={{ text: 'These internal details travel with the response record.', island: true, typeY: 'bottom' }} class="inline-flex"><InfoCircle size={14} weight="Outline" aria-hidden="true" class="opacity-60" /></span></h2></div><div class="field-grid"><div class="field"><Label for="incident-mode" required>Incident type</Label><Select id="incident-mode" bind:value={mode} options={modeOptions} /></div><div class="field"><Label for="incident-severity" required>Severity</Label><Select id="incident-severity" bind:value={severity} options={severityOptions} /></div><div class="field wide"><Label for="incident-impact" required>Who is affected?</Label><Textarea id="incident-impact" bind:value={internalImpact} rows={3} placeholder="Describe who is affected and what they cannot do." /></div><div class="field"><Label for="incident-channel" required>Coordination channel</Label><Input id="incident-channel" bind:value={coordinationChannel} placeholder="#incident-room" /></div><div class="field"><Label for="incident-product" required>Product</Label><Select id="incident-product" bind:value={productSlug} options={productOptions} /></div></div></section>
		<section class="form-section" aria-labelledby="incident-facts-title">
			<div class="section-heading">
				<h2 id="incident-facts-title" class="inline-flex items-center gap-2">What should customers know? <span use:tooltip={{ text: 'Keep the title and summary clear enough to stand on their own in incident history.', island: true, typeY: 'bottom' }} class="inline-flex"><InfoCircle size={14} weight="Outline" aria-hidden="true" class="opacity-60" /></span></h2>
			</div>
			<div class="field-grid">
				<div class="field wide"><Label for="public-incident-title" required>Incident title</Label><Input id="public-incident-title" bind:value={title} placeholder="Some customers cannot sign in" /></div>
				<div class="field wide"><Label for="public-incident-summary" required>Summary</Label><Textarea id="public-incident-summary" bind:value={summary} rows={3} placeholder="Authentication is unavailable for some customers while the team investigates." /></div>
				<div class="field"><Label for="public-incident-lead" required>Incident lead</Label><Input id="public-incident-lead" bind:value={leadName} placeholder="Name or team" /></div>
				<div class="field"><Label for="public-incident-status" required>Initial status</Label><Select id="public-incident-status" bind:value={status} options={lifecycleOptions} /></div>
				<div class="field"><Label for="public-incident-impact" required>Customer impact</Label><Select id="public-incident-impact" bind:value={impact} options={impactOptions} /></div>
				<div class="field wide"><Label for="public-incident-started" required>When did this begin?</Label><Input id="public-incident-started" name="startedAt" type="datetime-local" step="60" bind:value={startedAt} aria-describedby="started-at-help" /><span id="started-at-help" class="field-help">Uses your local time ({localTimeZone || 'browser time'}). Customers see the tenant’s configured timezone.</span></div>
			</div>
		</section>

		<section class="form-section" aria-labelledby="affected-services-title">
			<div class="section-heading">
				<h2 id="affected-services-title" class="inline-flex items-center gap-2">Which services are affected? <span use:tooltip={{ text: 'Only selected services will be marked for customers and included in this incident.', island: true, typeY: 'bottom' }} class="inline-flex"><InfoCircle size={14} weight="Outline" aria-hidden="true" class="opacity-60" /></span></h2>
			</div>
			<div class="service-picker">
				{#if serviceList.length}
				{#each serviceList as service (service.id)}
					<label class="service-option" class:selected={selectedServices.includes(service.id)}>
						<input class="service-checkbox" type="checkbox" name="affectedServices" value={service.id} checked={selectedServices.includes(service.id)} onchange={(event) => toggleService(service.id, event)} />
						<span class="service-option-copy"><strong>{service.name}</strong><small>{service.description}</small></span>
					</label>
				{/each}
				{:else}
					<p class="inline-empty">No services are configured yet. Add a component in the Status Editor before starting an incident.</p>
				{/if}
			</div>
		</section>

		<section class="form-section" aria-labelledby="first-update-title">
			<div class="section-heading">
				<h2 id="first-update-title" class="inline-flex items-center gap-2">What is the team doing now? <span use:tooltip={{ text: 'This becomes the first timestamped update in the public incident history.', island: true, typeY: 'bottom' }} class="inline-flex"><InfoCircle size={14} weight="Outline" aria-hidden="true" class="opacity-60" /></span></h2>
			</div>
			<div class="field wide"><Label for="public-incident-message" required>Public update</Label><Textarea id="public-incident-message" bind:value={message} rows={5} placeholder="We are investigating reports of sign-in failures and are working to restore access." /></div>
		</section>

		{#if errorMessage}<p class="form-error" role="alert">{errorMessage}</p>{/if}
		<div class="form-actions">
			<Button type="submit" variant="primary" size="lg">Review declaration <ArrowRight size={15} weight="Outline" aria-hidden="true" /></Button>
			<a href="/workspace/status">Cancel</a>
		</div>
	</form>
	{/if}
	{/if}
</div>

<style>
	.start-incident-page { width: min(100% - 40px, 960px); margin: 0 auto; padding: 30px 0 72px; }
	.back-nav a { display: inline-flex; align-items: center; gap: 7px; color: var(--pc-text-muted); font-size: 12px; text-decoration: none; }
	.back-nav a:hover { color: var(--pc-text); }
	.back-nav a:focus-visible, .form-actions a:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.page-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-top: 28px; padding-bottom: 30px; border-bottom: 1px solid var(--pc-border-strong); }
	h1, h2, p { margin-top: 0; }
	h1 { margin-bottom: 0; font-size: clamp(30px, 4vw, 44px); font-weight: 500; letter-spacing: -.05em; line-height: 1.05; }
	h2 { margin-bottom: 0; font-size: 21px; font-weight: 500; letter-spacing: -.04em; }
	.incident-form { display: grid; gap: 0; }
	.form-section { padding: 30px 0; border-bottom: 1px solid var(--pc-border-strong); }
	.section-heading { margin-bottom: 22px; }
	.section-heading > p { max-width: 58ch; margin: 8px 0 0; color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 20px; }
	.field { display: grid; align-content: start; gap: 8px; min-width: 0; }
	.field.wide { grid-column: 1 / -1; }
	.field :global(.pc-select-trigger), .field :global(input) { min-height: 44px; }
	.field :global(textarea) { min-height: 116px; }
	.field-help { color: var(--pc-text-faint); font-size: 11px; line-height: 1.45; }
	.service-picker { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
	.service-option { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: 10px; min-width: 0; padding: 14px; border: 1px solid var(--pc-border-strong); border-radius: 12px; cursor: pointer; transition: border-color 120ms ease, background-color 120ms ease; }
	.service-option:hover, .service-option.selected { border-color: var(--pc-focus-ring); background: var(--pc-surface-2); }
	.service-option:focus-within { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.service-checkbox { appearance: none; display: grid; flex: 0 0 auto; width: 24px; height: 24px; place-items: center; margin: 0; border: 1px solid var(--pc-border-strong); border-radius: 7px; background: transparent; cursor: pointer; }
	.service-checkbox::after { width: 6px; height: 11px; border: solid var(--pc-status-operational); border-width: 0 2px 2px 0; content: ''; opacity: 0; transform: rotate(45deg) scale(.7); transition: opacity 120ms ease, transform 120ms ease; }
	.service-checkbox:checked { border-color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 12%, transparent); }
	.service-checkbox:checked::after { opacity: 1; transform: rotate(45deg) scale(1); }
	.service-checkbox:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.service-option-copy { display: grid; min-width: 0; gap: 4px; }
	.service-option-copy strong { overflow: hidden; color: var(--pc-text); font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.service-option-copy small { color: var(--pc-text-muted); font-size: 11px; line-height: 1.45; }
	.form-error { margin: 18px 0 0; color: var(--pc-status-outage); font-size: 12px; }
	.form-actions { display: flex; align-items: center; gap: 16px; padding-top: 24px; }
	.review { padding: 30px 0; }
	.review .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 18px; }
	.review-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 28px; }
	.review-grid > div { padding: 21px 0; border-bottom: 1px solid var(--pc-border-strong); }
	.review-grid span { display: block; margin-bottom: 8px; color: var(--pc-text-faint); font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
	.review-grid strong { display: block; font-size: 13px; font-weight: 500; }
	.review-grid p { margin: 7px 0 0; color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.mode-note { margin: 18px 0 0; padding: 12px 14px; border-inline-start: 2px solid var(--pc-accent); color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.form-actions a { color: var(--pc-text-muted); font-size: 13px; text-decoration: none; }
	.form-actions a:hover { color: var(--pc-text); }
	.loading-state, .inline-empty { color: var(--pc-text-muted); font-size: 14px; line-height: 1.55; }
	.loading-state { padding: 48px 0; }
	.inline-empty { grid-column: 1 / -1; margin: 0; padding: 20px 0; }
	@media (max-width: 720px) {
		.start-incident-page { width: min(100% - 24px, 960px); padding-top: 22px; }
		.page-header { align-items: start; flex-direction: column; gap: 18px; }
		.field-grid, .service-picker { grid-template-columns: minmax(0, 1fr); }
		.review .section-heading { align-items: start; flex-direction: column; }
		.review-grid { grid-template-columns: minmax(0, 1fr); }
	}
	@media (prefers-reduced-motion: reduce) { .service-option, .service-checkbox::after { transition: none; } }
</style>
