<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, CheckCircle, Export } from 'reicon-svelte';
	import { Button, StatePanel } from '$lib/components/ui';
	import { hostedStatusPage } from '$lib/config/tenant';
	import { statusPages, type PublicIncidentStatus, type StatusIncident, type StatusIncidentUpdate } from '$lib/data/status';
	import { followUpsForIncident } from '$lib/data/followUps.svelte';

	const incidents = statusPages.flatMap((statusPage) => statusPage.incidents);
	let id = $derived(page.params.id);
	let incident = $derived(incidents.find((record) => record.id === id));
	let statusPage = $derived(statusPages.find((record) => record.incidents.some((item) => item.id === id)));
	let affectedComponents = $derived(statusPage?.components.filter((component) => incident?.affectedComponentIds.includes(component.id)) ?? []);
	let followUps = $derived(incident ? followUpsForIncident(incident.id) : []);
	let draftUpdates = $state<StatusIncidentUpdate[]>([]);
	let updateStatus = $state<PublicIncidentStatus>('Identified');
	let updateMessage = $state('');
	let updateError = $state('');
	let updateTimestamp = $state('');
	let visibleUpdates = $derived([...(incident?.updates ?? []), ...draftUpdates]);

	function stageUpdate() {
		updateError = '';
		if (!updateMessage.trim()) {
			updateError = 'Write the message customers or the team need next.';
			return;
		}
		const update: StatusIncidentUpdate = {
			id: `draft-${draftUpdates.length + 1}`,
			status: updateStatus,
			timestamp: updateTimestamp.trim() || 'Drafted just now',
			message: updateMessage.trim()
		};
		draftUpdates = [...draftUpdates, update];
		updateMessage = '';
		updateTimestamp = '';
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
	<div class="incident-detail">
		<header class="detail-header">
			<a class="back-link" href="/workspace/incidents"><ArrowLeft size={14} weight="Outline" aria-hidden="true" /> Incidents</a>
			<div class="detail-meta"><span class="state {statusTone(incident.status)}">{incident.status}</span><span>{incident.severity}</span><span>Started {incident.startedAt}</span></div>
			<h1>{incident.title}</h1>
			<p class="detail-lede">{incident.summary}</p>
			<p class="detail-context">{incident.productName} · owned by {incident.owner}</p>
		</header>

		<div class="detail-layout">
			<main>
				<section class="response-section" aria-labelledby="timeline-title">
					<div class="section-heading"><div><h2 id="timeline-title">Updates</h2></div><span>{visibleUpdates.length} entries</span></div>
					<div class="timeline">
						{#each [...visibleUpdates].reverse() as update (update.id)}
							<article class="timeline-entry">
								<span class="timeline-marker {statusTone(update.status)}" aria-hidden="true">{update.status === 'Resolved' ? '✓' : '•'}</span>
								<div class="timeline-content"><div class="update-heading"><strong>{update.status}</strong><time>{update.timestamp}</time></div><p>{update.message}</p></div>
							</article>
						{/each}
					</div>
				</section>

				<section class="composer" aria-labelledby="composer-title">
					<div class="section-heading"><div><h2 id="composer-title">Stage an update</h2></div><span>Draft</span></div>
					<p class="section-note">Choose the lifecycle state and write the next factual update. Publishing remains a deliberate step.</p>
					<form onsubmit={(event) => { event.preventDefault(); stageUpdate(); }}>
						<div class="form-grid"><label>Status<select bind:value={updateStatus}><option value="Investigating">Investigating</option><option value="Identified">Identified</option><option value="Monitoring">Monitoring</option><option value="Resolved">Resolved</option></select></label><label>Timestamp<input bind:value={updateTimestamp} placeholder="Sep 2, 2026 at 2:18 PM GMT+3" /></label></div>
						<label class="message-label">Message<textarea bind:value={updateMessage} rows="5" placeholder="What has changed, and what should people expect next?"></textarea></label>
						<div class="composer-footer">{#if updateError}<p class="form-error" role="alert">{updateError}</p>{:else}<p>This draft is local to the preview until persistence is connected.</p>{/if}<Button type="submit" variant="outline" size="sm">Stage update</Button></div>
					</form>
				</section>

				{#if followUps.length > 0}
					<section class="follow-ups" aria-labelledby="follow-up-title"><div class="section-heading"><div><h2 id="follow-up-title">Follow-up work</h2></div><span>{followUps.length} item{followUps.length === 1 ? '' : 's'}</span></div>{#each followUps as followUp (followUp.id)}<a href={followUp.href} target={followUp.href.startsWith('http') ? '_blank' : undefined} rel={followUp.href.startsWith('http') ? 'noopener noreferrer' : undefined} class="follow-up"><span><strong>{followUp.title}</strong><small>{followUp.description}</small></span><span>{followUp.status} · {followUp.owner}</span></a>{/each}</section>
				{/if}
			</main>

			<aside class="detail-aside">
				<section class="aside-section">{#if affectedComponents.length > 0}<ul>{#each affectedComponents as component (component.id)}<li><span class="service-dot"></span><span><strong>{component.name}</strong><small>{component.description}</small></span></li>{/each}</ul>{:else}<p class="aside-copy">No component has been linked to this incident yet.</p>{/if}</section>
				<section class="aside-section"><p class="aside-copy">This response can be published to the hosted status page for {incident.productName}.</p><a class="aside-link" href={hostedStatusPage.href} target="_blank" rel="noopener noreferrer">Open hosted status page <Export size={13} weight="Outline" aria-hidden="true" /></a></section>
				<section class="aside-section"><p class="owner">{incident.owner}</p><p class="aside-copy">The owner keeps the timeline current and decides when the next update is ready.</p></section>
			</aside>
		</div>
	</div>
{:else}
	<div class="missing-detail"><StatePanel size="page" icon={CheckCircle} title="Incident not found" description="This response record is not in the current workspace." actionLabel="Back to incidents" actionHref="/workspace/incidents" /></div>
{/if}

<style>
	.incident-detail { width: min(100% - 32px, 1080px); margin: 0 auto; padding: 36px 0 72px; }
	.detail-header { padding-bottom: 32px; border-bottom: 1px solid var(--pc-border-strong); }
	.back-link, .aside-link { display: inline-flex; align-items: center; gap: 6px; color: var(--pc-text-muted); font-size: 12px; text-decoration: none; }
	.back-link:hover, .aside-link:hover { color: var(--pc-text); }
	.detail-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; color: var(--pc-text-muted); font-size: 11px; }
	.detail-meta > span:not(.state) + span:not(.state)::before { margin-right: 10px; content: '·'; color: var(--pc-text-faint); }
	.state { display: inline-flex; align-items: center; min-height: 24px; padding: 0 9px; border-radius: 999px; color: var(--pc-status-outage); background: color-mix(in oklch, var(--pc-status-outage) 14%, transparent); }
	.state.monitoring { color: var(--pc-status-degraded); background: color-mix(in oklch, var(--pc-status-degraded) 14%, transparent); }
	.state.resolved { color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 14%, transparent); }
	h1 { max-width: 24ch; margin: 14px 0 0; font-size: clamp(30px, 5vw, 48px); font-weight: 500; letter-spacing: -.05em; line-height: 1.05; }
	.detail-lede { max-width: 68ch; margin: 14px 0 0; color: var(--pc-text-muted); font-size: 15px; line-height: 1.65; }
	.detail-context { margin: 12px 0 0; color: var(--pc-text-faint); font-size: 12px; }
	.detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 64px; padding-top: 42px; }
	main { min-width: 0; }
	.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
	.section-heading h2 { margin: 0; font-size: 20px; font-weight: 500; letter-spacing: -.04em; }
	.section-heading > span { color: var(--pc-text-faint); font-size: 11px; }
	.kicker { margin: 0 0 7px; color: var(--pc-accent-light); font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
	.timeline { position: relative; padding-left: 28px; }
	.timeline::before { position: absolute; top: 10px; bottom: 10px; left: 6px; width: 1px; content: ''; background: var(--pc-border-strong); }
	.timeline-entry { position: relative; display: grid; grid-template-columns: 1fr; padding: 0 0 30px; }
	.timeline-marker { position: absolute; top: 0; left: -28px; display: grid; width: 14px; height: 14px; place-items: center; border: 2px solid var(--pc-status-outage); border-radius: 50%; color: transparent; background: var(--pc-bg); font-size: 9px; line-height: 1; }
	.timeline-marker.monitoring { border-color: var(--pc-status-degraded); }
	.timeline-marker.resolved { border-color: var(--pc-status-operational); color: var(--pc-status-operational); }
	.timeline-content { padding-bottom: 2px; }
	.update-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
	.update-heading strong { font-size: 14px; font-weight: 600; }
	.update-heading time { color: var(--pc-text-faint); font-size: 11px; }
	.timeline-content p { max-width: 68ch; margin: 8px 0 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.65; }
	.composer, .follow-ups { margin-top: 12px; padding-top: 32px; border-top: 1px solid var(--pc-border-strong); }
	.section-note { max-width: 68ch; margin: -3px 0 18px; color: var(--pc-text-muted); font-size: 12px; line-height: 1.6; }
	.form-grid { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 12px; }
	form label { display: grid; gap: 7px; color: var(--pc-text-muted); font-size: 11px; }
	select, input, textarea { width: 100%; border: 1px solid var(--pc-border-strong); border-radius: 10px; color: var(--pc-text); background: var(--pc-surface-2); font: inherit; font-size: 12px; outline: none; }
	select, input { min-height: 40px; padding: 0 11px; }
	textarea { resize: vertical; min-height: 118px; padding: 11px; line-height: 1.55; }
	select:focus-visible, input:focus-visible, textarea:focus-visible { border-color: var(--pc-focus-ring); outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.message-label { margin-top: 14px; }
	.composer-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 12px; }
	.composer-footer p { margin: 0; color: var(--pc-text-faint); font-size: 11px; }
	.form-error { color: var(--pc-status-outage) !important; }
	.follow-up { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 13px 0; border-top: 1px solid var(--pc-border-strong); color: var(--pc-text); text-decoration: none; }
	.follow-up:last-child { border-bottom: 1px solid var(--pc-border-strong); }
	.follow-up:hover strong { color: var(--pc-accent-light); }
	.follow-up strong, .follow-up small { display: block; }
	.follow-up strong { font-size: 13px; font-weight: 500; }
	.follow-up small { max-width: 48ch; margin-top: 4px; color: var(--pc-text-muted); font-size: 11px; line-height: 1.45; }
	.follow-up > span:last-child { flex: 0 0 auto; color: var(--pc-text-faint); font-size: 11px; }
	.detail-aside { padding-top: 2px; }
	.aside-section { padding: 0 0 26px; margin-bottom: 26px; border-bottom: 1px solid var(--pc-border-strong); }
	.aside-section ul { display: grid; gap: 14px; padding: 0; margin: 0; list-style: none; }
	.aside-section li { display: flex; gap: 9px; }
	.service-dot { width: 7px; height: 7px; flex: 0 0 auto; margin-top: 4px; border-radius: 50%; background: var(--pc-status-outage); }
	.aside-section li strong, .aside-section li small { display: block; }
	.aside-section li strong, .owner { font-size: 13px; font-weight: 500; }
	.aside-section li small, .aside-copy { margin: 5px 0 0; color: var(--pc-text-muted); font-size: 11px; line-height: 1.55; }
	.aside-link { margin-top: 14px; color: var(--pc-text); text-decoration: underline; text-underline-offset: 4px; }
	.owner { margin: 0; }
	.missing-detail { width: min(100% - 32px, 960px); margin: 0 auto; padding-top: 48px; }
	@media (max-width: 760px) { .incident-detail { width: min(100% - 24px, 1080px); padding-top: 28px; } .detail-layout { grid-template-columns: 1fr; gap: 34px; } .detail-aside { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; } .aside-section { margin: 0; } }
	@media (max-width: 540px) { .detail-aside { grid-template-columns: 1fr; } .form-grid { grid-template-columns: 1fr; } .follow-up { align-items: start; flex-direction: column; gap: 7px; } .composer-footer { align-items: start; flex-direction: column; } }
</style>
