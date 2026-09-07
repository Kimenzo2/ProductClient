<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Add,
		ArrowDown,
		ArrowUp,
		CheckCircle,
		CloseCircle,
		Copy,
		Download,
		Refresh,
		Search,
		Trash,
		Warning
	} from 'reicon-svelte';
	import { Button, Input, Label, Select, Textarea, Toggle } from '$lib/components/ui';
	import VocabEditor from './VocabEditor.svelte';
	import {
		RoadmapItemSchema,
		nowIso,
		roadmapDocSeed,
		validateRoadmapDoc,
		type RoadmapDoc
	} from '$lib/data/roadmapEditor';

	type Selection =
		| { area: 'site' }
		| { area: 'seo' }
		| { area: 'navigation' }
		| { area: 'copy' }
		| { area: 'stages' }
		| { area: 'confidence' }
		| { area: 'theme' }
		| { area: 'footer' }
		| { area: 'website' }
		| { area: 'chapter'; chapterId: string };

	type ItemDraft = {
		mode: 'create' | 'edit';
		chapterId: string;
		index: number;
		title: string;
		outcome: string;
		stage: string;
		confidence: string;
		themes: string;
		updatedAt: string;
		live: boolean;
		fieldErrors: Record<string, string>;
	};

	let publishing = $state(false);

	let doc = $state<RoadmapDoc>(structuredClone(roadmapDocSeed));
	let published = $state<RoadmapDoc>(structuredClone(roadmapDocSeed));
	let selection = $state<Selection>({ area: 'site' });
	let query = $state('');
	let notice = $state('');
	let dialog = $state<ItemDraft | null>(null);
	let dialogPanel = $state<HTMLElement | null>(null);
	let dialogTrigger = $state<HTMLElement | null>(null);
	let armedDelete = $state<string | null>(null);
	let armedTimer = $state<number | null>(null);

	let issues = $derived(validateRoadmapDoc(doc));
	let dirty = $derived(JSON.stringify(doc) !== JSON.stringify(published));
	let chapterCount = $derived(doc.chapters.length);
	let itemCount = $derived(doc.chapters.reduce((n, c) => n + c.items.length, 0));
	let normalizedQuery = $derived(query.trim().toLowerCase());
	let selectedChapterId = $derived(selection.area === 'chapter' ? selection.chapterId : null);
	let activeChapter = $derived(selectedChapterId ? (doc.chapters.find((c) => c.id === selectedChapterId) ?? null) : null);

	function humanizePath(path: string): string {
		const parts = path.split('.');
		const out: string[] = [];
		for (let i = 0; i < parts.length; i++) {
			if (parts[i] === 'chapters' && parts[i + 1] !== undefined) {
				const chapter = doc.chapters[Number(parts[i + 1])];
				out.push(chapter ? chapter.label : 'Chapter');
				i++;
			} else if (parts[i] === 'items' && parts[i + 1] !== undefined) {
				out.push('Item');
				i++;
			} else {
				out.push(parts[i].replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()));
			}
		}
		return out.join(' → ');
	}

	function issuesFor(prefix: string): number {
		if (prefix === 'chapters') return issues.filter((i) => i.path === 'chapters' || i.path.startsWith('chapters.')).length;
		return issues.filter((i) => i.path === prefix || i.path.startsWith(prefix + '.')).length;
	}

	function chapterIssues(id: string): number {
		const chapter = doc.chapters.find((c) => c.id === id);
		if (!chapter) return 0;
		const index = doc.chapters.indexOf(chapter);
		return issues.filter((i) => i.path === `chapters.${index}` || i.path.startsWith(`chapters.${index}.`)).length;
	}

	let visibleChapters = $derived(
		doc.chapters.filter((chapter) => {
			if (!normalizedQuery) return true;
			const haystack = [chapter.label, chapter.hint, ...chapter.items.flatMap((item) => [item.title, item.outcome, ...item.themes])].join(' ').toLowerCase();
			return haystack.includes(normalizedQuery);
		})
	);

	let stageOptions = $derived(Object.entries(doc.stages).map(([value, entry]) => ({ value, label: entry.label })));
	let confidenceOptions = $derived(Object.entries(doc.confidence).map(([value, entry]) => ({ value, label: entry.label })));
	let chapterOptions = $derived(doc.chapters.map((c) => ({ value: c.id, label: c.label })));

	const contentSections: { area: 'site' | 'seo' | 'navigation' | 'copy'; label: string }[] = [
		{ area: 'site', label: 'Brand' },
		{ area: 'seo', label: 'Search & sharing' },
		{ area: 'navigation', label: 'Menu' },
		{ area: 'copy', label: 'Words' }
	];

	const systemSections: { area: 'stages' | 'confidence' | 'theme' | 'footer' | 'website'; label: string }[] = [
		{ area: 'stages', label: 'Work stages' },
		{ area: 'confidence', label: 'Confidence levels' },
		{ area: 'theme', label: 'Appearance' },
		{ area: 'footer', label: 'Footer' },
		{ area: 'website', label: 'Website' }
	];

	function stageUsage(key: string): number {
		return doc.chapters.reduce((n, c) => n + c.items.filter((i) => i.stage === key).length, 0);
	}

	function confidenceUsage(key: string): number {
		return doc.chapters.reduce((n, c) => n + c.items.filter((i) => i.confidence === key).length, 0);
	}

	function select(selectionNext: Selection) {
		selection = selectionNext;
		notice = '';
	}

	function exportText(): string {
		return JSON.stringify(doc, null, '\t') + '\n';
	}

	function downloadBackup() {
		const blob = new Blob([exportText()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'roadmap-backup.json';
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
		notice = 'Backup downloaded. Keep it somewhere safe.';
	}

	async function copyBackup() {
		const text = exportText();
		const anchor = document.createElement('textarea');
		anchor.value = text;
		document.body.appendChild(anchor);
		anchor.select();
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			document.execCommand('copy');
		}
		anchor.remove();
		notice = 'Backup copied. Paste it anywhere you keep backups.';
	}

	function discardChanges() {
		doc = structuredClone(published);
		dialog = null;
		notice = 'Changes discarded. Showing the last published version.';
	}

	function resetDoc() {
		doc = structuredClone(roadmapDocSeed);
		published = structuredClone(roadmapDocSeed);
		selection = { area: 'site' };
		dialog = null;
		notice = 'Started over from the original sample content.';
	}

	async function publish() {
		if (issues.length > 0) {
			notice = `Fix ${issues.length === 1 ? 'the problem listed above' : `all ${issues.length} problems listed above`} before publishing.`;
			return;
		}
		if (!dirty) return;
		publishing = true;
		try {
			const response = await fetch('/api/roadmap/publish', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ doc })
			});
			const result = (await response.json().catch(() => null)) as { ok?: boolean; code?: string } | null;
			if (!response.ok || !result?.ok) {
				if (result?.code === 'NOT_CONFIGURED') {
					notice = 'Publishing is not switched on for your site yet. Your changes are safe — download a backup below.';
				} else {
					notice = 'Publishing failed. Nothing went live — try again in a moment.';
				}
				return;
			}
			published = structuredClone(doc);
			notice = 'Published. Your site rebuilds itself — live in about a minute.';
		} catch {
			notice = 'Could not reach the publishing service. Nothing went live — check your connection and try again.';
		} finally {
			publishing = false;
		}
	}

	function armDelete(key: string) {
		if (armedTimer) window.clearTimeout(armedTimer);
		if (armedDelete === key) {
			armedDelete = null;
			return false;
		}
		armedDelete = key;
		armedTimer = window.setTimeout(() => {
			armedDelete = null;
		}, 4000);
		return true;
	}

	function addChapter() {
		const base = `chapter-${doc.chapters.length + 1}`;
		let id = base;
		let suffix = 2;
		while (doc.chapters.some((c) => c.id === id)) id = `${base}-${suffix++}`;
		doc.chapters.push({ id, label: 'Untitled horizon', hint: '', items: [] });
		selection = { area: 'chapter', chapterId: id };
		notice = 'Chapter added. Give it a name and at least one item.';
	}

	function moveChapter(chapterId: string, direction: -1 | 1) {
		const index = doc.chapters.findIndex((c) => c.id === chapterId);
		const target = index + direction;
		if (index < 0 || target < 0 || target >= doc.chapters.length) return;
		const next = [...doc.chapters];
		[next[index], next[target]] = [next[target], next[index]];
		doc.chapters = next;
	}

	function deleteChapter(chapterId: string) {
		if (armDelete(`chapter:${chapterId}`)) {
			notice = 'Select delete again to confirm removing this chapter and its items.';
			return;
		}
		doc.chapters = doc.chapters.filter((c) => c.id !== chapterId);
		selection = { area: 'site' };
		notice = 'Chapter deleted.';
	}

	function openCreateItem(chapterId: string) {
		dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const firstStage = Object.keys(doc.stages)[0] ?? '';
		const firstConfidence = Object.keys(doc.confidence)[0] ?? '';
		dialog = { mode: 'create', chapterId, index: -1, title: '', outcome: '', stage: firstStage, confidence: firstConfidence, themes: '', updatedAt: nowIso(), live: false, fieldErrors: {} };
		requestAnimationFrame(() => dialogPanel?.querySelector<HTMLElement>('input, textarea, select, button')?.focus());
	}

	function openEditItem(chapterId: string, index: number) {
		const item = doc.chapters.find((c) => c.id === chapterId)?.items[index];
		if (!item) return;
		dialogTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialog = { mode: 'edit', chapterId, index, title: item.title, outcome: item.outcome, stage: item.stage, confidence: item.confidence, themes: item.themes.join(', '), updatedAt: item.updatedAt, live: item.live ?? false, fieldErrors: {} };
		requestAnimationFrame(() => dialogPanel?.querySelector<HTMLElement>('input, textarea, select, button')?.focus());
	}

	function closeDialog() {
		dialog = null;
		armedDelete = null;
		requestAnimationFrame(() => dialogTrigger?.focus());
	}

	function saveDialogItem() {
		const d = dialog;
		if (!d) return;
		const candidate = {
			stage: d.stage,
			title: d.title.trim(),
			outcome: d.outcome.trim(),
			themes: d.themes.split(',').map((t) => t.trim()).filter(Boolean),
			confidence: d.confidence,
			updatedAt: d.updatedAt.trim() || nowIso(),
			live: d.live || undefined
		};
		const parsed = RoadmapItemSchema.safeParse(candidate);
		if (!parsed.success) {
			const errors: Record<string, string> = {};
			for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? 'form')] = issue.message;
			d.fieldErrors = errors;
			return;
		}
		const chapter = doc.chapters.find((c) => c.id === d.chapterId);
		if (!chapter) return;
		if (d.mode === 'create') {
			chapter.items.push(parsed.data);
			notice = `Item added to ${chapter.label}.`;
		} else {
			chapter.items[d.index] = parsed.data;
			notice = 'Item saved. Timestamp stamped to now.';
		}
		closeDialog();
	}

	function deleteDialogItem() {
		const d = dialog;
		if (!d || d.mode !== 'edit') return;
		if (armDelete(`item:${d.chapterId}:${d.index}`)) {
			notice = 'Select delete again to confirm removing this item.';
			return;
		}
		const chapter = doc.chapters.find((c) => c.id === d.chapterId);
		if (chapter) chapter.items = chapter.items.filter((_, i) => i !== d.index);
		notice = 'Item deleted.';
		closeDialog();
	}

	function addVocab(kind: 'stages' | 'confidence', key: string, label: string): boolean {
		const cleanKey = key.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-');
		if (!cleanKey || !label.trim()) {
			notice = 'Give the entry both a key and a label.';
			return false;
		}
		if (doc[kind][cleanKey]) {
			notice = 'That key already exists.';
			return false;
		}
		doc[kind][cleanKey] = { label: label.trim() };
		notice = 'Entry added.';
		return true;
	}

	function removeVocab(kind: 'stages' | 'confidence', key: string) {
		const used = kind === 'stages' ? stageUsage(key) : confidenceUsage(key);
		if (used > 0) {
			notice = `In use by ${used} ${used === 1 ? 'item' : 'items'}. Reassign them first.`;
			return;
		}
		if (armDelete(`${kind}:${key}`)) {
			notice = 'Select delete again to confirm.';
			return;
		}
		const next = { ...doc[kind] };
		delete next[key];
		doc[kind] = next;
		notice = 'Entry removed.';
	}

	function addFooterLink() {
		doc.footer.links.push({ label: 'New link', href: '/' });
	}

	function removeFooterLink(index: number) {
		doc.footer.links = doc.footer.links.filter((_, i) => i !== index);
	}

	onMount(() => {
		const handleDialogKeydown = (event: KeyboardEvent) => {
			if (!dialog) return;
			if (event.key === 'Escape') {
				event.preventDefault();
				closeDialog();
				return;
			}
			if (event.key !== 'Tab' || !dialogPanel) return;
			const focusable = Array.from(dialogPanel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
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
</script>

<svelte:head>
	<title>Roadmap editor | Product Client</title>
	<meta name="description" content="Edit your public roadmap and publish it live." />
</svelte:head>

<div class="briefing-page" inert={dialog ? true : undefined}>
	<header class="page-header">
		<div>
			<h1>Roadmap editor</h1>
			<p class="lede">Shape what your customers see on your public roadmap. Nothing goes live until you publish.</p>
		</div>
		<div class="briefing-summary" aria-label="Editor summary">
			<span><strong>{chapterCount}</strong> chapters</span>
			<span><strong>{itemCount}</strong> items</span>
			{#if issues.length > 0}
				<span class="validity invalid">{issues.length} to fix</span>
			{:else if dirty}
				<span class="validity pending">Unpublished changes</span>
			{:else}
				<span class="validity valid">Published</span>
			{/if}
		</div>
	</header>

	<div class="toolbar">
		<div class="search-field">
			<Search size={15} weight="Outline" aria-hidden="true" />
			<label for="roadmap-editor-search" class="sr-only">Search chapters and items</label>
			<Input id="roadmap-editor-search" bind:value={query} placeholder="Search chapters or items" />
		</div>
		<div class="toolbar-actions">
			<Button variant="outline" size="md" onclick={copyBackup}><Copy size={15} weight="Outline" aria-hidden="true" />Copy backup</Button>
			<Button variant="primary" size="md" disabled={!dirty || issues.length > 0 || publishing} loading={publishing} onclick={publish}><CheckCircle size={15} weight="Outline" aria-hidden="true" />{publishing ? 'Publishing' : 'Publish'}</Button>
		</div>
		{#if dirty}
			<button type="button" class="reset-button" onclick={discardChanges}>Discard changes</button>
		{:else}
			<button type="button" class="reset-button" onclick={resetDoc}><Refresh size={13} weight="Outline" aria-hidden="true" />Start over</button>
		{/if}
	</div>

	{#if notice}<p class="save-notice" role="status" aria-live="polite">{notice}</p>{/if}

	{#if issues.length > 0}
		<section class="issues-surface" aria-label="Things to fix before publishing">
			<ul>
				{#each issues as issue}
					<li><Warning size={13} weight="Outline" aria-hidden="true" /><span><strong>{humanizePath(issue.path)}</strong> — {issue.message}</span></li>
				{/each}
			</ul>
		</section>
	{/if}

	<div class="briefing-layout">
		<section class="queue-surface" aria-label="Roadmap outline">
			<div class="surface-heading"><div><h2>What you can change</h2></div></div>
			<div class="queue-list">
				{#each contentSections as entry}
					{@const key = entry.area}
					<button type="button" class="queue-row" class:active={selection.area === key} aria-pressed={selection.area === key} onclick={() => select({ area: key })}>
						<span class="queue-copy"><strong>{entry.label}</strong></span>
						{#if issuesFor(key) > 0}<span class="issue-dot" aria-label="{issuesFor(key)} problems">{issuesFor(key)}</span>{/if}
					</button>
				{/each}
				<div class="queue-group-label" aria-hidden="true">Chapters</div>
				{#each visibleChapters as chapter (chapter.id)}
					<button type="button" class="queue-row" class:active={selectedChapterId === chapter.id} aria-pressed={selectedChapterId === chapter.id} onclick={() => select({ area: 'chapter', chapterId: chapter.id })}>
						<span class="queue-copy"><strong>{chapter.label}</strong><small>{chapter.items.length} items</small></span>
						{#if chapterIssues(chapter.id) > 0}<span class="issue-dot" aria-label="{chapterIssues(chapter.id)} problems">{chapterIssues(chapter.id)}</span>{/if}
					</button>
				{/each}
				{#if visibleChapters.length === 0}
					<p class="queue-empty">No chapters match “{query}”. <button type="button" class="quiet-action" onclick={() => (query = '')}>Clear search</button></p>
				{/if}
				<button type="button" class="queue-row add-row" onclick={addChapter}><Add size={14} weight="Outline" aria-hidden="true" /><span>Add chapter</span></button>
				<div class="queue-group-label" aria-hidden="true">System</div>
				{#each systemSections as entry}
					{@const key = entry.area}
					<button type="button" class="queue-row" class:active={selection.area === key} aria-pressed={selection.area === key} onclick={() => select({ area: key })}>
						<span class="queue-copy"><strong>{entry.label}</strong></span>
						{#if issuesFor(key) > 0}<span class="issue-dot" aria-label="{issuesFor(key)} problems">{issuesFor(key)}</span>{/if}
					</button>
				{/each}
			</div>
		</section>

		<section class="detail-surface" aria-label="Section editor">
			{#if selection.area === 'site'}
				{@const site = doc.site}
				<div class="surface-heading"><div><h2>Brand</h2></div></div>
				<div class="form-grid">
					<div class="field"><Label for="ed-site-name" required>Product name</Label><Input id="ed-site-name" bind:value={site.name} /></div>
					<div class="field"><Label for="ed-site-tagline" required>Tagline</Label><Input id="ed-site-tagline" bind:value={site.tagline} /></div>
					<div class="field field-wide"><Label for="ed-site-description" required>Short description</Label><Textarea id="ed-site-description" rows={3} bind:value={site.description} /></div>
					<div class="field"><Label for="ed-site-url" required>Website address</Label><Input id="ed-site-url" bind:value={site.url} placeholder="https://roadmap.example.com" /></div>
					<div class="field"><Label for="ed-site-locale" required>Language</Label><Input id="ed-site-locale" bind:value={site.locale} placeholder="en-US" /></div>
					<div class="field"><Label for="ed-site-logo-src" required>Logo image</Label><Input id="ed-site-logo-src" bind:value={site.logo.src} /></div>
					<div class="field"><Label for="ed-site-logo-alt" required>Logo description</Label><Input id="ed-site-logo-alt" bind:value={site.logo.alt} /></div>
					<div class="field"><Label for="ed-site-icon" required>App icon</Label><Input id="ed-site-icon" bind:value={site.icon} /></div>
					<div class="field"><Label for="ed-site-favicon" required>Browser tab icon</Label><Input id="ed-site-favicon" bind:value={site.favicon} /></div>
				</div>
			{:else if selection.area === 'seo'}
				{@const seo = doc.seo}
				<div class="surface-heading"><div><h2>Search & sharing</h2></div></div>
				<div class="form-grid">
					<div class="field field-wide"><Label for="ed-seo-template" required>Page title pattern</Label><Input id="ed-seo-template" bind:value={seo.titleTemplate} placeholder="&#123;title} · &#123;site} Roadmap" /></div>
					<div class="field"><Label for="ed-seo-title" required>Main title</Label><Input id="ed-seo-title" bind:value={seo.defaultTitle} /></div>
					<div class="field"><Label for="ed-seo-color" required>Browser theme color</Label><Input id="ed-seo-color" bind:value={seo.themeColor} placeholder="#101010" /></div>
					<div class="field field-wide"><Label for="ed-seo-description" required>Search description</Label><Textarea id="ed-seo-description" rows={3} bind:value={seo.description} /></div>
					<div class="field"><Label for="ed-seo-og" required>Share image</Label><Input id="ed-seo-og" bind:value={seo.ogImage} /></div>
				</div>
				<p class="section-note">In the title pattern, &#123;title} becomes the page name and &#123;site} becomes your product name.</p>
			{:else if selection.area === 'navigation'}
				{@const nav = doc.navigation}
				<div class="surface-heading"><div><h2>Menu</h2></div></div>
				<div class="form-grid">
					<div class="field"><Label for="ed-nav-aria" required>Menu description for screen readers</Label><Input id="ed-nav-aria" bind:value={nav.ariaLabel} /></div>
					<div class="field"><Label for="ed-nav-all" required>“Show everything” label</Label><Input id="ed-nav-all" bind:value={nav.allLabel} /></div>
					<div class="field"><Label for="ed-nav-sep" required>Count separator</Label><Input id="ed-nav-sep" bind:value={nav.countSeparator} /></div>
					<div class="field check-field"><Label for="ed-nav-counts">Show item counts</Label><Toggle id="ed-nav-counts" bind:pressed={nav.showCounts}>Show item counts</Toggle></div>
				</div>
			{:else if selection.area === 'copy'}
				{@const copy = doc.copy}
				<div class="surface-heading"><div><h2>Words</h2></div></div>
				<div class="form-grid">
					<div class="field field-wide"><Label for="ed-copy-hero" required>Intro under your product name</Label><Textarea id="ed-copy-hero" rows={2} bind:value={copy.heroSubtitle} /></div>
					<div class="field field-wide"><Label for="ed-copy-suffix" required>Note under each chapter</Label><Textarea id="ed-copy-suffix" rows={2} bind:value={copy.chapterSuffix} /></div>
					<div class="field"><Label for="ed-copy-skip" required>Skip link text</Label><Input id="ed-copy-skip" bind:value={copy.skipLink} /></div>
					<div class="field"><Label for="ed-copy-empty-title" required>Empty chapter title</Label><Input id="ed-copy-empty-title" bind:value={copy.emptyChapterTitle} /></div>
					<div class="field field-wide"><Label for="ed-copy-empty-summary" required>Empty chapter text</Label><Textarea id="ed-copy-empty-summary" rows={2} bind:value={copy.emptyChapterSummary} /></div>
				</div>
			{:else if selection.area === 'stages'}
				<div class="surface-heading"><div><h2>Work stages</h2></div><span>{Object.keys(doc.stages).length} entries</span></div>
				<p class="section-note">The status words items can carry, like Building or Idea. Customers see the labels.</p>
				<VocabEditor kind="stages" entries={doc.stages} usage={stageUsage} onAdd={addVocab} onRemove={removeVocab} armedKey={armedDelete} />
			{:else if selection.area === 'confidence'}
				<div class="surface-heading"><div><h2>Confidence levels</h2></div><span>{Object.keys(doc.confidence).length} entries</span></div>
				<p class="section-note">How sure you are, in plain words. Shown under every item instead of dates.</p>
				<VocabEditor kind="confidence" entries={doc.confidence} usage={confidenceUsage} onAdd={addVocab} onRemove={removeVocab} armedKey={armedDelete} />
			{:else if selection.area === 'theme'}
				{@const theme = doc.theme}
				<div class="surface-heading"><div><h2>Appearance</h2></div></div>
				<div class="form-grid">
					<div class="field field-wide"><Label for="ed-font-sans" required>Body font</Label><Input id="ed-font-sans" bind:value={theme.fonts.sans} /></div>
					<div class="field field-wide"><Label for="ed-font-display" required>Headline font</Label><Input id="ed-font-display" bind:value={theme.fonts.display} /></div>
					<div class="field"><Label for="ed-accent-hue" required>Accent color wheel position</Label><Input id="ed-accent-hue" type="number" value={String(theme.accent.hue)} oninput={(e: Event) => { const v = (e.currentTarget as HTMLInputElement).valueAsNumber; theme.accent.hue = Number.isNaN(v) ? 0 : v; }} /></div>
					<div class="field"><Label for="ed-accent-300" required>Light accent</Label><Input id="ed-accent-300" bind:value={theme.accent.colors['300']} /></div>
					<div class="field"><Label for="ed-accent-500" required>Main accent</Label><Input id="ed-accent-500" bind:value={theme.accent.colors['500']} /></div>
					<div class="field"><Label for="ed-accent-700" required>Deep accent</Label><Input id="ed-accent-700" bind:value={theme.accent.colors['700']} /></div>
					<div class="field field-wide"><Label for="ed-glow" required>Glow effect</Label><Input id="ed-glow" bind:value={theme.glow} /></div>
					<div class="field">
						<span class="field-label" id="ed-orientation-label">Timeline direction</span>
						<div class="segmented" role="group" aria-labelledby="ed-orientation-label">
							<button type="button" class:active={theme.timeline.orientation === 'vertical'} aria-pressed={theme.timeline.orientation === 'vertical'} onclick={() => (theme.timeline.orientation = 'vertical')}>Vertical</button>
							<button type="button" class:active={theme.timeline.orientation === 'horizontal'} aria-pressed={theme.timeline.orientation === 'horizontal'} onclick={() => (theme.timeline.orientation = 'horizontal')}>Horizontal</button>
						</div>
					</div>
					<div class="field"><Label for="ed-rail" required>Timeline gutter width</Label><Input id="ed-rail" bind:value={theme.timeline.rail} /></div>
					<div class="field check-field"><Label for="ed-live-glow">Glow on live items</Label><Toggle id="ed-live-glow" bind:pressed={theme.timeline.liveGlow}>Glow on live items</Toggle></div>
					<div class="field"><Label for="ed-rise" required>Card entrance</Label><Input id="ed-rise" bind:value={theme.motion.rise} /></div>
					<div class="field"><Label for="ed-fade" required>Fade entrance</Label><Input id="ed-fade" bind:value={theme.motion.fade} /></div>
					<div class="field"><Label for="ed-stagger-chapter" required>Delay per chapter (ms)</Label><Input id="ed-stagger-chapter" type="number" value={String(theme.motion.stagger.perChapter)} oninput={(e: Event) => { const v = (e.currentTarget as HTMLInputElement).valueAsNumber; theme.motion.stagger.perChapter = Number.isNaN(v) ? 0 : v; }} /></div>
					<div class="field"><Label for="ed-stagger-item" required>Delay per item (ms)</Label><Input id="ed-stagger-item" type="number" value={String(theme.motion.stagger.perItem)} oninput={(e: Event) => { const v = (e.currentTarget as HTMLInputElement).valueAsNumber; theme.motion.stagger.perItem = Number.isNaN(v) ? 0 : v; }} /></div>
					<div class="field"><Label for="ed-stagger-max" required>Max delay (ms)</Label><Input id="ed-stagger-max" type="number" value={String(theme.motion.stagger.max)} oninput={(e: Event) => { const v = (e.currentTarget as HTMLInputElement).valueAsNumber; theme.motion.stagger.max = Number.isNaN(v) ? 0 : v; }} /></div>
				</div>
			{:else if selection.area === 'footer'}
				{@const footer = doc.footer}
				<div class="surface-heading"><div><h2>Footer</h2></div></div>
				<div class="form-grid">
					<div class="field field-wide"><Label for="ed-footer-description" required>Footer line</Label><Textarea id="ed-footer-description" rows={2} bind:value={footer.description} /></div>
					<div class="field field-wide"><Label for="ed-footer-bottom" required>Bottom line</Label><Input id="ed-footer-bottom" bind:value={footer.bottomTemplate} placeholder="© &#123;year} &#123;site}." /></div>
				</div>
				<p class="section-note">You can use &#123;site} for your product name and &#123;year} for the year.</p>
				<div class="link-list">
					{#each footer.links as link, i}
						<div class="link-row">
							<div class="field"><Label for={`ed-footer-link-label-${i}`} required>Label</Label><Input id={`ed-footer-link-label-${i}`} bind:value={link.label} /></div>
							<div class="field"><Label for={`ed-footer-link-href-${i}`} required>Link address</Label><Input id={`ed-footer-link-href-${i}`} bind:value={link.href} /></div>
							<button type="button" class="icon-button" aria-label={`Remove footer link ${link.label}`} onclick={() => removeFooterLink(i)}><Trash size={15} weight="Outline" aria-hidden="true" /></button>
						</div>
					{/each}
					<button type="button" class="quiet-action" onclick={addFooterLink}><Add size={13} weight="Outline" aria-hidden="true" />Add footer link</button>
				</div>
			{:else if selection.area === 'website'}
				<div class="surface-heading"><div><h2>Website</h2></div></div>
				<div class="form-grid">
					<div class="field field-wide"><Label for="ed-tenant-domain" required>Your roadmap address</Label><Input id="ed-tenant-domain" bind:value={doc.tenant.domain} placeholder="roadmap.example.com" /></div>
				</div>
				<p class="section-note">The address customers visit. This is set when your site is created and rarely changes after that.</p>
			{:else if selection.area === 'chapter'}
				{#if activeChapter}
					{@const chapter = activeChapter}
					{@const chapterIndex = doc.chapters.indexOf(chapter)}
					<div class="surface-heading">
						<div><h2>{chapter.label || 'Untitled chapter'}</h2></div>
						<div class="heading-actions">
							<button type="button" class="icon-button" aria-label="Move chapter up" disabled={chapterIndex === 0} onclick={() => moveChapter(chapter.id, -1)}><ArrowUp size={15} weight="Outline" aria-hidden="true" /></button>
							<button type="button" class="icon-button" aria-label="Move chapter down" disabled={chapterIndex === doc.chapters.length - 1} onclick={() => moveChapter(chapter.id, 1)}><ArrowDown size={15} weight="Outline" aria-hidden="true" /></button>
							<button type="button" class="icon-button danger" aria-label={armedDelete === `chapter:${chapter.id}` ? 'Confirm delete chapter' : `Delete chapter ${chapter.label}`} onclick={() => deleteChapter(chapter.id)}><Trash size={15} weight="Outline" aria-hidden="true" /></button>
						</div>
					</div>
					<div class="form-grid">
						<div class="field"><Label for="ed-chapter-id" required>Address name</Label><Input id="ed-chapter-id" bind:value={chapter.id} placeholder="lowercase-words" /></div>
						<div class="field"><Label for="ed-chapter-label" required>Chapter name</Label><Input id="ed-chapter-label" bind:value={chapter.label} /></div>
						<div class="field field-wide"><Label for="ed-chapter-hint" required>Chapter hint</Label><Input id="ed-chapter-hint" bind:value={chapter.hint} /></div>
					</div>
					<p class="section-note">The address name becomes part of the web address, like /{chapter.id || 'your-name'}.</p>
					<div class="item-list-heading"><h3>Items · {chapter.items.length}</h3><button type="button" class="quiet-action" onclick={() => openCreateItem(chapter.id)}><Add size={13} weight="Outline" aria-hidden="true" />Add item</button></div>
					<div class="item-list">
						{#each chapter.items as item, ii}
							<button type="button" class="item-row" onclick={() => openEditItem(chapter.id, ii)}>
								<span class="item-copy"><strong>{item.title || 'Untitled item'}</strong><small>{item.stage} · {item.confidence} · {item.themes.join(', ')}</small></span>
								{#if item.live}<span class="live-dot" aria-label="Live">Live</span>{/if}
							</button>
						{/each}
						{#if chapter.items.length === 0}
							<p class="queue-empty">No items yet. <button type="button" class="quiet-action" onclick={() => openCreateItem(chapter.id)}>Add the first item</button></p>
						{/if}
					</div>
				{:else}
					<div class="surface-heading"><div><h2>Missing chapter</h2></div></div>
					<p class="section-note">This chapter was removed. Pick another section from the outline.</p>
				{/if}
			{/if}
		</section>
	</div>
</div>

{#if dialog}
	{@const d = dialog}
	<button type="button" class="editor-backdrop" aria-label="Close item editor" onclick={closeDialog}></button>
	<div class="item-editor" bind:this={dialogPanel} role="dialog" aria-modal="true" aria-labelledby="item-editor-title">
		<div class="editor-header">
			<div>
				<h3 id="item-editor-title">{d.mode === 'create' ? 'Add item' : d.title || 'Edit item'}</h3>
			</div>
			<button type="button" class="editor-close" aria-label="Close item editor" onclick={closeDialog}><CloseCircle size={18} weight="Outline" aria-hidden="true" /></button>
		</div>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				saveDialogItem();
			}}
		>
			<div class="field"><Label for="ed-item-title" required>Title</Label><Input id="ed-item-title" bind:value={d.title} placeholder="What will customers be able to do?" invalid={Boolean(d.fieldErrors.title)} aria-describedby={d.fieldErrors.title ? 'ed-item-title-error' : undefined} />{#if d.fieldErrors.title}<p id="ed-item-title-error" class="field-error" role="alert">{d.fieldErrors.title}</p>{/if}</div>
			<div class="field"><Label for="ed-item-outcome" required>What changes for them</Label><Textarea id="ed-item-outcome" rows={3} bind:value={d.outcome} placeholder="One or two sentences a non-technical customer understands." invalid={Boolean(d.fieldErrors.outcome)} aria-describedby={d.fieldErrors.outcome ? 'ed-item-outcome-error' : undefined} />{#if d.fieldErrors.outcome}<p id="ed-item-outcome-error" class="field-error" role="alert">{d.fieldErrors.outcome}</p>{/if}</div>
			<div class="form-grid-dialog">
				<div class="field"><Label for="ed-item-stage" required>Work stage</Label><Select id="ed-item-stage" bind:value={d.stage} options={stageOptions} invalid={Boolean(d.fieldErrors.stage)} />{#if d.fieldErrors.stage}<p class="field-error" role="alert">{d.fieldErrors.stage}</p>{/if}</div>
				<div class="field"><Label for="ed-item-confidence" required>Confidence</Label><Select id="ed-item-confidence" bind:value={d.confidence} options={confidenceOptions} invalid={Boolean(d.fieldErrors.confidence)} />{#if d.fieldErrors.confidence}<p class="field-error" role="alert">{d.fieldErrors.confidence}</p>{/if}</div>
			</div>
			<div class="field"><Label for="ed-item-themes" required>Topics, separated by commas</Label><Input id="ed-item-themes" bind:value={d.themes} placeholder="Mobile, Sharing" invalid={Boolean(d.fieldErrors.themes)} aria-describedby={d.fieldErrors.themes ? 'ed-item-themes-error' : undefined} />{#if d.fieldErrors.themes}<p id="ed-item-themes-error" class="field-error" role="alert">{d.fieldErrors.themes}</p>{/if}</div>
			<div class="form-grid-dialog">
				<div class="field"><Label for="ed-item-chapter" required>Chapter</Label><Select id="ed-item-chapter" bind:value={d.chapterId} options={chapterOptions} /></div>
				<div class="field"><Label for="ed-item-updated" required>Last updated</Label><Input id="ed-item-updated" bind:value={d.updatedAt} placeholder="2026-09-07T10:00:00Z" invalid={Boolean(d.fieldErrors.updatedAt)} aria-describedby={d.fieldErrors.updatedAt ? 'ed-item-updated-error' : undefined} />{#if d.fieldErrors.updatedAt}<p id="ed-item-updated-error" class="field-error" role="alert">{d.fieldErrors.updatedAt}</p>{/if}</div>
			</div>
			<div class="dialog-row">
				<Toggle bind:pressed={d.live}>Highlight as live</Toggle>
				<button type="button" class="quiet-action" onclick={() => (d.updatedAt = nowIso())}>Set to now</button>
			</div>
			{#if d.fieldErrors.form}<p class="field-error" role="alert">{d.fieldErrors.form}</p>{/if}
			<div class="editor-actions">
				<Button type="submit" variant="primary" size="md"><CheckCircle size={15} weight="Outline" aria-hidden="true" />{d.mode === 'create' ? 'Add item' : 'Save changes'}</Button>
				{#if d.mode === 'edit'}
					<button type="button" class="quiet-action danger-text" onclick={deleteDialogItem}>{armedDelete === `item:${d.chapterId}:${d.index}` ? 'Confirm delete' : 'Delete item'}</button>
				{/if}
				<button type="button" class="quiet-action" onclick={closeDialog}>Cancel</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.briefing-page { width: min(100% - 32px, 1160px); margin: 0 auto; padding: 44px 0 72px; }
	.page-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; padding-bottom: 30px; border-bottom: 1px solid var(--pc-border-strong); }
	h1, h2, h3, p { margin-top: 0; }
	h1 { margin-bottom: 0; font-size: clamp(30px, 4vw, 44px); font-weight: 500; letter-spacing: -.05em; line-height: 1.05; }
	.lede { max-width: 62ch; margin: 12px 0 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.6; }
	.briefing-summary { display: flex; align-items: center; gap: 16px; color: var(--pc-text-muted); font-size: 12px; white-space: nowrap; }
	.briefing-summary span + span { padding-inline-start: 16px; border-inline-start: 1px solid var(--pc-border-strong); }
	.briefing-summary strong { margin-inline-end: 4px; color: var(--pc-text); font-size: 18px; font-weight: 500; letter-spacing: -.04em; }
	.validity { font-weight: 600; }
	.validity.valid { color: var(--pc-status-operational); }
	.validity.invalid { color: var(--pc-status-degraded); }
	.validity.pending { color: var(--pc-text); }
	.toolbar { display: flex; align-items: center; gap: 12px; padding: 20px 0 14px; }
	.search-field { display: flex; align-items: center; width: min(100%, 330px); min-height: 38px; gap: 9px; padding-inline-start: 11px; border-radius: 10px; color: var(--pc-text-faint); background: var(--pc-surface-2); }
	.search-field :global(input) { min-height: 38px; padding-inline-start: 0; border: 0; background: transparent; }
	.toolbar-actions { display: flex; align-items: center; gap: 8px; }
	.reset-button { min-height: 34px; flex: 0 0 auto; margin-inline-start: auto; padding: 0 11px; border: 0; border-radius: 999px; color: var(--pc-text-faint); background: transparent; font: inherit; font-size: 11px; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; display: inline-flex; align-items: center; gap: 6px; }
	.reset-button:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.save-notice { margin: 0 0 10px; color: var(--pc-status-operational); font-size: 11px; }
	.issues-surface { margin: 0 0 18px; padding: 18px 22px; border: 1px solid var(--pc-border-strong); border-radius: 18px; background: var(--pc-bg); }
	.issues-surface ul { display: grid; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
	.issues-surface li { display: flex; align-items: start; gap: 8px; color: var(--pc-text-muted); font-size: 12px; }
	.issues-surface strong { color: var(--pc-text); font-weight: 500; }
	.briefing-layout { display: grid; grid-template-columns: minmax(280px, .9fr) minmax(0, 1.1fr); align-items: start; gap: 18px; }
	.queue-surface, .detail-surface { min-width: 0; border: 1px solid var(--pc-border-strong); border-radius: 18px; background: var(--pc-bg); }
	.detail-surface { padding: 22px; }
	.surface-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; padding: 22px 22px 18px; border-bottom: 1px solid var(--pc-border-strong); }
	.detail-surface .surface-heading { margin: -22px -22px 18px; }
	.surface-heading h2 { margin-bottom: 0; font-size: 20px; font-weight: 500; letter-spacing: -.04em; }
	.surface-heading > span { color: var(--pc-text-faint); font-size: 11px; }
	.heading-actions { display: flex; gap: 6px; }
	.queue-list { padding: 12px; }
	.queue-group-label { padding: 14px 10px 6px; color: var(--pc-text-faint); font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
	.queue-row { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 10px 12px; border: 0; border-radius: 12px; color: var(--pc-text); background: transparent; font: inherit; text-align: start; cursor: pointer; transition: background-color 120ms ease; }
	.queue-row:hover, .queue-row.active { background: var(--pc-surface-2); }
	.queue-copy { display: grid; min-width: 0; gap: 2px; flex: 1; }
	.queue-copy strong { overflow: hidden; font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.queue-copy small { color: var(--pc-text-faint); font-size: 11px; }
	.queue-row.add-row { color: var(--pc-text-muted); }
	.issue-dot { display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; color: var(--pc-status-degraded); background: color-mix(in oklch, var(--pc-status-degraded) 14%, transparent); font-size: 11px; font-weight: 600; }
	.queue-empty { padding: 8px 12px 14px; color: var(--pc-text-faint); font-size: 12px; }
	.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 4px 0 0; }
	.form-grid-dialog { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
	.field { display: grid; gap: 8px; align-content: start; }
	.field-wide { grid-column: 1 / -1; }
	.field-error { margin: 0; color: var(--pc-status-degraded); font-size: 11px; }
	.field-label { display: block; font-size: 13px; font-weight: 500; color: var(--pc-text); }
	.segmented { display: flex; align-items: center; gap: 3px; }
	.segmented button { min-height: 34px; flex: 0 0 auto; padding: 0 14px; border: 0; border-radius: 999px; color: var(--pc-text-muted); background: transparent; font: inherit; font-size: 11px; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
	.segmented button:hover, .segmented button.active { color: var(--pc-text); background: var(--pc-surface-2); }
	.segmented button:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.check-field { align-content: start; }
	.section-note { max-width: 62ch; margin: 16px 0 0; color: var(--pc-text-muted); font-size: 12px; line-height: 1.55; }
	.link-list { display: grid; gap: 14px; margin-top: 18px; }
	.link-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 40px; align-items: end; gap: 12px; }
	.icon-button { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 50%; color: var(--pc-text-muted); background: transparent; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
	.icon-button:hover:not(:disabled) { color: var(--pc-text); background: var(--pc-surface-2); }
	.icon-button:disabled { opacity: .35; cursor: not-allowed; }
	.icon-button.danger:hover:not(:disabled) { color: var(--pc-status-degraded); }
	.icon-button:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.quiet-action { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: transparent; color: var(--pc-text-muted); font: inherit; font-size: 11px; cursor: pointer; }
	.quiet-action:hover { color: var(--pc-text); }
	.quiet-action:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	.quiet-action.danger-text:hover { color: var(--pc-status-degraded); }
	.item-list-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 22px 0 10px; }
	.item-list-heading h3 { margin: 0; font-size: 15px; font-weight: 500; letter-spacing: -.02em; }
	.item-list { display: grid; gap: 8px; }
	.item-row { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 52px; padding: 10px 14px; border: 1px solid var(--pc-border-strong); border-radius: 14px; color: var(--pc-text); background: transparent; font: inherit; text-align: start; cursor: pointer; transition: background-color 120ms ease, border-color 120ms ease; }
	.item-row:hover { background: var(--pc-surface-2); }
	.item-copy { display: grid; min-width: 0; gap: 2px; flex: 1; }
	.item-copy strong { overflow: hidden; font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.item-copy small { overflow: hidden; color: var(--pc-text-faint); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
	.live-dot { flex: 0 0 auto; padding: 3px 9px; border-radius: 999px; color: var(--pc-status-operational); background: color-mix(in oklch, var(--pc-status-operational) 14%, transparent); font-size: 10px; font-weight: 600; }
	.editor-backdrop { position: fixed; z-index: 60; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; background: rgb(7 7 7 / .44); cursor: default; }
	.item-editor { position: fixed; z-index: 61; inset-block: 0; inset-inline-end: 0; display: flex; flex-direction: column; width: min(520px, calc(100vw - 16px)); max-width: 100%; block-size: 100dvh; overflow-y: auto; overscroll-behavior: contain; padding: 32px 32px max(28px, env(safe-area-inset-bottom)); border: 1px solid var(--pc-border-strong); border-inline-end: 0; border-start-start-radius: 26px; border-end-start-radius: 26px; color: var(--pc-text); background: var(--pc-surface-raised); }
	.editor-header { display: flex; align-items: start; justify-content: space-between; gap: 16px; padding-bottom: 22px; border-bottom: 1px solid var(--pc-border-strong); }
	.editor-header h3 { margin: 0; font-size: 20px; font-weight: 500; letter-spacing: -.035em; line-height: 1.2; }
	.editor-close { display: grid; flex: 0 0 auto; place-items: center; width: 40px; height: 40px; margin: -5px -5px 0 0; padding: 0; border: 0; border-radius: 50%; color: var(--pc-text-muted); background: transparent; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
	.editor-close:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.item-editor form { display: flex; flex: 1; flex-direction: column; gap: 18px; padding-top: 24px; }
	.item-editor :global(input) { min-height: 44px; }
	.item-editor :global(input:focus-visible), .item-editor :global(textarea:focus-visible), .item-editor :global(.pc-select-trigger:focus-visible), .editor-close:focus-visible, .editor-backdrop:focus-visible, .queue-row:focus-visible, .item-row:focus-visible, .icon-button:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.dialog-row { display: flex; align-items: center; gap: 14px; }
	.editor-actions { display: flex; align-items: center; gap: 16px; margin-top: auto; padding-top: 24px; border-top: 1px solid var(--pc-border-strong); }
	@media (max-width: 1020px) { .briefing-layout { grid-template-columns: minmax(0, 1fr); } }
	@media (max-width: 720px) { .briefing-page { width: min(100% - 24px, 1160px); padding-top: 28px; } .page-header { align-items: start; flex-direction: column; gap: 14px; } .toolbar { align-items: stretch; flex-wrap: wrap; } .toolbar-actions { width: 100%; } .toolbar-actions :global(a), .toolbar-actions :global(button) { flex: 1; } .search-field { width: 100%; } .reset-button { margin-inline-start: auto; } .form-grid, .form-grid-dialog { grid-template-columns: minmax(0, 1fr); } .link-row { grid-template-columns: minmax(0, 1fr); } }
	@media (max-width: 460px) { .item-editor { width: min(100% - 16px, 520px); padding: 24px 20px max(22px, env(safe-area-inset-bottom)); border-start-start-radius: 22px; border-end-start-radius: 22px; } .editor-actions { align-items: stretch; flex-direction: column; gap: 10px; } .editor-actions :global(button) { width: 100%; } }
	@media (prefers-reduced-motion: reduce) { .queue-row, .item-row, .icon-button, .reset-button { transition: none; } }
</style>
