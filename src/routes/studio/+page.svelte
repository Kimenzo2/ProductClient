<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { ArrowRight, Check, FileText, ImagePlus, Rocket, Sparkles, Upload } from 'reicon-svelte';
	import { Button, Card, Chip, Input, Label, Select, Textarea } from '$lib/components/ui';

	type StudioMode = 'update' | 'launch';
	type UpdateStatus = 'idle' | 'saved' | 'published';
	type LaunchStatus = 'idle' | 'saved' | 'prepared';
	type ChecklistItem = { label: string; done: boolean; required: boolean };

	let mode = $state<StudioMode>('update');

	let title = $state('');
	let type = $state('launch');
	let desc = $state('');
	let updateProduct = $state('bento');
	let audience = $state('public');
	let mediaName = $state('');
	let updateStatus = $state<UpdateStatus>('idle');

	let productName = $state('');
	let tagline = $state('');
	let category = $state('');
	let logoUrl = $state('');
	let websiteUrl = $state('');
	let launchDate = $state('');
	let launchDesc = $state('');
	let launchStatus = $state<LaunchStatus>('idle');
	let createdSlug = $state('');
	let editorError = $state('');

	const updateTypeOptions = [
		{ value: 'launch', label: 'Product launch' },
		{ value: 'changelog', label: 'Changelog' },
		{ value: 'incident', label: 'Service problem' },
		{ value: 'fix', label: 'Fix' },
		{ value: 'event', label: 'Event' }
	];

	const productOptions = [
		{ value: 'bento', label: 'Bento' },
		{ value: 'chatgpt', label: 'ChatGPT' },
		{ value: 'linear', label: 'Linear' }
	];

	const audienceOptions = [
		{ value: 'public', label: 'Public release timeline' },
		{ value: 'preview', label: 'Customer preview' },
		{ value: 'internal', label: 'Internal team' }
	];

	const categoryOptions = [
		{ value: 'ai', label: 'AI & machine learning' },
		{ value: 'developer-tools', label: 'Developer tools' },
		{ value: 'design', label: 'Design & creative' },
		{ value: 'productivity', label: 'Productivity' },
		{ value: 'cloud', label: 'Cloud & infrastructure' },
		{ value: 'finance', label: 'Finance & payments' },
		{ value: 'open-source', label: 'Open source' },
		{ value: 'saas', label: 'SaaS' },
		{ value: 'mobile', label: 'Mobile' },
		{ value: 'other', label: 'Other' }
	];

	let selectedProduct = $derived(productOptions.find((item) => item.value === updateProduct)?.label ?? 'Bento');
	let selectedUpdateType = $derived(updateTypeOptions.find((item) => item.value === type)?.label ?? 'Product launch');
	let selectedAudience = $derived(audienceOptions.find((item) => item.value === audience)?.label ?? 'Public release timeline');
	let selectedCategory = $derived(categoryOptions.find((item) => item.value === category)?.label ?? 'Choose a category');

	let updateChecks = $derived<ChecklistItem[]>([
		{ label: 'Title', done: title.trim().length > 0, required: true },
		{ label: 'Description', done: desc.trim().length > 0, required: true },
		{ label: 'Product', done: updateProduct.length > 0, required: true },
		{ label: 'Media', done: mediaName.length > 0, required: false }
	]);

	let launchChecks = $derived<ChecklistItem[]>([
		{ label: 'Product name', done: productName.trim().length > 0, required: true },
		{ label: 'Tagline', done: tagline.trim().length > 0, required: true },
		{ label: 'Category', done: category.length > 0, required: true },
		{ label: 'Launch date', done: launchDate.length > 0, required: true },
		{ label: 'Description', done: launchDesc.trim().length > 0, required: true },
		{ label: 'Logo + website', done: logoUrl.trim().length > 0 && websiteUrl.trim().length > 0, required: false }
	]);

	let updateRequiredDone = $derived(updateChecks.filter((item) => item.required && item.done).length);
	let launchRequiredDone = $derived(launchChecks.filter((item) => item.required && item.done).length);
	let updateReady = $derived(updateRequiredDone === updateChecks.filter((item) => item.required).length);
	let launchReady = $derived(launchRequiredDone === launchChecks.filter((item) => item.required).length);

	function changeMode(value: unknown) {
		if (value === 'update' || value === 'launch') {
			mode = value;
			editorError = '';
		}
	}

	function saveUpdate(status: Exclude<UpdateStatus, 'idle'>) {
		editorError = '';
		if (!title.trim()) {
			editorError = 'Add a title so people know what changed.';
			return;
		}
		if (!desc.trim()) {
			editorError = 'Add a description that explains the change.';
			return;
		}
		updateStatus = status;
	}

	function saveLaunchDraft() {
		editorError = '';
		if (!productName.trim()) {
			editorError = 'Add a product name first.';
			return;
		}
		launchStatus = 'saved';
	}

	function prepareLaunch() {
		editorError = '';
		if (!productName.trim()) {
			editorError = 'Add a product name before preparing the launch page.';
			return;
		}
		if (!tagline.trim()) {
			editorError = 'Add a tagline that says what the product does.';
			return;
		}
		if (!category || !launchDate) {
			editorError = 'Choose a category and launch date.';
			return;
		}
		if (!launchDesc.trim()) {
			editorError = 'Add a description first.';
			return;
		}
		createdSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		launchStatus = 'prepared';
	}

	function handleMediaChange(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		mediaName = file?.name ?? '';
	}
</script>

<svelte:head>
	<title>Studio | Product Client</title>
	<meta name="description" content="Prepare product updates and launch pages for review." />
</svelte:head>

<div class="studio-page">
	<div class="studio-shell">
		<header class="studio-header">
			<div class="header-copy">
				<p class="eyebrow">Studio</p>
				<h1>Ship an update or product.</h1>
				<p>Choose a workflow and fill in the essentials.</p>
			</div>
			<div class="header-actions">
				<span class="prototype-state"><span class="status-dot" aria-hidden="true"></span>Prototype</span>
				<Button href="/workspace" variant="ghost" size="sm">Back to workspace</Button>
			</div>
		</header>

		<Tabs.Root value={mode} onValueChange={changeMode} class="studio-tabs">
			<Tabs.List class="studio-tab-list" aria-label="Studio workflow">
				<Tabs.Trigger value="update" class="studio-tab">
					<span class="tab-icon"><Sparkles size={16} weight="Outline" aria-hidden="true" /></span>
					<strong>Update</strong>
				</Tabs.Trigger>
				<Tabs.Trigger value="launch" class="studio-tab">
					<span class="tab-icon"><Rocket size={16} weight="Outline" aria-hidden="true" /></span>
					<strong>Launch</strong>
				</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>

		{#if mode === 'update'}
			<div class="studio-grid">
				<main>
					<Card variant="surface" padding="lg" class="editor-surface">
						<div class="surface-heading">
							<div><p class="section-kicker">Update</p><h2>Publish an update.</h2></div>
							<Chip variant={updateStatus === 'published' ? 'accent' : 'default'} size="xs">{updateStatus === 'published' ? 'Preview ready' : updateStatus === 'saved' ? 'Draft saved' : 'Draft'}</Chip>
						</div>

						{#if updateStatus !== 'idle'}
							<div class="status-message" role="status">
								<span class="status-icon"><Check size={15} weight="Outline" aria-hidden="true" /></span>
								<span><strong>{updateStatus === 'published' ? 'Preview ready.' : 'Draft saved.'}</strong><small>{updateStatus === 'published' ? 'Backend publishing connects later.' : 'Saved in this prototype.'}</small></span>
							</div>
						{/if}

						<form class="editor-form" onsubmit={(event) => { event.preventDefault(); saveUpdate('published'); }}>
							<section class="form-block" aria-labelledby="update-message-title">
								<div class="step-heading"><span class="step-number">01</span><h3 id="update-message-title">Content</h3></div>
								<div class="field-stack">
									<div class="field"><Label for="pc-title" required>Title</Label><Input id="pc-title" bind:value={title} placeholder="What changed?" /></div>
									<div class="field-grid">
										<div class="field"><Label for="pc-type" required>Type</Label><Select id="pc-type" bind:value={type} options={updateTypeOptions} /></div>
										<div class="field"><Label for="pc-product" required>Product</Label><Select id="pc-product" bind:value={updateProduct} options={productOptions} /></div>
									</div>
									<div class="field"><Label for="pc-desc" required>Description</Label><Textarea id="pc-desc" bind:value={desc} rows={7} placeholder="What changed, and why does it matter?" /></div>
								</div>
							</section>

							<section class="form-block" aria-labelledby="update-audience-title">
								<div class="step-heading"><span class="step-number">02</span><h3 id="update-audience-title">Audience</h3></div>
								<div class="field-grid audience-grid"><div class="field"><Label for="pc-audience">Publish to</Label><Select id="pc-audience" bind:value={audience} options={audienceOptions} /></div><div class="field field-note"><FileText size={17} weight="Outline" aria-hidden="true" /><span><strong>{selectedProduct} · {selectedAudience}</strong><small>{selectedUpdateType}</small></span></div></div>
							</section>

							<section class="form-block" aria-labelledby="update-media-title">
								<div class="step-heading"><span class="step-number">03</span><h3 id="update-media-title">Media</h3></div>
								<div class="media-drop"><span class="media-icon"><Upload size={19} weight="Outline" aria-hidden="true" /></span><span><strong>{mediaName || 'Add supporting media'}</strong><small>Image, video, or PDF · up to 50 MB</small></span><label for="pc-media" class="file-action">{mediaName ? 'Replace file' : 'Select file'}</label><input id="pc-media" type="file" accept="image/*,video/*,.pdf" class="sr-only" onchange={handleMediaChange} /></div>
							</section>

							{#if editorError}<p class="editor-error" role="alert">{editorError}</p>{/if}
							<div class="editor-actions"><span class="action-note">Required: {updateRequiredDone}/3</span><div><Button type="button" variant="ghost" onclick={() => saveUpdate('saved')}>Save draft</Button><Button type="submit" variant="primary" disabled={!updateReady}>Publish update <ArrowRight size={14} weight="Outline" aria-hidden="true" /></Button></div></div>
						</form>
					</Card>
				</main>

				<aside class="inspector" aria-label="Update inspector">
					<section class="inspector-section readiness-section"><div class="inspector-heading"><div><p class="section-kicker">Publish checks</p><h2>{updateReady ? 'Ready to publish.' : 'Complete required fields.'}</h2></div><span class="check-count">{updateRequiredDone}/3</span></div><ul class="checklist">{#each updateChecks as item (item.label)}<li class:check-complete={item.done}><span class="check-mark">{#if item.done}<Check size={12} weight="Outline" aria-hidden="true" />{/if}</span><span><strong>{item.label}</strong></span></li>{/each}</ul></section>
					<section class="inspector-section preview-section"><div class="inspector-heading"><div><p class="section-kicker">Preview</p><h2>Update</h2></div></div><div class="preview-window"><div class="preview-bar"><span>Product Client</span><span class="preview-state"><span class="status-dot" aria-hidden="true"></span>{selectedAudience}</span></div><div class="preview-content"><span class="preview-type">{selectedUpdateType}</span><h3>{title.trim() || 'Your update title'}</h3><p>{desc.trim() || 'Your description will appear here.'}</p><div class="preview-meta"><span>{selectedProduct}</span><span>Draft preview</span></div></div></div></section>
				</aside>
			</div>
		{:else}
			<div class="studio-grid">
				<main>
					<Card variant="surface" padding="lg" class="editor-surface">
						<div class="surface-heading"><div><p class="section-kicker">Launch</p><h2>Prepare a launch page.</h2></div><Chip variant={launchStatus === 'prepared' ? 'accent' : 'default'} size="xs">{launchStatus === 'prepared' ? 'Preview ready' : launchStatus === 'saved' ? 'Draft saved' : 'Draft'}</Chip></div>
						{#if launchStatus !== 'idle'}<div class="status-message" role="status"><span class="status-icon"><Check size={15} weight="Outline" aria-hidden="true" /></span><span><strong>{launchStatus === 'prepared' ? 'Launch preview ready.' : 'Draft saved.'}</strong><small>{launchStatus === 'prepared' ? `Proposed path: /launch/${createdSlug}. Backend publishing connects later.` : 'Saved in this prototype.'}</small></span></div>{/if}
						<form class="editor-form" onsubmit={(event) => { event.preventDefault(); prepareLaunch(); }}>
							<section class="form-block" aria-labelledby="product-details-title"><div class="step-heading"><span class="step-number">01</span><h3 id="product-details-title">Basics</h3></div><div class="field-stack"><div class="field-grid"><div class="field"><Label for="pc-product-name" required>Product name</Label><Input id="pc-product-name" bind:value={productName} placeholder="Example: Bento" /></div><div class="field"><Label for="pc-tagline" required>Tagline</Label><Input id="pc-tagline" bind:value={tagline} placeholder="What does it do?" /></div></div><div class="field-grid"><div class="field"><Label for="pc-category" required>Category</Label><Select id="pc-category" bind:value={category} options={categoryOptions} placeholder="Choose a category" /></div><div class="field"><Label for="pc-date" required>Launch date</Label><Input id="pc-date" type="date" bind:value={launchDate} /></div></div><div class="field-grid"><div class="field"><Label for="pc-logo">Logo URL</Label><Input id="pc-logo" bind:value={logoUrl} placeholder="https://..." /></div><div class="field"><Label for="pc-website">Website URL</Label><Input id="pc-website" bind:value={websiteUrl} placeholder="https://..." /></div></div></div></section>
							<section class="form-block" aria-labelledby="launch-story-title"><div class="step-heading"><span class="step-number">02</span><h3 id="launch-story-title">Description</h3></div><div class="field"><Label for="pc-launch-desc" required>Description</Label><Textarea id="pc-launch-desc" bind:value={launchDesc} rows={7} placeholder="Who is it for, and what does it do?" /></div></section>
							<section class="form-block" aria-labelledby="launch-interest-title"><div class="step-heading"><span class="step-number">03</span><h3 id="launch-interest-title">Waitlist</h3></div><div class="invitation-note"><span class="media-icon"><Rocket size={18} weight="Outline" aria-hidden="true" /></span><span><strong>Waitlist</strong><small>Backend signup connects later.</small></span><Chip variant="accent" size="xs">Planned</Chip></div></section>
							{#if editorError}<p class="editor-error" role="alert">{editorError}</p>{/if}<div class="editor-actions"><span class="action-note">Required: {launchRequiredDone}/5</span><div><Button type="button" variant="ghost" onclick={saveLaunchDraft}>Save draft</Button><Button type="submit" variant="primary" disabled={!launchReady}>Prepare launch page <ArrowRight size={14} weight="Outline" aria-hidden="true" /></Button></div></div>
						</form>
					</Card>
				</main>

				<aside class="inspector" aria-label="Launch inspector">
					<section class="inspector-section readiness-section"><div class="inspector-heading"><div><p class="section-kicker">Launch checks</p><h2>{launchReady ? 'Ready to review.' : 'Complete required fields.'}</h2></div><span class="check-count">{launchRequiredDone}/5</span></div><ul class="checklist">{#each launchChecks as item (item.label)}<li class:check-complete={item.done}><span class="check-mark">{#if item.done}<Check size={12} weight="Outline" aria-hidden="true" />{/if}</span><span><strong>{item.label}</strong></span></li>{/each}</ul></section>
					<section class="inspector-section preview-section"><div class="inspector-heading"><div><p class="section-kicker">Preview</p><h2>Launch page</h2></div></div><div class="launch-preview"><div class="launch-preview-top"><span class="launch-mark">{#if logoUrl}<img src={logoUrl} alt="" />{:else}<ImagePlus size={19} weight="Outline" aria-hidden="true" />{/if}</span><span class="preview-state"><span class="status-dot" aria-hidden="true"></span>Launching soon</span></div><h3>{productName.trim() || 'Your product'}</h3><p class="launch-tagline">{tagline.trim() || 'Your tagline'}</p><div class="launch-preview-meta"><span>{selectedCategory}</span>{#if launchDate}<span>Launches {new Date(launchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>{/if}</div><p class="launch-preview-description">{launchDesc.trim() || 'Your description'}</p></div></section>
				</aside>
			</div>
		{/if}
	</div>
</div>

<style>
	.studio-page { width: 100%; padding: 34px clamp(18px, 4vw, 58px) 80px; box-sizing: border-box; }
	.studio-shell { width: min(100%, 1180px); margin-inline: auto; }
	.studio-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 32px; padding-bottom: 28px; border-bottom: 1px solid rgba(251, 251, 251, .1); }
	.eyebrow, .section-kicker { margin: 0; color: var(--pc-accent-light); font-size: 10px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; }
	.header-copy h1 { max-width: 19ch; margin: 10px 0 0; color: var(--pc-text); font-size: clamp(32px, 4vw, 48px); font-weight: 500; line-height: 1.04; letter-spacing: -.06em; text-wrap: balance; }
	.header-copy > p:last-child { max-width: 54ch; margin: 14px 0 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.55; text-wrap: pretty; }
	.header-actions { display: flex; align-items: center; gap: 14px; padding-bottom: 2px; }
	.prototype-state, .preview-state { display: inline-flex; align-items: center; gap: 7px; color: var(--pc-text-faint); font-size: 11px; white-space: nowrap; }
	.status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--pc-accent-light); box-shadow: 0 0 0 3px rgba(198, 254, 30, .08); }
	:global(.studio-tabs) { padding: 22px 0 30px; }
	:global(.studio-tab-list) { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); width: min(100%, 560px); gap: 3px; padding: 4px; border-radius: 16px; background: var(--pc-surface-2); }
	:global(.studio-tab) { display: flex; align-items: center; gap: 10px; min-height: 54px; padding: 8px 12px; border: 0; border-radius: 12px; color: var(--pc-text-muted); background: transparent; text-align: start; outline: none; cursor: pointer; transition: background-color 150ms ease, color 150ms ease, transform 150ms ease; }
	:global(.studio-tab:hover) { color: var(--pc-text); }
	:global(.studio-tab:focus-visible) { box-shadow: 0 0 0 2px var(--pc-accent-light); }
	:global(.studio-tab[data-state='active']) { color: var(--pc-text); background: var(--pc-surface); box-shadow: 0 0 0 1px rgba(251, 251, 251, .08); }
	.tab-icon { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 auto; border-radius: 10px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .12); }
	:global(.studio-tab strong) { display: block; }
	:global(.studio-tab strong) { font-size: 12px; font-weight: 550; }
	.studio-grid { display: grid; grid-template-columns: minmax(0, 1.48fr) minmax(290px, .72fr); gap: clamp(30px, 5vw, 64px); align-items: start; }
	:global(.editor-surface) { min-width: 0; padding: clamp(22px, 3vw, 34px); border-radius: 22px; background: var(--pc-surface-2); box-shadow: inset 0 1px 0 rgba(251, 251, 251, .035); }
	.surface-heading, .inspector-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
	.surface-heading { padding-bottom: 25px; border-bottom: 1px solid rgba(251, 251, 251, .08); }
	.surface-heading h2 { max-width: 24ch; margin: 8px 0 0; color: var(--pc-text); font-size: 22px; font-weight: 500; line-height: 1.12; letter-spacing: -.04em; text-wrap: balance; }
	.editor-form { display: grid; gap: 0; }
	.status-message { display: grid; grid-template-columns: 30px minmax(0, 1fr); align-items: start; gap: 10px; margin: 22px 0 -1px; padding: 11px 12px; border-radius: 12px; color: var(--pc-text); background: rgba(119, 152, 18, .1); }
	.status-icon { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .18); }
	.status-message strong, .status-message small { display: block; }
	.status-message strong { font-size: 12px; font-weight: 550; }
	.status-message small { margin-top: 3px; color: var(--pc-text-muted); font-size: 11px; line-height: 1.45; }
	.form-block { padding: 28px 0; }
	.step-heading { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 11px; align-items: start; }
	.step-number { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 9px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .13); font-family: var(--font-family-mono, monospace); font-size: 10px; font-weight: 600; }
	.step-heading h3 { margin: 7px 0 0; color: var(--pc-text); font-size: 16px; font-weight: 550; letter-spacing: -.025em; }
	.field-stack { display: grid; gap: 17px; margin: 24px 0 0 41px; }
	.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 17px; }
	.audience-grid { margin: 24px 0 0 41px; }
	.field-stack > .field-grid:first-child { margin-top: 0; }
	.field { display: grid; gap: 8px; min-width: 0; }
	.field-note { display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 12px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .08); border-radius: 10px; }
	.field-note strong, .field-note small { display: block; }
	.field-note strong { color: var(--pc-text); font-size: 11px; font-weight: 550; }
	.field-note small { margin-top: 3px; color: var(--pc-text-muted); font-size: 10px; }
	.media-drop, .invitation-note { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; align-items: center; gap: 11px; margin: 24px 0 0 41px; padding: 13px; border: 1px dashed rgba(251, 251, 251, .18); border-radius: 13px; background: rgba(13, 13, 13, .2); }
	.media-drop:hover { border-color: rgba(198, 254, 30, .4); }
	.media-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .12); }
	.media-drop strong, .media-drop small, .invitation-note strong, .invitation-note small { display: block; }
	.media-drop strong, .invitation-note strong { color: var(--pc-text); font-size: 12px; font-weight: 550; }
	.media-drop small, .invitation-note small { margin-top: 3px; color: var(--pc-text-muted); font-size: 10px; line-height: 1.4; }
	.file-action { display: inline-flex; align-items: center; justify-content: center; min-height: 32px; padding: 0 11px; border-radius: 999px; color: var(--pc-text); background: var(--pc-surface); font-size: 11px; font-weight: 550; cursor: pointer; transition: background-color 150ms ease, transform 150ms ease; }
	.file-action:hover { background: var(--pc-border-strong); }
	.file-action:active { transform: scale(.96); }
	.invitation-note { margin-inline-start: 41px; border-style: solid; border-color: rgba(119, 152, 18, .22); background: rgba(119, 152, 18, .08); }
	.editor-error { margin: 0; color: var(--red-6); font-size: 12px; line-height: 1.45; }
	.editor-actions { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding-top: 24px; border-top: 1px solid rgba(251, 251, 251, .08); }
	.editor-actions > div { display: flex; align-items: center; gap: 8px; }
	.action-note { color: var(--pc-text-faint); font-size: 11px; }
	.inspector { position: sticky; top: calc(var(--pc-header-h) + 24px); min-width: 0; }
	.inspector-section { padding: 0 0 30px; }
	.inspector-section + .inspector-section { padding-top: 29px; border-top: 1px solid rgba(251, 251, 251, .1); }
	.inspector-heading h2 { max-width: 22ch; margin: 8px 0 0; color: var(--pc-text); font-size: 18px; font-weight: 500; line-height: 1.15; letter-spacing: -.035em; text-wrap: balance; }
	.check-count { color: var(--pc-accent-light); font-family: var(--font-family-mono, monospace); font-size: 12px; font-weight: 600; }
	.checklist { display: grid; gap: 17px; margin: 23px 0 0; padding: 0; list-style: none; }
	.checklist li { display: grid; grid-template-columns: 20px minmax(0, 1fr); align-items: start; gap: 9px; }
	.check-mark { display: grid; place-items: center; width: 20px; height: 20px; margin-top: 1px; border-radius: 7px; color: transparent; background: var(--pc-surface-2); box-shadow: 0 0 0 1px rgba(251, 251, 251, .1); }
	.check-complete .check-mark { color: var(--pc-bg); background: var(--pc-accent-light); box-shadow: none; }
	.checklist strong { display: block; }
	.checklist strong { color: var(--pc-text); font-size: 12px; font-weight: 550; }
	.preview-section .inspector-heading { align-items: end; }
	.preview-window, .launch-preview { margin-top: 18px; overflow: hidden; border-radius: 17px; background: var(--pc-surface-2); box-shadow: 0 0 0 1px rgba(251, 251, 251, .08), inset 0 1px 0 rgba(251, 251, 251, .03); }
	.preview-bar, .launch-preview-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; color: var(--pc-text-faint); font-size: 10px; }
	.preview-content { padding: 28px 20px 22px; background: var(--pc-surface); }
	.preview-type { color: var(--pc-accent-light); font-size: 9px; font-weight: 650; letter-spacing: .12em; text-transform: uppercase; }
	.preview-content h3, .launch-preview h3 { margin: 12px 0 0; color: var(--pc-text); font-size: 19px; font-weight: 500; line-height: 1.12; letter-spacing: -.04em; text-wrap: balance; }
	.preview-content p, .launch-preview-description { margin: 10px 0 0; color: var(--pc-text-muted); font-size: 11px; line-height: 1.55; }
	.preview-meta, .launch-preview-meta { display: flex; flex-wrap: wrap; gap: 7px 12px; margin-top: 20px; color: var(--pc-text-faint); font-size: 10px; }
	.preview-meta span + span, .launch-preview-meta span + span { padding-inline-start: 12px; border-inline-start: 1px solid rgba(251, 251, 251, .12); }
	.launch-preview { padding: 0 18px 20px; }
	.launch-mark { display: grid; place-items: center; width: 40px; height: 40px; overflow: hidden; border-radius: 12px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .12); }
	.launch-mark img { width: 100%; height: 100%; object-fit: cover; }
	.launch-preview h3 { margin-top: 19px; }
	.launch-tagline { margin: 6px 0 0; color: var(--pc-text-muted); font-size: 12px; }
	.launch-preview-meta { margin-top: 18px; }
	.launch-preview-description { padding-top: 17px; border-top: 1px solid rgba(251, 251, 251, .1); }
	@media (max-width: 940px) { .studio-grid { grid-template-columns: minmax(0, 1fr); }.inspector { position: static; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; }.inspector-section, .inspector-section + .inspector-section { padding: 0; border: 0; }.inspector-section + .inspector-section { border-inline-start: 1px solid rgba(251, 251, 251, .1); padding-inline-start: 28px; } }
	@media (max-width: 680px) { .studio-page { padding: 24px 16px 56px; }.studio-header { grid-template-columns: 1fr; gap: 18px; padding-bottom: 22px; }.header-copy h1 { max-width: 16ch; font-size: clamp(30px, 9vw, 42px); }.header-actions { justify-content: space-between; }:global(.studio-tabs) { padding: 18px 0 22px; }.studio-grid { gap: 34px; }.surface-heading h2 { font-size: 20px; }.field-grid { grid-template-columns: 1fr; gap: 17px; }.field-stack, .media-drop, .invitation-note { margin-inline-start: 0; }.editor-actions { align-items: stretch; flex-direction: column; }.editor-actions > div { justify-content: stretch; }.editor-actions > div :global(a), .editor-actions > div :global(button) { flex: 1; }.inspector { display: block; }.inspector-section + .inspector-section { margin-top: 29px; padding-top: 29px; border-top: 1px solid rgba(251, 251, 251, .1); border-inline-start: 0; padding-inline-start: 0; } }
	@media (prefers-reduced-motion: reduce) { :global(.studio-tab), .file-action { transition: none; } }
</style>
