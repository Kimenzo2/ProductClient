<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Add, ArrowLeft, ChevronDown, Code, Eye, FileText, Save, Search, Settings, Trash } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import EditorBlockSurface from '$lib/components/docs/EditorBlockSurface.svelte';
	import { docsBlocksToMarkdown, markdownToDocsBlocks, starterDocsDocument, type DocsBlock, type DocsDocument, type DocsPage } from '$lib/data/docsEditor';
	import { supabase } from '$lib/supabaseClient';

	type EditorResponse = {
		ok?: boolean;
		code?: string;
		message?: string;
		draft?: DocsDocument;
		version?: number;
		publishedVersion?: number;
		publishedAt?: string | null;
		warning?: string;
		migrated?: boolean;
	};

	let doc = $state<DocsDocument>(structuredClone(starterDocsDocument));
	let savedSignature = $state(JSON.stringify(starterDocsDocument));
	let version = $state(0);
	let publishedVersion = $state(0);
	let selectedPageId = $state<string | null>(null);
	let mode = $state<'visual' | 'markdown'>('visual');
	let loading = $state(true);
	let saving = $state(false);
	let publishing = $state(false);
	let errorMessage = $state('');
	let expandedViews = $state<Record<string, boolean>>({});
	let expandedGroups = $state<Record<string, boolean>>({});
	let branchMenuOpen = $state(false);
	let publishMenuOpen = $state(false);
	let searchOpen = $state(false);
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement | null>(null);
	let editorSurface = $state<'navigation' | 'site-config'>('navigation');
	let siteConfigSection = $state('general');
	let siteTitle = $state('ProductClient Documentation');
	let siteDescription = $state('Documentation for ProductClient.');
	let editorBlocks = $state<DocsBlock[]>([]);
	let editorBlockPageId = '';

	const siteConfigSections = [
		{ id: 'general', label: 'General', icon: Settings },
		{ id: 'brand', label: 'Brand & Theme', icon: Eye },
		{ id: 'routing', label: 'Header & Routing', icon: ArrowLeft },
		{ id: 'seo', label: 'SEO', icon: Search },
		{ id: 'cookies', label: 'Cookies', icon: FileText },
		{ id: 'integrations', label: 'Integrations', icon: Code },
		{ id: 'css', label: 'Custom CSS', icon: Code },
		{ id: 'scripts', label: 'Custom Scripts', icon: Code },
		{ id: 'actions', label: 'Page Actions', icon: Add },
		{ id: 'agent', label: 'AI Agent', icon: Search },
		{ id: 'feedback', label: 'Feedback', icon: FileText },
		{ id: 'redirects', label: 'Redirects', icon: ArrowLeft }
	] as const;


	let currentPage = $derived(doc.pages.find((page) => page.id === selectedPageId) ?? null);
	let currentSiteSection = $derived(siteConfigSections.find((section) => section.id === siteConfigSection) ?? siteConfigSections[0]);
	let dirty = $derived(JSON.stringify($state.snapshot(doc)) !== savedSignature);
	let orderedViews = $derived([...doc.views].sort((a, b) => a.order - b.order));
	let searchResults = $derived(
		doc.pages.filter((page) => {
			const query = searchQuery.trim().toLowerCase();
			return !query || `${page.title} ${page.description} ${page.slug}`.toLowerCase().includes(query);
		})
	);

	function pageSlug(page: DocsPage): string {
		return page.slug || 'untitled-page';
	}

	function blocksForPage(page: DocsPage): DocsBlock[] {
		if (page.blocks?.length) return page.blocks;
		const starterPage = starterDocsDocument.pages.find((candidate) => candidate.slug === page.slug);
		if (page.markdown.trim() && starterPage?.blocks?.length) return starterPage.blocks;
		return markdownToDocsBlocks(page.markdown);
	}

	function selectPage(id: string) {
		selectedPageId = id;
		editorSurface = 'navigation';
		errorMessage = '';
	}

	function setMode(nextMode: 'visual' | 'markdown') {
		mode = nextMode;
		if (nextMode === 'visual' && currentPage) {
			editorBlocks = structuredClone(blocksForPage(currentPage));
			editorBlockPageId = currentPage.id;
		}
	}

	function setEditorSurface(nextSurface: 'navigation' | 'site-config') {
		editorSurface = nextSurface;
		if (browser) {
			const url = new URL(window.location.href);
			if (nextSurface === 'site-config') url.searchParams.set('tab', 'settings');
			else url.searchParams.delete('tab');
			window.history.replaceState({}, '', url);
		}
	}

	function openSearch() {
		searchOpen = true;
		searchQuery = '';
	}

	function closeSearch() {
		searchOpen = false;
		searchQuery = '';
	}

	function chooseSearchResult(id: string) {
		selectPage(id);
		closeSearch();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			branchMenuOpen = false;
			publishMenuOpen = false;
			closeSearch();
			return;
		}
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			openSearch();
		}
	}

	function handleWindowClick(event: MouseEvent) {
		const target = event.target as Element | null;
		if (!target?.closest('.menu-anchor')) {
			branchMenuOpen = false;
			publishMenuOpen = false;
		}
	}

	function toggleView(id: string) {
		expandedViews[id] = expandedViews[id] === false;
	}

	function toggleGroup(id: string) {
		expandedGroups[id] = expandedGroups[id] === false;
	}

	function pageForEdit(): DocsPage | null {
		return doc.pages.find((page) => page.id === selectedPageId) ?? null;
	}

	function updatePage(field: 'title' | 'description' | 'markdown', value: string) {
		const page = pageForEdit();
		if (!page) return;
		page[field] = value;
		if (field === 'markdown') page.blocks = undefined;
	}

	function commitEditorBlocks(nextBlocks: DocsBlock[]) {
		const page = pageForEdit();
		if (!page) return;
		editorBlocks = structuredClone(nextBlocks);
		page.blocks = structuredClone(nextBlocks);
		page.markdown = docsBlocksToMarkdown(nextBlocks);
	}

	function ensureViewAndGroup() {
		if (doc.views.length === 0) doc.views.push({ id: crypto.randomUUID(), label: 'Documentation', kind: 'tabs', order: 0, groups: [] });
		const view = doc.views[0];
		if (view.groups.length === 0) view.groups.push({ id: crypto.randomUUID(), label: 'Getting started', order: 0 });
		expandedViews[view.id] = true;
		expandedGroups[view.groups[0].id] = true;
		return { view, group: view.groups[0] };
	}

	function createPage(groupId?: string) {
		const selectedGroup = groupId ? doc.views.flatMap((view) => view.groups).find((group) => group.id === groupId) : null;
		const { group } = selectedGroup ? { group: selectedGroup } : ensureViewAndGroup();
		const page: DocsPage = {
			id: crypto.randomUUID(),
			slug: `untitled-page-${doc.pages.length + 1}`,
			title: 'Untitled page',
			description: '',
			markdown: '',
			blocks: [],
			groupId: group.id,
			order: doc.pages.length
		};
		doc.pages.push(page);
		selectedPageId = page.id;
		mode = 'visual';
	}

	function createGroup(viewId?: string) {
		const target = doc.views.find((candidate) => candidate.id === viewId) ?? doc.views[0] ?? ensureViewAndGroup().view;
		const group = { id: crypto.randomUUID(), label: 'New section', order: target.groups.length };
		target.groups.push(group);
		expandedViews[target.id] = true;
		expandedGroups[group.id] = true;
	}

	function createView() {
		doc.views.push({ id: crypto.randomUUID(), label: 'New view', kind: 'tabs', order: doc.views.length, groups: [] });
	}

	function deleteSelectedPage() {
		if (!selectedPageId) return;
		doc.pages = doc.pages.filter((page) => page.id !== selectedPageId);
		selectedPageId = doc.pages[0]?.id ?? null;
	}

	async function sessionToken(): Promise<string | null> {
		if (!supabase) return null;
		const { data } = await supabase.auth.getSession();
		return data.session?.access_token ?? null;
	}

	async function readEditor() {
		if (!browser) return;
		const token = await sessionToken();
		if (!token) {
			errorMessage = 'Sign in again to edit documentation.';
			loading = false;
			return;
		}
		const response = await fetch('/api/docs/editor', { headers: { authorization: `Bearer ${token}` } });
		const result = (await response.json().catch(() => null)) as EditorResponse | null;
		if (!response.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not load the documentation draft.');
		doc = structuredClone(result.draft ?? starterDocsDocument);
		version = result.version ?? 0;
		publishedVersion = result.publishedVersion ?? 0;
		savedSignature = result.migrated ? '' : JSON.stringify($state.snapshot(doc));
		selectedPageId = doc.pages[0]?.id ?? null;
		expandedViews = Object.fromEntries(doc.views.map((view) => [view.id, true]));
		expandedGroups = Object.fromEntries(doc.views.flatMap((view) => view.groups).map((group) => [group.id, true]));
	}

	async function saveDraft(): Promise<boolean> {
		const token = await sessionToken();
		if (!token) {
			errorMessage = 'Sign in again to save the draft.';
			return false;
		}
		saving = true;
		errorMessage = '';
		try {
			const response = await fetch('/api/docs/editor', {
				method: 'PUT',
				headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'if-match': `W/"${version}"` },
				body: JSON.stringify({ draft: $state.snapshot(doc), version })
			});
			const result = (await response.json().catch(() => null)) as EditorResponse | null;
			if (!response.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not save the draft.');
			version = result.version ?? version + 1;
			savedSignature = JSON.stringify($state.snapshot(doc));
			return true;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not save the draft.';
			return false;
		} finally {
			saving = false;
		}
	}

	async function publish() {
		publishing = true;
		errorMessage = '';
		try {
			if (dirty && !(await saveDraft())) return;
			const token = await sessionToken();
			if (!token) throw new Error('Sign in again to publish the documentation.');
			const response = await fetch('/api/docs/publish', {
				method: 'POST',
				headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
				body: JSON.stringify({ version })
			});
			const result = (await response.json().catch(() => null)) as EditorResponse | null;
			if (!response.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not publish the documentation.');
			publishedVersion = result.version ?? publishedVersion + 1;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not publish the documentation.';
		} finally {
			publishing = false;
		}
	}

	$effect(() => {
		if (currentPage && currentPage.id !== editorBlockPageId) {
			editorBlocks = structuredClone(blocksForPage(currentPage));
			editorBlockPageId = currentPage.id;
		}
		if (searchOpen && searchInput) searchInput.focus();
	});

	onMount(async () => {
		window.addEventListener('keydown', handleWindowKeydown);
		window.addEventListener('click', handleWindowClick);
		if (new URLSearchParams(window.location.search).get('tab') === 'settings') editorSurface = 'site-config';
		try {
			await readEditor();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not load the documentation draft.';
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleWindowKeydown);
			window.removeEventListener('click', handleWindowClick);
		}
	});
</script>

<svelte:head><title>Docs Editor | Product Client</title></svelte:head>

<div class="docs-editor-shell">
	<header class="editor-commandbar">
		<div class="command-leading">
			<a class="command-back" href="/workspace/docs" aria-label="Back to Docs"><ArrowLeft size={15} weight="Outline" aria-hidden="true" /></a>
			<div class="menu-anchor">
				<button class="branch-switch" type="button" aria-label="Current branch" aria-expanded={branchMenuOpen} onclick={() => (branchMenuOpen = !branchMenuOpen)}><span class="branch-mark" aria-hidden="true"></span><span>main</span><ChevronDown size={13} weight="Outline" aria-hidden="true" /></button>
				{#if branchMenuOpen}
					<div class="editor-menu branch-menu" role="menu">
						<div class="menu-label">Branches</div>
						<button class="menu-item selected" type="button" role="menuitem" onclick={() => (branchMenuOpen = false)}><span class="branch-mark" aria-hidden="true"></span><span>main</span><span class="menu-check">Current</span></button>
						<button class="menu-item" type="button" role="menuitem" onclick={() => (branchMenuOpen = false)}>+ Create branch</button>
					</div>
				{/if}
			</div>
			<div class="command-context-actions" aria-label="Documentation workspace sections">
				<button class:active={editorSurface === 'navigation'} class="command-context-action" type="button" aria-label="Navigation" title="Navigation" aria-pressed={editorSurface === 'navigation'} onclick={() => setEditorSurface('navigation')}><FileText size={15} weight="Outline" aria-hidden="true" /></button>
				<button class:active={editorSurface === 'site-config'} class="command-context-action" type="button" aria-label="Site config" title="Site config" aria-pressed={editorSurface === 'site-config'} onclick={() => setEditorSurface('site-config')}><Settings size={15} weight="Outline" aria-hidden="true" /></button>
			</div>
		</div>
		<div class="command-actions">
			<span class="save-state" role="status">{#if saving}Saving…{:else if dirty}Unsaved changes{:else if version > 0}Saved{/if}</span>
			<Button class="toolbar-button" variant="outline" size="sm" disabled={!dirty || saving} loading={saving} onclick={() => void saveDraft()}><Save size={13} weight="Outline" /> Save</Button>
			<div class="publish-control menu-anchor">
				<Button class="toolbar-button toolbar-button-primary" size="sm" disabled={publishing || loading || doc.pages.length === 0} loading={publishing} onclick={() => void publish()}>Publish</Button>
				<button class="publish-menu-trigger" type="button" aria-label="More publish actions" aria-expanded={publishMenuOpen} onclick={() => (publishMenuOpen = !publishMenuOpen)}><ChevronDown size={13} weight="Outline" aria-hidden="true" /></button>
				{#if publishMenuOpen}
					<div class="editor-menu publish-menu" role="menu">
						<button class="menu-item" type="button" role="menuitem" onclick={() => { publishMenuOpen = false; void publish(); }}>Publish latest draft</button>
						<button class="menu-item" type="button" role="menuitem" disabled={saving || !dirty} onclick={() => { publishMenuOpen = false; void saveDraft(); }}>Save draft</button>
					</div>
				{/if}
			</div>
		</div>
	</header>
	{#if errorMessage}<p class="editor-error" role="alert">{errorMessage}</p>{/if}
	{#if searchOpen}
		<div class="search-backdrop" role="presentation" tabindex="-1" onclick={closeSearch} onkeydown={(event) => { if (event.key === 'Escape') closeSearch(); }}>
			<div class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="docs-search-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<div class="search-dialog-heading"><div><span class="eyebrow">Workspace search</span><h2 id="docs-search-title">Find a page</h2></div><button class="icon-action" type="button" aria-label="Close search" onclick={closeSearch}>×</button></div>
				<div class="search-input-wrap"><Search size={15} weight="Outline" aria-hidden="true" /><input bind:this={searchInput} bind:value={searchQuery} aria-label="Search documentation pages" placeholder="Search pages…" /></div>
				<div class="search-results" role="listbox" aria-label="Documentation pages">
					{#each searchResults.slice(0, 8) as result}
						<button class="search-result" type="button" role="option" aria-selected={selectedPageId === result.id} onclick={() => chooseSearchResult(result.id)}><FileText size={15} weight="Outline" aria-hidden="true" /><span><strong>{result.title || 'Untitled page'}</strong><small>/{pageSlug(result)}</small></span></button>
					{:else}
						<p class="search-empty">No documentation pages match “{searchQuery}”.</p>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="editor-empty">Loading your documentation workspace…</div>
	{:else}
		{#if editorSurface === 'site-config'}
			<section class="site-config-shell" aria-label="Site configuration">
				<aside class="site-config-sidebar">
					<div class="site-config-sidebar-title">Site Config</div>
					<nav class="site-config-nav" aria-label="Site configuration sections">
						{#each siteConfigSections as section}
							{@const SiteConfigIcon = section.icon}
							<button class:active={siteConfigSection === section.id} class="site-config-nav-item" type="button" aria-current={siteConfigSection === section.id ? 'page' : undefined} onclick={() => (siteConfigSection = section.id)}>
								<SiteConfigIcon size={15} weight="Outline" aria-hidden="true" />
								<span>{section.label}</span>
							</button>
						{/each}
					</nav>
				</aside>
				<main class="site-config-main">
					<div class="site-config-heading">
						<div><h1>{currentSiteSection.label}</h1></div>
					</div>
					{#if siteConfigSection === 'general'}
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Site Title</h2><p>Displayed in the browser tab and used by search engines.</p></div>
							<input class="site-config-input" aria-label="Site title" bind:value={siteTitle} />
						</section>
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Site Description</h2><p>Appears in search results and social media link previews.</p></div>
							<textarea class="site-config-input site-config-textarea" aria-label="Site description" bind:value={siteDescription}></textarea>
						</section>
					{:else}
						<section class="site-config-intro">
							<h2>{currentSiteSection.label}</h2>
							<p>This section is ready for the tenant-level documentation settings that will shape the hosted Starter Kit.</p>
						</section>
					{/if}
				</main>
			</section>
		{:else}
		<div class="editor-workspace">
			<aside class="editor-tree" aria-label="Documentation structure">
				<div class="tree-heading">
					<div><h2>Your documentation</h2></div>
					<button class="icon-action" type="button" aria-label="Add view" title="Add view" onclick={createView}><Add size={15} weight="Outline" /></button>
				</div>
				{#if orderedViews.length === 0}
					<div class="tree-empty"><p>Start with a view, section, and page.</p><button class="text-button" type="button" onclick={() => createPage()}>Create first page</button></div>
				{:else}
					<div class="tree-list">
						{#each orderedViews as view}
							<section class="tree-view">
								<div class="tree-view-row">
									<span class="tree-view-type">Tab</span>
									<button class="tree-node-toggle" type="button" aria-expanded={expandedViews[view.id] !== false} onclick={() => toggleView(view.id)}><FileText size={14} weight="Outline" aria-hidden="true" /><span>{view.label}</span><ChevronDown size={13} weight="Outline" class={expandedViews[view.id] === false ? 'tree-chevron-collapsed' : ''} aria-hidden="true" /></button>
									<button class="tree-more tree-more-visible" type="button" aria-label={`More actions for ${view.label}`} title="More actions">⋮</button>
								</div>
								{#if expandedViews[view.id] !== false}
									<div class="tree-groups-heading"><span>Groups</span><span class="tree-groups-actions"><button class="tree-more tree-more-visible" type="button" aria-label={`Add section to ${view.label}`} title="Add section" onclick={() => createGroup(view.id)}><Add size={14} weight="Outline" /></button><button class="tree-more tree-more-visible" type="button" aria-label={`More group actions for ${view.label}`} title="More actions">⋮</button></span></div>
									<div class="tree-branch">
										{#each [...view.groups].sort((a, b) => a.order - b.order) as group}
											<div class="tree-group">
												<div class="tree-group-row">
															<button class="tree-group-toggle" type="button" aria-expanded={expandedGroups[group.id] !== false} onclick={() => toggleGroup(group.id)}><ChevronDown size={12} weight="Outline" class={expandedGroups[group.id] === false ? 'tree-chevron-collapsed' : ''} aria-hidden="true" /><span>{group.label}</span><span class="tree-count">{doc.pages.filter((page) => page.groupId === group.id).length}</span></button>
															<button class="tree-more" type="button" aria-label={`Add page to ${group.label}`} title="Add page" onclick={() => createPage(group.id)}><Add size={13} weight="Outline" /></button>
												</div>
												{#if expandedGroups[group.id] !== false}
													{#each doc.pages.filter((page) => page.groupId === group.id).sort((a, b) => a.order - b.order) as page}
														<button class:active={selectedPageId === page.id} class="tree-page" type="button" aria-pressed={selectedPageId === page.id} onclick={() => selectPage(page.id)}><FileText size={13} weight="Outline" aria-hidden="true" /><span>{page.title || 'Untitled page'}</span></button>
													{/each}
												{/if}
											</div>
										{/each}
										{#each doc.pages.filter((page) => !page.groupId) as page}
											<button class:active={selectedPageId === page.id} class="tree-page tree-page-ungrouped" type="button" aria-pressed={selectedPageId === page.id} onclick={() => selectPage(page.id)}><FileText size={13} weight="Outline" aria-hidden="true" /><span>{page.title || 'Untitled page'}</span></button>
										{/each}
									</div>
								{/if}
							</section>
						{/each}
					</div>
				{/if}
				<div class="tree-footer"><button class="text-button" type="button" onclick={() => createPage()}><Add size={14} weight="Outline" /> New page</button><button class="text-button muted" type="button" onclick={() => createGroup()}>New section</button></div>
			</aside>

			<main class="editor-canvas" aria-label="Page editor">
				<div class="canvas-toolbar">
					<div class="canvas-toolbar-actions">
						<div class="mode-switch" role="tablist" aria-label="Editor mode"><button class:active={mode === 'visual'} type="button" role="tab" aria-selected={mode === 'visual'} onclick={() => setMode('visual')}><Eye size={13} weight="Outline" aria-hidden="true" /> Visual</button><button class:active={mode === 'markdown'} type="button" role="tab" aria-selected={mode === 'markdown'} onclick={() => setMode('markdown')}><Code size={13} weight="Outline" aria-hidden="true" /> Markdown</button></div>
						{#if currentPage}<button class="canvas-icon-action danger" type="button" aria-label="Remove page" title="Remove page" onclick={deleteSelectedPage}><Trash size={14} weight="Outline" /></button>{/if}
					</div>
				</div>
				{#if currentPage}
					<div class="canvas-scroll">
						<div class="canvas-sheet">
							<div class="document-editor-surface">
								<div class="document-editor-header">
									<input class="document-page-title" value={currentPage.title} aria-label="Page title" placeholder="Untitled page" oninput={(event) => updatePage('title', event.currentTarget.value)} />
									<textarea class="document-page-description" rows="1" value={currentPage.description} aria-label="Page description" placeholder="A short description for navigation and search" oninput={(event) => updatePage('description', event.currentTarget.value)}></textarea>
								</div>
								<div class="document-editor-rule"></div>
								{#if mode === 'visual'}
									<EditorBlockSurface blocks={editorBlocks} onChange={commitEditorBlocks} />
								{:else}
									<textarea class="writing-surface markdown-mode document-markdown-surface" aria-label="Page Markdown" value={currentPage.markdown} placeholder="# Page title\n\nWrite your documentation here…" oninput={(event) => updatePage('markdown', event.currentTarget.value)}></textarea>
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<div class="editor-empty"><FileText size={28} weight="Outline" aria-hidden="true" /><h2>Your first page starts here</h2><p>Create a page to open the writing canvas.</p><button class="text-button" type="button" onclick={() => createPage()}><Add size={14} weight="Outline" /> Create page</button></div>
				{/if}
			</main>

		</div>
		{/if}
	{/if}
</div>

<style>
	.docs-editor-shell {
		--editor-border: color-mix(in oklch, var(--pc-border-strong) 82%, transparent);
		--editor-border-soft: color-mix(in oklch, var(--pc-border-strong) 58%, transparent);
		--editor-muted: var(--pc-text-muted);
		--editor-faint: var(--pc-text-faint);
		--editor-sidebar-width: 248px;
		--editor-content-max: 980px;
		width: 100%;
		height: calc(100dvh - var(--pc-header-h));
		min-height: calc(100dvh - var(--pc-header-h));
		overflow: hidden;
		background: var(--pc-bg);
		color: var(--pc-text);
	}

	.editor-commandbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: 56px;
		padding: 8px 20px;
		border-bottom: 1px solid var(--editor-border);
		background: var(--pc-bg);
	}
	.editor-commandbar {
		position: sticky;
		top: 0;
		z-index: 30;
		box-shadow: 0 1px 0 color-mix(in oklch, var(--pc-bg) 42%, transparent);
	}
	.command-leading,
	.command-actions,
	.branch-switch,
	.canvas-toolbar-actions,
	.mode-switch,
	.tree-node-toggle,
	.tree-group-toggle,
	.tree-footer {
		display: flex;
		align-items: center;
	}
	.menu-anchor { position: relative; }
	.command-context-actions { display: inline-flex; align-items: center; gap: 3px; margin-inline-start: 2px; padding-inline-start: 7px; border-inline-start: 1px solid var(--editor-border); }
	.command-context-action { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid transparent; border-radius: 8px; color: var(--editor-muted); background: transparent; cursor: pointer; text-decoration: none; transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, transform 120ms ease; }
	.command-context-action:hover,
	.command-context-action:focus-visible,
	.command-context-action.active { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface); outline: 0; }
	.command-context-action:active { transform: scale(.97); }
	.command-leading,
	.command-actions { gap: 8px; min-width: 0; }
	.command-back,
	.branch-switch,
	.icon-action,
	.tree-more,
	.canvas-icon-action {
		border: 1px solid transparent;
		color: var(--editor-muted);
		background: transparent;
		cursor: pointer;
		transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, transform 120ms ease;
	}
	.command-back,
	.branch-switch {
		min-height: 32px;
		border-radius: 9px;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
	}
	.command-back { display: grid; place-items: center; width: 32px; }
	.command-back:hover,
	.branch-switch:hover { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface-2); }
	.command-back:active,
	.branch-switch:active,
	.icon-action:active,
	.tree-more:active,
	.canvas-icon-action:active { transform: scale(.97); }
	.branch-switch { gap: 7px; min-height: 34px; padding: 0 10px; border-color: var(--editor-border); border-radius: 9px; color: var(--pc-text); background: var(--pc-surface); }
	.branch-mark { width: 7px; height: 7px; border: 1px solid currentColor; border-radius: 50%; }
	.command-actions { justify-content: flex-end; }
	.save-state { min-width: 72px; color: var(--editor-faint); font-size: 11px; text-align: right; }
	.docs-editor-shell :global(.toolbar-button) { min-height: 32px; height: 32px; border-radius: 9px; padding-inline: 11px; font-size: 12px; box-shadow: none; }
	.docs-editor-shell :global(.toolbar-button-primary) { gap: 7px; }
	.publish-control { display: inline-flex; align-items: stretch; }
	.publish-control :global(.toolbar-button-primary) { border-radius: 9px 0 0 9px; }
	.publish-menu-trigger { display: grid; place-items: center; min-width: 28px; border: 1px solid var(--pc-text); border-left-color: color-mix(in oklch, var(--pc-bg) 24%, transparent); border-radius: 0 9px 9px 0; color: var(--pc-bg); background: var(--pc-text); cursor: pointer; }
	.publish-menu-trigger:hover { background: var(--pc-text-muted); }
	.editor-menu { position: absolute; z-index: 20; top: calc(100% + 7px); min-width: 210px; padding: 5px; border: 1px solid var(--editor-border); border-radius: 10px; background: var(--pc-surface); box-shadow: 0 16px 34px rgba(0, 0, 0, .24); }
	.branch-menu { left: 0; }
	.publish-menu { right: 0; }
	.menu-label { padding: 7px 9px 5px; color: var(--editor-faint); font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
	.menu-item { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 32px; padding: 0 9px; border: 0; border-radius: 7px; color: var(--editor-muted); background: transparent; cursor: pointer; font: inherit; font-size: 12px; text-align: left; text-decoration: none; }
	.menu-item:hover,
	.menu-item.selected { color: var(--pc-text); background: var(--pc-surface-2); }
	.menu-item:disabled { cursor: not-allowed; opacity: .45; }
	.menu-check { margin-inline-start: auto; color: var(--editor-faint); font-size: 10px; }

	.editor-error { margin: 10px 16px 0; max-width: 900px; padding: 8px 11px; border: 1px solid color-mix(in oklch, var(--red-6) 50%, var(--editor-border)); color: var(--red-6); font-size: 12px; line-height: 1.5; }
	.search-backdrop { position: fixed; z-index: 50; inset: 0; display: grid; place-items: start center; padding: 12vh 20px 20px; background: color-mix(in oklch, var(--pc-bg) 72%, transparent); }
	.search-dialog { width: min(100%, 560px); overflow: hidden; border: 1px solid var(--editor-border); border-radius: 12px; background: var(--pc-surface); box-shadow: 0 20px 50px rgba(0, 0, 0, .28); }
	.search-dialog-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px; border-bottom: 1px solid var(--editor-border); }
	.search-dialog-heading h2 { margin-top: 4px; color: var(--pc-text); font-size: 17px; font-weight: 600; }
	.search-input-wrap { display: flex; align-items: center; gap: 9px; margin: 12px; padding: 0 11px; border: 1px solid var(--editor-border); border-radius: 9px; color: var(--editor-faint); background: var(--pc-bg); }
	.search-input-wrap input { width: 100%; min-height: 38px; border: 0; outline: 0; color: var(--pc-text); background: transparent; font: inherit; font-size: 13px; }
	.search-input-wrap input::placeholder { color: var(--editor-faint); }
	.search-results { max-height: min(52vh, 360px); overflow-y: auto; padding: 0 7px 7px; }
	.search-result { display: flex; align-items: center; gap: 9px; width: 100%; min-height: 45px; padding: 6px 9px; border: 0; border-radius: 8px; color: var(--editor-muted); background: transparent; cursor: pointer; text-align: left; }
	.search-result:hover,
	.search-result:focus-visible { color: var(--pc-text); background: var(--pc-surface-2); outline: 0; }
	.search-result > span { display: grid; min-width: 0; gap: 2px; }
	.search-result strong { overflow: hidden; color: inherit; font-size: 12px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.search-result small { overflow: hidden; color: var(--editor-faint); font-family: var(--font-mono, ui-monospace, monospace); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
	.search-empty { padding: 15px 9px; color: var(--editor-muted); font-size: 12px; }

		.editor-workspace { display: grid; grid-template-columns: var(--editor-sidebar-width) minmax(0, 1fr); height: calc(100dvh - var(--pc-header-h) - 56px); min-height: 0; border-bottom: 1px solid var(--editor-border); overflow: hidden; background: var(--pc-bg); }
	.editor-tree { min-width: 0; min-height: 0; background: var(--pc-bg); }
	.editor-tree { display: flex; flex-direction: column; padding: 18px 14px 14px; border-right: 1px solid var(--editor-border); overflow: hidden; }
	.tree-heading,
	.tree-view-row,
	.tree-group-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
	.tree-heading { padding: 0 7px 16px 9px; }
	.eyebrow { color: var(--editor-faint); font-size: 10px; font-weight: 600; letter-spacing: .105em; line-height: 1.2; text-transform: uppercase; }
	.tree-heading h2 { margin-top: 4px; color: var(--pc-text); font-size: 13px; font-weight: 600; letter-spacing: -.01em; }
	.tree-heading h2 { margin-top: 0; }
	.icon-action { display: grid; place-items: center; width: 28px; height: 28px; border-color: var(--editor-border); border-radius: 9px; }
	.icon-action:hover,
	.tree-more:hover,
	.canvas-icon-action:hover { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface-2); }
	.tree-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; scrollbar-gutter: stable; padding: 2px 2px 8px; }
	.tree-view + .tree-view { margin-top: 18px; }
	.tree-view-row,
	.tree-group-row { min-height: 36px; }
	.tree-view-type { flex: 0 0 auto; color: var(--editor-faint); font-size: 11px; }
	.tree-groups-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 32px; padding: 8px 7px 2px 17px; color: var(--editor-faint); font-size: 11px; }
	.tree-groups-actions { display: inline-flex; align-items: center; gap: 3px; }
	.tree-node-toggle,
	.tree-group-toggle { min-width: 0; flex: 1; gap: 8px; height: 36px; padding: 0 9px; border: 1px solid transparent; border-radius: 9px; color: var(--pc-text); background: transparent !important; cursor: pointer; font: inherit; text-align: left; transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease; }
	.tree-node-toggle:hover,
	.tree-group-toggle:hover,
	.tree-node-toggle:focus-visible,
	.tree-group-toggle:focus-visible { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface-2) !important; box-shadow: inset 0 1px 0 color-mix(in oklch, var(--pc-text) 7%, transparent); outline: 0; }
	.tree-node-toggle > span,
	.tree-group-toggle > span:first-of-type { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.tree-node-toggle :global(svg:first-child) { color: var(--editor-faint); }
	.tree-node-toggle > :global(svg:last-child),
	.tree-group-toggle > :global(svg:first-child) { flex: 0 0 auto; color: var(--editor-faint); transition: transform 100ms ease; }
	:global(.tree-chevron-collapsed) { transform: rotate(-90deg); }
	.tree-more { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; opacity: 0; }
	.tree-more-visible { opacity: 1; color: var(--editor-faint); font-size: 16px; line-height: 1; }
	.tree-view-row:hover .tree-more,
	.tree-group-row:hover .tree-more,
	.tree-more:focus-visible { opacity: 1; }
	.tree-branch { margin: 3px 0 0 17px; padding: 4px 0 5px 12px; border-left: 1px solid var(--editor-border-soft); }
	.tree-group + .tree-group { margin-top: 6px; }
	.tree-group-toggle { height: 32px; padding-inline: 7px; color: var(--pc-text-muted); font-size: 11px; }
	.tree-count { margin-inline-start: auto; color: var(--editor-faint); font-size: 10px; font-variant-numeric: tabular-nums; }
	.tree-page { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 36px; padding: 0 10px; border: 1px solid transparent; border-radius: 9px; color: var(--editor-muted); background: transparent; cursor: pointer; font-size: 12px; line-height: 1.4; text-align: left; transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease; }
	.tree-page:hover,
	.tree-page:focus-visible { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface); }
	.tree-page.active { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface-2); }
	.tree-page :global(svg) { flex: 0 0 auto; color: var(--editor-faint); }
	.tree-page.active :global(svg) { color: var(--pc-text-muted); }
	.tree-page-ungrouped { margin-top: 3px; }
	.tree-footer { flex: 0 0 auto; position: relative; z-index: 2; flex-wrap: wrap; gap: 16px; padding: 16px 9px 0; border-top: 1px solid var(--editor-border); background: var(--pc-bg); }
	.text-button { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; color: var(--editor-muted); background: none; cursor: pointer; font-size: 12px; font-weight: 500; }
	.text-button:hover { color: var(--pc-text); }
	.text-button.muted { color: var(--editor-faint); }
	.tree-empty { margin: 18px 8px; color: var(--editor-muted); font-size: 12px; line-height: 1.5; }
	.tree-empty p { margin-bottom: 10px; }

	.editor-canvas { display: flex; min-width: 0; min-height: 0; flex-direction: column; background: var(--pc-bg); }
	.canvas-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 18px; min-height: 48px; padding: 7px 28px; border-bottom: 1px solid var(--editor-border); }
	.canvas-toolbar-actions { gap: 8px; min-width: 0; }
	.mode-switch { gap: 2px; padding: 2px; border: 1px solid var(--editor-border); border-radius: 8px; }
	.mode-switch button { display: inline-flex; align-items: center; gap: 5px; min-height: 26px; padding: 0 8px; border: 1px solid transparent; border-radius: 6px; color: var(--editor-faint); background: transparent; cursor: pointer; font-size: 11px; }
	.mode-switch button:hover { color: var(--editor-muted); }
	.mode-switch button.active { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface); }
	.canvas-icon-action { display: grid; place-items: center; width: 29px; height: 29px; border-radius: 8px; }
	.canvas-icon-action.danger { color: color-mix(in oklch, var(--red-6) 75%, var(--editor-muted)); }
	.canvas-icon-action.danger:hover { border-color: color-mix(in oklch, var(--red-6) 40%, var(--editor-border)); color: var(--red-6); background: color-mix(in oklch, var(--red-6) 10%, transparent); }
	.canvas-scroll { flex: 1; min-height: 0; padding-inline: 48px; overflow-y: auto; overscroll-behavior-y: contain; scrollbar-gutter: auto; }
	.canvas-sheet { width: min(100%, var(--editor-content-max)); min-height: 100%; margin: 0 auto; padding: 22px 0 92px; }
	.writing-surface { display: block; width: 100%; min-height: 480px; border: 0; outline: 0; resize: vertical; color: var(--pc-text); background: transparent; font: inherit; font-size: 15px; line-height: 1.6; }
	.writing-surface::placeholder { color: var(--editor-faint); }
	.markdown-mode { font-family: var(--font-mono, ui-monospace, monospace); font-size: 13px; letter-spacing: -.005em; line-height: 1.55; }

	.site-config-shell { display: grid; grid-template-columns: 258px minmax(0, 1fr); height: calc(100dvh - var(--pc-header-h) - 56px); min-height: 0; overflow: hidden; border-bottom: 1px solid var(--editor-border); background: var(--pc-bg); }
	.site-config-sidebar { min-width: 0; overflow-y: auto; padding: 22px 12px 26px; border-right: 1px solid var(--editor-border); }
	.site-config-sidebar-title { padding: 0 10px 18px; color: var(--pc-text); font-size: 15px; font-weight: 650; letter-spacing: -.02em; }
	.site-config-nav { display: grid; gap: 3px; }
	.site-config-nav-item { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 38px; padding: 0 11px; border: 1px solid transparent; border-radius: 9px; color: var(--editor-muted); background: transparent; cursor: pointer; font: inherit; font-size: 13px; text-align: left; transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease; }
	.site-config-nav-item:hover,
	.site-config-nav-item:focus-visible { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface); outline: 0; }
	.site-config-nav-item.active { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface-2); font-weight: 600; }
	.site-config-nav-item :global(svg) { flex: 0 0 auto; color: var(--editor-faint); }
	.site-config-nav-item.active :global(svg) { color: var(--pc-text); }
	.site-config-main { min-width: 0; overflow-y: auto; padding: 38px clamp(30px, 6vw, 96px) 100px; }
	.site-config-heading { width: min(100%, 1080px); margin: 0 auto; padding-bottom: 22px; border-bottom: 1px solid var(--editor-border); }
	.site-config-heading h1 { margin-top: 7px; color: var(--pc-text); font-size: clamp(24px, 2.2vw, 32px); font-weight: 650; letter-spacing: -.045em; line-height: 1.1; }
	.site-config-row { display: grid; grid-template-columns: minmax(220px, .68fr) minmax(280px, 1fr); align-items: center; gap: clamp(30px, 5vw, 80px); width: min(100%, 1080px); margin: 0 auto; padding: 34px 0; border-bottom: 1px solid var(--editor-border); }
	.site-config-copy { max-width: 320px; }
	.site-config-copy h2,
	.site-config-intro h2 { color: var(--pc-text); font-size: 16px; font-weight: 600; letter-spacing: -.02em; }
	.site-config-copy p,
	.site-config-intro p { margin-top: 8px; color: var(--editor-muted); font-size: 14px; line-height: 1.55; }
	.site-config-input { width: 100%; min-height: 46px; padding: 0 14px; border: 1px solid var(--editor-border); border-radius: 9px; outline: 0; color: var(--pc-text); background: var(--pc-bg); font: inherit; font-size: 14px; transition: border-color 120ms ease, background-color 120ms ease; }
	.site-config-input:hover,
	.site-config-input:focus-visible { border-color: color-mix(in oklch, var(--pc-text) 38%, var(--editor-border)); background: var(--pc-surface); outline: 0; }
	.site-config-textarea { min-height: 96px; padding-block: 12px; resize: vertical; line-height: 1.5; }
	.site-config-intro { width: min(100%, 1080px); margin: 0 auto; padding: 34px 0; }

	.document-editor-surface { box-sizing: border-box; width: 100%; max-width: 1040px; min-height: 680px; margin: 0 auto; padding: 28px clamp(22px, 5vw, 72px) 100px; background: var(--pc-bg); }
	.document-editor-header { max-width: 900px; }
	.document-page-title { display: block; width: 100%; border: 0; outline: 0; color: var(--pc-text); background: transparent; font-size: clamp(38px, 4.3vw, 60px); font-weight: 680; letter-spacing: -.065em; line-height: 1.03; }
	.document-page-description { display: block; width: min(100%, 800px); min-height: 32px; margin-top: 16px; padding: 0; overflow: hidden; border: 0; outline: 0; resize: none; color: var(--editor-muted); background: transparent; font: inherit; font-size: 18px; line-height: 1.55; }
	.document-page-title::placeholder,
	.document-page-description::placeholder,
	.document-markdown-surface::placeholder { color: var(--editor-faint); }
	.document-editor-rule { height: 1px; margin: 34px 0 26px; background: var(--editor-border); }
	.document-markdown-surface { min-height: 620px; padding: 0; }

	.command-back:focus-visible,
	.branch-switch:focus-visible,
	.icon-action:focus-visible,
	.tree-more:focus-visible,
	.tree-page:focus-visible,
	.mode-switch button:focus-visible,
	.canvas-icon-action:focus-visible,
	.text-button:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.editor-empty { display: grid; place-items: center; align-content: center; gap: 10px; min-height: 520px; padding: 40px; color: var(--editor-muted); text-align: center; }
	.editor-empty h2 { color: var(--pc-text); font-size: 17px; font-weight: 600; }
	.editor-empty p { font-size: 13px; }

	@media (max-width: 980px) {
		.editor-workspace { grid-template-columns: 220px minmax(0, 1fr); }
		.site-config-shell { grid-template-columns: 220px minmax(0, 1fr); }
	}
	@media (max-width: 680px) {
		.docs-editor-shell { height: auto; min-height: calc(100dvh - var(--pc-header-h)); overflow: visible; }
		.editor-commandbar { align-items: flex-start; flex-direction: column; gap: 7px; padding: 8px; }
		.command-leading,
		.command-actions { width: 100%; }
		.command-actions { justify-content: flex-end; }
		.editor-workspace { display: block; height: auto; min-height: 0; overflow: visible; }
		.site-config-shell { display: block; height: auto; min-height: 0; overflow: visible; }
		.site-config-sidebar { border-right: 0; border-bottom: 1px solid var(--editor-border); }
		.site-config-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.site-config-main { padding: 28px 20px 72px; }
		.site-config-row { display: block; padding: 24px 0; }
		.site-config-input { margin-top: 16px; }
		.editor-tree { min-height: 0; border-right: 0; border-bottom: 1px solid var(--editor-border); }
		.tree-list { max-height: none; }
		.tree-footer { padding-bottom: 3px; }
		.editor-canvas { min-height: 680px; }
		.canvas-toolbar { padding-inline: 10px; }
		.canvas-scroll { padding-inline: 20px; }
		.canvas-sheet { padding: 36px 0 76px; }
		.document-editor-surface { min-height: 0; padding: 20px 0 72px; }
		.document-page-title { font-size: 36px; }
		.document-page-description { font-size: 16px; }
	}
	@media (prefers-reduced-motion: reduce) {
		.command-back,
		.branch-switch,
		.icon-action,
		.tree-more,
		.canvas-icon-action,
		.tree-node-toggle,
		.tree-group-toggle,
		.tree-page { transition: none; }
	}
</style>
