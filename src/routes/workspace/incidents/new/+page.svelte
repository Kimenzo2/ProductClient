<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, CheckCircle } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import { hostedStatusPage } from '$lib/config/tenant';
	import { products } from '$lib/data/workspace';

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
	let announce = $state(true);
	let postIncident = $state(true);
	let error = $state('');
	let stage = $state<Stage>('compose');
	let product = $derived(products.find((item) => item.slug === productSlug));

	function validate() {
		if (!title.trim() || !summary.trim() || !impact.trim() || !lead.trim()) {
			error = 'Add a name, summary, impact, and incident lead before reviewing the declaration.';
			return false;
		}
		error = '';
		return true;
	}

	function reviewDeclaration() {
		if (validate()) stage = 'review';
	}

	function prepareDeclaration() {
		stage = 'prepared';
	}
</script>

<svelte:head>
	<title>Declare incident | Product Client</title>
	<meta name="description" content="Prepare an incident declaration and its customer-facing message." />
</svelte:head>

<div class="declare-page">
	<header class="declare-header">
		<a class="back-link" href="/workspace/incidents"><ArrowLeft size={14} weight="Outline" aria-hidden="true" /> Incidents</a>
		
		<h1>Declare an incident</h1>
		<p>Start with the facts. The declaration becomes the response record the team coordinates around and the public update customers can trust.</p>
	</header>

	{#if stage === 'prepared'}
		<section class="prepared" aria-live="polite"><span class="prepared-mark"><CheckCircle size={22} weight="Outline" aria-hidden="true" /></span><h2>{title}</h2><p class="prepared-copy">The incident declaration is ready for the connected response service. No incident was published from this local preview.</p><div class="prepared-actions"><Button href="/workspace/incidents" variant="primary" size="md">Return to incidents</Button><Button href={hostedStatusPage.href} target="_blank" variant="outline" size="md">Open hosted status page</Button></div></section>
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
			<div class="review-actions"><Button variant="ghost" size="md" onclick={() => (stage = 'compose')}>Back to declaration</Button><Button variant="primary" size="md" onclick={prepareDeclaration}>Prepare declaration</Button></div>
		</section>
	{:else}
		<form class="declare-form" onsubmit={(event) => { event.preventDefault(); reviewDeclaration(); }}>
			<div class="mode-switcher" role="group" aria-label="Incident type">
				{#each ['Active', 'Retrospective', 'Test'] as item}
					<button type="button" class:active={mode === item} aria-pressed={mode === item} onclick={() => (mode = item as IncidentMode)}>{item}</button>
				{/each}
			</div>
			{#if mode === 'Retrospective'}<p class="mode-note">This records a historical incident. It will not be treated as an active response until you explicitly announce it.</p>{:else if mode === 'Test'}<p class="mode-note">Test incidents are isolated from normal incident history, insights, announcements, and workflows.</p>{/if}

			<section class="form-section" aria-labelledby="facts-title"><div class="section-heading"><div><h2 id="facts-title">What is happening?</h2></div></div><div class="form-grid"><label>Product<select bind:value={productSlug}>{#each products as item}<option value={item.slug}>{item.name}</option>{/each}</select></label><label>Severity<select bind:value={severity}><option value="Critical">Critical</option><option value="High impact">High impact</option><option value="Medium impact">Medium impact</option></select></label><label class="wide">Incident name<input bind:value={title} placeholder="Some people cannot sign in" /></label><label class="wide">Summary<textarea bind:value={summary} rows="4" placeholder="Explain the problem in one clear sentence or two."></textarea></label><label class="wide">Who is affected?<textarea bind:value={impact} rows="3" placeholder="Describe who is affected and what they cannot do."></textarea></label></div></section>

			<section class="form-section" aria-labelledby="response-title"><div class="section-heading"><div><h2 id="response-title">Who is responding?</h2></div></div><div class="form-grid"><label>Incident lead<input bind:value={lead} placeholder="Name or team" /></label><label>Coordination channel<input bind:value={channel} placeholder="#incident-room (optional)" /></label></div></section>

			<section class="form-section" aria-labelledby="announcement-title"><div class="section-heading"><div><h2 id="announcement-title">What should customers hear?</h2></div></div><label class="toggle-row"><input type="checkbox" bind:checked={announce} /><span><strong>Prepare a customer announcement</strong><small>Keep the public message connected to this incident instead of rewriting it elsewhere.</small></span></label><label class="wide message-field">Public message<textarea bind:value={publicMessage} rows="4" placeholder="Tell customers what they should expect right now."></textarea></label><label class="toggle-row"><input type="checkbox" bind:checked={postIncident} /><span><strong>Start a post-incident flow when this is resolved</strong><small>Keep the learning and follow-up work attached to this response.</small></span></label></section>

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
	.declare-header > p:last-child { max-width: 68ch; margin: 13px 0 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.65; }
	.declare-form, .review { padding-top: 28px; }
	.mode-switcher { display: flex; gap: 4px; padding-bottom: 18px; border-bottom: 1px solid var(--pc-border-strong); }
	.mode-switcher button { min-height: 38px; padding: 0 13px; border: 0; border-radius: 999px; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 12px; cursor: pointer; }
	.mode-switcher button:hover, .mode-switcher button.active { color: var(--pc-text); background: var(--pc-surface-2); }
	.mode-switcher button:focus-visible, .toggle-row input:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.mode-note { margin: 18px 0 -2px; padding: 12px 14px; border-left: 2px solid var(--pc-accent); color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.form-section { padding-top: 34px; margin-top: 32px; border-top: 1px solid var(--pc-border-strong); }
	.section-heading { margin-bottom: 18px; }
	.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 14px; }
	.form-grid label, .message-field { display: grid; gap: 7px; color: var(--pc-text-muted); font-size: 11px; }
	.form-grid .wide, .message-field { grid-column: 1 / -1; }
	select, input:not([type='checkbox']), textarea { width: 100%; border: 1px solid var(--pc-border-strong); border-radius: 10px; color: var(--pc-text); background: var(--pc-surface-2); font: inherit; font-size: 12px; outline: none; }
	select, input:not([type='checkbox']) { min-height: 40px; padding: 0 11px; }
	textarea { resize: vertical; min-height: 94px; padding: 11px; line-height: 1.55; }
	select:focus-visible, input:not([type='checkbox']):focus-visible, textarea:focus-visible { border-color: var(--pc-focus-ring); outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.toggle-row { display: flex; align-items: start; gap: 10px; margin-top: 17px; color: var(--pc-text); cursor: pointer; }
	.toggle-row input { width: 16px; height: 16px; flex: 0 0 auto; margin-top: 1px; accent-color: var(--pc-accent); }
	.toggle-row strong, .toggle-row small { display: block; }
	.toggle-row strong { font-size: 12px; font-weight: 500; }
	.toggle-row small { margin-top: 4px; color: var(--pc-text-muted); font-size: 11px; line-height: 1.5; }
	.message-field { margin-top: 18px; }
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
	@media (max-width: 600px) { .declare-page { width: min(100% - 24px, 820px); padding-top: 28px; } .form-grid, .review-grid { grid-template-columns: 1fr; } .form-grid .wide, .message-field { grid-column: auto; } .review-heading { align-items: start; flex-direction: column; } .form-actions, .review-actions, .prepared-actions { align-items: stretch; flex-direction: column-reverse; } }
</style>
