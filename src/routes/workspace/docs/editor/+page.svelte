<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Add, ArrowLeft, ChevronDown, Code, Eye, FileText, Save, Search, Settings, Trash } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import { Tree, TreeFolder, TreeFile } from 'components-svelte';
	import EditorBlockSurface from '$lib/components/docs/EditorBlockSurface.svelte';
	import { docsBlocksToMarkdown, markdownToDocsBlocks, normalizeDocsSiteConfig, starterDocsDocument, starterSiteConfig, type DocsBlock, type DocsDocument, type DocsPage, type DocsSiteConfig } from '$lib/data/docsEditor';
import { supabase } from '$lib/supabaseClient';
import { tooltip } from '$lib/components/Tooltip.svelte';
import { activeProductStore, hydrateActiveProduct } from '$lib/stores/activeProduct.svelte';

	type EditorResponse = {
		ok?: boolean;
		code?: string;
		message?: string;
		draft?: DocsDocument;
		version?: number;
		publishedVersion?: number;
		publishedAt?: string | null;
		publicationState?: 'unpublished' | 'syncing' | 'published' | 'failed';
		publicationError?: string | null;
		publishedHash?: string | null;
		publishedReleaseId?: string | null;
		warning?: string;
		migrated?: boolean;
	};

	let doc = $state<DocsDocument>(structuredClone(starterDocsDocument));
	let siteConfig = $state<DocsSiteConfig>(structuredClone(starterSiteConfig));
	let savedSignature = $state(JSON.stringify({ doc: starterDocsDocument, siteConfig: starterSiteConfig }));
	let version = $state(0);
	let publishedVersion = $state(0);
	let publicationState = $state<'unpublished' | 'syncing' | 'published' | 'failed'>('unpublished');
	let publicationError = $state<string | null>(null);
	let selectedPageId = $state<string | null>(null);
	let mode = $state<'visual' | 'markdown'>('visual');
	let loading = $state(true);
	let saving = $state(false);
	let publishing = $state(false);
	let githubLink = $state<{ repo_full_name: string; branch: string; deploy_branch?: string | null; last_sha: string | null; last_error: string | null } | null>(null);
	let errorMessage = $state('');
	// Loop 2: removed expandedViews/expandedGroups — mature TreeFolder owns open state internally
	// via defaultOpen (uncontrolled). Keeping duplicate mirrors caused drift + dead writes.
	let branchMenuOpen = $state(false);
	let publishMenuOpen = $state(false);
	let treeAddMenuOpen = $state(false);
	let searchOpen = $state(false);
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement | null>(null);
	let editorSurface = $state<'navigation' | 'site-config'>('navigation');
	let siteConfigSection = $state('general');
	let editorBlocks = $state<DocsBlock[]>([]);
	let editorBlockPageId = '';

	function cloneSnapshot<T>(value: T): T {
		return structuredClone($state.snapshot(value)) as T;
	}

	function draftSnapshot(): DocsDocument {
		return { ...$state.snapshot(doc), siteConfig: $state.snapshot(siteConfig) };
	}

	function currentSignature(): string {
		return JSON.stringify({ doc: $state.snapshot(doc), siteConfig: $state.snapshot(siteConfig) });
	}

	const siteConfigSections = [
		{ id: 'general', label: 'General', icon: Settings },
		{ id: 'brand', label: 'Brand & Theme', icon: Eye },
		{ id: 'header', label: 'Header & Navigation', icon: ArrowLeft },
		{ id: 'seo', label: 'SEO & Agents', icon: Search },
		{ id: 'contextual', label: 'Contextual actions', icon: Add },
		{ id: 'footer', label: 'Footer', icon: FileText }
	] as const;


	let currentPage = $derived(doc.pages.find((page) => page.id === selectedPageId) ?? null);
	let currentSiteSection = $derived(siteConfigSections.find((section) => section.id === siteConfigSection) ?? siteConfigSections[0]);
	let dirty = $derived(JSON.stringify({ doc: $state.snapshot(doc), siteConfig: $state.snapshot(siteConfig) }) !== savedSignature);
	let orderedViews = $derived([...doc.views].sort((a, b) => a.order - b.order));
	// Loop 1: memoize grouping/sorting — was O(n*m) filter+sort inline per group per render.
	// Keys are view/group ids; values are pre-sorted page arrays. Single source for Tree rendering.
	let pagesByGroup = $derived.by(() => {
		const map = new Map<string | null, DocsPage[]>();
		for (const p of doc.pages) {
			const key = p.groupId ?? null;
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(p);
		}
		for (const list of map.values()) list.sort((a, b) => a.order - b.order);
		return map;
	});
	let sortedGroupsByView = $derived.by(() => {
		const map = new Map<string, { id: string; label: string; order: number }[]>();
		for (const v of orderedViews) map.set(v.id, [...v.groups].sort((a, b) => a.order - b.order));
		return map;
	});
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

	function selectPage(id: string, opts: { focusTreeItem?: boolean } = {}) {
		selectedPageId = id;
		editorSurface = 'navigation';
		errorMessage = '';
		// Loop 3: keep keyboard focus in Tree (single-tab-stop delight) + ensure visible.
		// Without this, mouse users are fine but keyboard/AT users lose place after search/create/delete.
		if (opts.focusTreeItem && browser) {
			queueMicrotask(() => {
				const wrap = document.querySelector(`.editor-tree .tree-page-wrapper[data-page-id="${CSS.escape(id)}"]`);
				const item = wrap?.querySelector<HTMLElement>('[role="treeitem"]');
				item?.focus({ preventScroll: true });
				item?.scrollIntoView({ block: 'nearest' });
			});
		}
	}

	function setMode(nextMode: 'visual' | 'markdown') {
		mode = nextMode;
		if (nextMode === 'visual' && currentPage) {
			editorBlocks = cloneSnapshot(blocksForPage(currentPage));
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

	function updateNavLink(index: number, field: 'label' | 'href', value: string) {
		const link = siteConfig.navbar.links[index];
		if (link) link[field] = value;
	}

	function addNavLink() {
		siteConfig.navbar.links.push({ label: 'New link', href: '/', variant: 'link' });
	}

	function removeNavLink(index: number) {
		siteConfig.navbar.links.splice(index, 1);
	}

	function toggleContextualOption(option: string, enabled: boolean) {
		const options = siteConfig.contextual.options;
		if (enabled && !options.includes(option)) options.push(option);
		if (!enabled) siteConfig.contextual.options = options.filter((item) => item !== option);
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
		selectPage(id, { focusTreeItem: true });
		closeSearch();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			branchMenuOpen = false;
			publishMenuOpen = false;
			treeAddMenuOpen = false;
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
			treeAddMenuOpen = false;
		}
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
		editorBlocks = cloneSnapshot(nextBlocks);
		page.blocks = cloneSnapshot(nextBlocks);
		page.markdown = docsBlocksToMarkdown(nextBlocks);
	}

	function ensureViewAndGroup() {
		if (doc.views.length === 0) doc.views.push({ id: crypto.randomUUID(), label: 'Documentation', kind: 'tabs', order: 0, groups: [] });
		const view = doc.views[0];
		if (view.groups.length === 0) view.groups.push({ id: crypto.randomUUID(), label: 'Getting started', order: 0 });
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
		// Loop 3: new page must land focus in Tree so keyboard users aren't stranded in Add menu.
		if (browser) {
			queueMicrotask(() => {
				const wrap = document.querySelector(`.editor-tree .tree-page-wrapper[data-page-id="${CSS.escape(page.id)}"]`);
				wrap?.querySelector<HTMLElement>('[role="treeitem"]')?.focus({ preventScroll: true });
				wrap?.scrollIntoView({ block: 'nearest' });
			});
		}
	}

	function createGroup(viewId?: string) {
		const target = doc.views.find((candidate) => candidate.id === viewId) ?? doc.views[0] ?? ensureViewAndGroup().view;
		const group = { id: crypto.randomUUID(), label: 'New section', order: target.groups.length };
		target.groups.push(group);
	}

	function createView() {
		doc.views.push({ id: crypto.randomUUID(), label: 'New view', kind: 'tabs', order: doc.views.length, groups: [] });
	}

	function deleteSelectedPage() {
		if (!selectedPageId) return;
		const deletedId = selectedPageId;
		const remaining = doc.pages.filter((page) => page.id !== deletedId);
		doc.pages = remaining;
		// Loop 3: collapse-then-focus-parent (APG 2.4.3) — never strand focus on a removed node.
		selectedPageId = remaining[0]?.id ?? null;
		if (browser) {
			queueMicrotask(() => {
				const next = selectedPageId
					? document.querySelector(`.editor-tree .tree-page-wrapper[data-page-id="${CSS.escape(selectedPageId)}"] [role="treeitem"]`)
					: document.querySelector<HTMLElement>('.editor-tree .tree-heading .icon-action');
				(next as HTMLElement | null)?.focus?.({ preventScroll: true });
			});
		}
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
		siteConfig = normalizeDocsSiteConfig(result.draft?.siteConfig);
		version = result.version ?? 0;
		publishedVersion = result.publishedVersion ?? 0;
		publicationState = result.publicationState ?? 'unpublished';
		publicationError = result.publicationError ?? null;
		if (publicationState === 'failed' && publicationError) errorMessage = publicationError;
		savedSignature = result.migrated || !result.draft?.siteConfig ? '' : currentSignature();
		selectedPageId = doc.pages[0]?.id ?? null;
		// TreeFolder defaultOpen handles initial expansion; no mirror state needed.
	}

	async function readGithubLink() {
		const productId = activeProductStore.activeProduct?.id;
		if (!productId || productId.startsWith('mock-')) return;
		const token = await sessionToken();
		if (!token) return;
		const response = await fetch(`/api/github/link?product_id=${encodeURIComponent(productId)}`, { headers: { authorization: `Bearer ${token}` } });
		const result = await response.json().catch(() => null);
		githubLink = result?.ok && result.link ? result.link : null;
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
				body: JSON.stringify({ draft: draftSnapshot(), version })
			});
			const result = (await response.json().catch(() => null)) as EditorResponse | null;
			if (!response.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not save the draft.');
			version = result.version ?? version + 1;
			savedSignature = currentSignature();
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
			if ((dirty || version === 0) && !(await saveDraft())) return;
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
			publicationState = 'published';
			publicationError = null;
		} catch (error) {
			publicationState = 'failed';
			errorMessage = error instanceof Error ? error.message : 'Could not publish the documentation.';
		} finally {
			publishing = false;
		}
	}

	$effect(() => {
		if (currentPage && currentPage.id !== editorBlockPageId) {
			editorBlocks = cloneSnapshot(blocksForPage(currentPage));
			editorBlockPageId = currentPage.id;
		}
		if (searchOpen && searchInput) searchInput.focus();
	});

	// Loop 1: components-svelte TreeFile hardcodes aria-selected=false with no selected prop.
	// Mirror selection onto the inner role=treeitem so SR users hear the current page.
	// Runs on selectedPageId change; scoped to .tree-list to avoid touching other trees.
	$effect(() => {
		if (!browser) return;
		const selected = selectedPageId;
		// depend on selected + pages so it re-runs after Tree re-renders
		void (doc.pages.length, orderedViews.length);
		queueMicrotask(() => {
			const root = document.querySelector('.editor-tree .tree-list');
			if (!root) return;
			root.querySelectorAll<HTMLElement>('.tree-page-wrapper').forEach((wrap) => {
				const isActive = wrap.dataset.pageId === selected;
				const item = wrap.querySelector<HTMLElement>('[role="treeitem"]');
				if (item) {
					item.setAttribute('aria-selected', isActive ? 'true' : 'false');
					if (isActive) item.setAttribute('aria-current', 'page');
					else item.removeAttribute('aria-current');
				}
			});
		});
	});

	onMount(async () => {
		window.addEventListener('keydown', handleWindowKeydown);
		window.addEventListener('click', handleWindowClick);
		if (new URLSearchParams(window.location.search).get('tab') === 'settings') editorSurface = 'site-config';
		try {
			await hydrateActiveProduct();
			await readEditor();
			await readGithubLink();
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
				<button class="branch-switch" type="button" aria-label="Current branch" aria-expanded={branchMenuOpen} onclick={() => (branchMenuOpen = !branchMenuOpen)}><span class="branch-mark" aria-hidden="true"></span><span>{githubLink?.branch ?? 'main'}</span><ChevronDown size={13} weight="Outline" aria-hidden="true" /></button>
				{#if branchMenuOpen}
					<div class="editor-menu branch-menu" role="menu">
						<button class="menu-item selected" type="button" role="menuitem" onclick={() => (branchMenuOpen = false)}><span class="branch-mark" aria-hidden="true"></span><span>{githubLink?.branch ?? 'main'}</span><span class="menu-check">Configured</span></button>
						<a class="menu-item" href="/workspace/settings/git" role="menuitem" onclick={() => (branchMenuOpen = false)}>Change in Git settings</a>
					</div>
				{/if}
			</div>
			<div class="command-context-actions" aria-label="Documentation workspace sections">
				<button class:active={editorSurface === 'navigation'} class="command-context-action" type="button" aria-label="Navigation" aria-pressed={editorSurface === 'navigation'} onclick={() => setEditorSurface('navigation')}><span use:tooltip={{ text: 'Navigation', island: true }}><FileText size={15} weight="Outline" aria-hidden="true" /></span></button>
				<button class:active={editorSurface === 'site-config'} class="command-context-action" type="button" aria-label="Site config" aria-pressed={editorSurface === 'site-config'} onclick={() => setEditorSurface('site-config')}><span use:tooltip={{ text: 'Site config', island: true }}><Settings size={15} weight="Outline" aria-hidden="true" /></span></button>
			</div>
		</div>
		<div class="command-actions">
			{#if editorSurface === 'navigation'}
				<div class="mode-switch command-mode-switch" role="tablist" aria-label="Editor mode"><button class:active={mode === 'visual'} type="button" role="tab" aria-selected={mode === 'visual'} aria-label="Visual mode" onclick={() => setMode('visual')}><span use:tooltip={{ text: 'Visual mode', island: true }}><Eye size={14} weight="Outline" aria-hidden="true" /></span></button><button class:active={mode === 'markdown'} type="button" role="tab" aria-selected={mode === 'markdown'} aria-label="Markdown mode" onclick={() => setMode('markdown')}><span use:tooltip={{ text: 'Markdown mode', island: true }}><Code size={14} weight="Outline" aria-hidden="true" /></span></button></div>
				{#if currentPage}<button class="canvas-icon-action danger" type="button" aria-label="Remove page" onclick={deleteSelectedPage}><span use:tooltip={{ text: 'Remove page', island: true }}><Trash size={14} weight="Outline" aria-hidden="true" /></span></button>{/if}
			{/if}
			<span class="save-state" role="status">{#if saving}Saving…{:else if publicationState === 'syncing'}Publishing to Cloudflare…{:else if publicationState === 'failed'}Publish failed{:else if dirty}Unsaved changes{:else if version > 0}Saved{/if}</span>
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
				<div class="search-dialog-heading"><h2 id="docs-search-title">Find a page</h2><button class="icon-action" type="button" aria-label="Close search" onclick={closeSearch}>×</button></div>
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
						<h1>{currentSiteSection.label}</h1>
						<p>These values are part of the next published documentation release.</p>
					</div>
					{#if siteConfigSection === 'general'}
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Site Title</h2><p>Displayed in the browser tab and used by search engines.</p></div>
							<input class="site-config-input" aria-label="Site title" bind:value={siteConfig.name} maxlength="120" />
						</section>
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Site Description</h2><p>Appears in search results and social media link previews.</p></div>
							<textarea class="site-config-input site-config-textarea" aria-label="Site description" bind:value={siteConfig.description} maxlength="240"></textarea>
						</section>
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Canonical site URL</h2><p>The public origin used for canonical links and share previews.</p></div>
							<input class="site-config-input" type="url" aria-label="Canonical site URL" bind:value={siteConfig.siteUrl} placeholder="https://example.com" />
						</section>
				{:else if siteConfigSection === 'brand'}
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Brand name</h2><p>Used in the hosted header, navigation, and footer.</p></div>
							<input class="site-config-input" aria-label="Brand name" bind:value={siteConfig.brand} maxlength="80" />
						</section>
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Logo text</h2><p>Keep the light and dark variants aligned unless the mark changes between themes.</p></div>
							<div class="site-config-field-stack"><input class="site-config-input" aria-label="Light logo" bind:value={siteConfig.logo.light} placeholder="Light logo" /><input class="site-config-input" aria-label="Dark logo" bind:value={siteConfig.logo.dark} placeholder="Dark logo" /></div>
						</section>
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Color system</h2><p>Primary is the accent. Light and dark define the hosted page surfaces.</p></div>
							<div class="site-config-color-grid"><label>Primary<input class="site-config-input" type="color" aria-label="Primary color" bind:value={siteConfig.colors.primary} /></label><label>Light<input class="site-config-input" type="color" aria-label="Light color" bind:value={siteConfig.colors.light} /></label><label>Dark<input class="site-config-input" type="color" aria-label="Dark color" bind:value={siteConfig.colors.dark} /></label></div>
						</section>
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Favicon</h2><p>Public asset path used by the hosted browser tab.</p></div>
							<input class="site-config-input" aria-label="Favicon path" bind:value={siteConfig.favicon} placeholder="/favicon.svg" />
						</section>
				{:else if siteConfigSection === 'header'}
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Header controls</h2><p>Choose which utility controls appear in the hosted documentation header.</p></div>
							<div class="site-config-toggle-stack"><label class="site-config-toggle"><input type="checkbox" bind:checked={siteConfig.header.search} /><span>Search documentation</span></label><label class="site-config-toggle"><input type="checkbox" bind:checked={siteConfig.header.theme} /><span>Theme switcher</span></label></div>
						</section>
						<section class="site-config-row site-config-row-start">
							<div class="site-config-copy"><h2>Header links</h2><p>These links are rendered in the top-right hosted header.</p></div>
							<div class="site-config-list">
								{#each siteConfig.navbar.links as link, index}
									<div class="site-config-list-row"><input class="site-config-input" aria-label={`Header link ${index + 1} label`} value={link.label} oninput={(event) => updateNavLink(index, 'label', (event.currentTarget as HTMLInputElement).value)} /><input class="site-config-input" aria-label={`Header link ${index + 1} URL`} value={link.href} oninput={(event) => updateNavLink(index, 'href', (event.currentTarget as HTMLInputElement).value)} /><button class="site-config-remove" type="button" aria-label={`Remove ${link.label}`} onclick={() => removeNavLink(index)}>Remove</button></div>
								{/each}
								<button class="site-config-add" type="button" onclick={addNavLink}>+ Add header link</button>
							</div>
						</section>
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Primary action</h2><p>The emphasized action shown beside the header links.</p></div>
							{#if siteConfig.navbar.primary}<div class="site-config-field-stack"><input class="site-config-input" aria-label="Primary action label" bind:value={siteConfig.navbar.primary.label} /><input class="site-config-input" aria-label="Primary action URL" bind:value={siteConfig.navbar.primary.href} /></div>{/if}
						</section>
				{:else if siteConfigSection === 'seo'}
						<section class="site-config-row">
							<div class="site-config-copy"><h2>Search preview</h2><p>Review the same title and description that will be used by search engines.</p></div>
							<div class="site-config-preview"><strong>{siteConfig.name || 'Untitled documentation'}</strong><span>{siteConfig.siteUrl || 'https://example.com'}</span><p>{siteConfig.description || 'Add a description for your documentation site.'}</p></div>
						</section>
						<section class="site-config-row site-config-row-start">
							<div class="site-config-copy"><h2>AI agent guidance</h2><p>Included in the hosted agent context so answers prefer the right product sources.</p></div>
							<textarea class="site-config-input site-config-textarea" aria-label="AI agent guidance" bind:value={siteConfig.agentBlurb} maxlength="500"></textarea>
						</section>
				{:else if siteConfigSection === 'contextual'}
						<section class="site-config-row site-config-row-start">
							<div class="site-config-copy"><h2>Reader actions</h2><p>Choose which contextual actions are available on published pages.</p></div>
							<div class="site-config-toggle-stack">{#each ['copy', 'view', 'chatgpt', 'claude', 'perplexity', 'mcp', 'cursor', 'vscode'] as option}<label class="site-config-toggle"><input type="checkbox" checked={siteConfig.contextual.options.includes(option)} onchange={(event) => toggleContextualOption(option, (event.currentTarget as HTMLInputElement).checked)} /><span>{option}</span></label>{/each}</div>
						</section>
				{:else}
						<section class="site-config-row site-config-row-start">
							<div class="site-config-copy"><h2>Footer description</h2><p>Short supporting copy shown beneath the hosted brand.</p></div>
							<textarea class="site-config-input site-config-textarea" aria-label="Footer description" bind:value={siteConfig.footer.description} maxlength="180"></textarea>
						</section>
						<section class="site-config-row site-config-row-start">
							<div class="site-config-copy"><h2>Footer links</h2><p>Keep these focused on the pages readers need after finishing an article.</p></div>
							<div class="site-config-list">{#each siteConfig.footer.links as link}<div class="site-config-list-row"><span class="site-config-static-label">{link.label}</span><span class="site-config-static-label">{link.href}</span></div>{/each}</div>
						</section>
					{/if}
				</main>
			</section>
		{:else}
		<div class="editor-workspace">
			<aside class="editor-tree" aria-label="Documentation structure">
				<p class="tree-a11y-hint">Use arrow keys to move, Enter to open a page.</p>
				<div class="tree-heading">
					<div><h2>Your documentation</h2></div>
					<div class="menu-anchor">
						<button class="icon-action" type="button" aria-label="Add content" aria-haspopup="menu" aria-expanded={treeAddMenuOpen} onclick={() => (treeAddMenuOpen = !treeAddMenuOpen)}><span use:tooltip={{ text: 'Add page or section', island: true }}><Add size={15} weight="Outline" aria-hidden="true" /></span></button>
						{#if treeAddMenuOpen}
							<div class="editor-menu" style="left:auto; right:0; top: calc(100% + 6px);" role="menu">
								<button class="menu-item" type="button" role="menuitem" onclick={() => { treeAddMenuOpen = false; createPage(); }}><Add size={13} weight="Outline" /> New page</button>
								<button class="menu-item" type="button" role="menuitem" onclick={() => { treeAddMenuOpen = false; createGroup(); }}>New section</button>
								<button class="menu-item" type="button" role="menuitem" onclick={() => { treeAddMenuOpen = false; createView(); }}>New view</button>
							</div>
						{/if}
					</div>
				</div>
				{#if orderedViews.length === 0}
					<div class="tree-empty"><p>Start with a view, section, and page.</p><button class="text-button" type="button" onclick={() => createPage()}>Create first page</button></div>
				{:else}
					<div class="tree-list">
						<!-- Loop 1: mature Tree owns keyboard (arrows/Home/End/type-ahead), roving tabindex, expand/collapse.
						     No extra tab stops inside role=tree: group add-buttons moved to top Add menu.
						     Pages use keyed each + wrapper delegates mouse AND keyboard (Enter/Space on inner treeitem bubbles). -->
						<Tree>
							{#each orderedViews as view, viewIndex (view.id)}
								{@const viewGroupPages = (sortedGroupsByView.get(view.id) ?? []).reduce((n, g) => n + (pagesByGroup.get(g.id)?.length ?? 0), 0)}
								{@const isFirstView = viewIndex === 0}
								{@const ungroupedCount = isFirstView ? (pagesByGroup.get(null)?.length ?? 0) : 0}
								{@const viewCount = viewGroupPages + ungroupedCount}
								<TreeFolder name={viewCount ? `${view.label} · ${viewCount}` : view.label} defaultOpen>
									{#each sortedGroupsByView.get(view.id) ?? [] as group (group.id)}
										{@const groupCount = pagesByGroup.get(group.id)?.length ?? 0}
										<TreeFolder name={groupCount ? `${group.label} · ${groupCount}` : group.label} defaultOpen>
											{#each pagesByGroup.get(group.id) ?? [] as page (page.id)}
												<div
													role="presentation"
													data-page-id={page.id}
													data-selected={selectedPageId === page.id}
													onclick={() => selectPage(page.id)}
													onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPage(page.id); } }}
													class="tree-page-wrapper {selectedPageId === page.id ? 'active' : ''}"
												>
													<TreeFile name={page.title || 'Untitled page'} />
												</div>
											{/each}
										</TreeFolder>
									{/each}
									{#if isFirstView}
										{#each pagesByGroup.get(null) ?? [] as page (page.id)}
											<div
												role="presentation"
												data-page-id={page.id}
												data-selected={selectedPageId === page.id}
												onclick={() => selectPage(page.id)}
												onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPage(page.id); } }}
												class="tree-page-wrapper {selectedPageId === page.id ? 'active' : ''}"
											>
												<TreeFile name={page.title || 'Untitled page'} />
											</div>
										{/each}
									{/if}
								</TreeFolder>
							{/each}
						</Tree>
					</div>
				{/if}
			</aside>

			<main class="editor-canvas" aria-label="Page editor">
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
	.mode-switch {
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
	.editor-menu { position: absolute; z-index: 20; top: calc(100% + 7px); min-width: 210px; padding: 5px; border: 1px solid var(--editor-border); border-radius: 10px; background: var(--pc-bg); opacity: 1; backdrop-filter: none; box-shadow: inset 0 1px 0 color-mix(in oklch, var(--pc-text) 6%, transparent); }
	.branch-menu { left: 0; }
	.publish-menu { right: 0; }
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

		.editor-workspace { display: grid; grid-template-columns: var(--editor-sidebar-width) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); align-items: stretch; flex: 1; min-height: 0; border-bottom: 0; overflow: hidden; background: var(--pc-bg); }
	.editor-tree { min-width: 0; min-height: 0; height: 100%; background: var(--pc-bg); }
	.editor-tree { display: flex; flex-direction: column; padding: 18px 14px 14px; border-right: 1px solid var(--editor-border); overflow: hidden; min-height: 0; }
	.tree-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 7px 16px 9px; }
	.tree-heading h2 { margin-top: 4px; color: var(--pc-text); font-size: 13px; font-weight: 600; letter-spacing: -.01em; }
	.tree-heading h2 { margin-top: 0; }
	.icon-action { display: grid; place-items: center; width: 28px; height: 28px; border-color: var(--editor-border); border-radius: 9px; }
	.icon-action:hover,
	.canvas-icon-action:hover { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface-2); }
	.tree-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; scrollbar-gutter: stable; padding: 2px 2px 8px; }
	/* Loop 2: deleted dead custom-tree CSS (tree-node-toggle/group-toggle/view-row/branch/page/more/count).
	   Mature Tree owns those states now; keeping them hid real warnings + shipped dead bytes. */
	.text-button { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; color: var(--editor-muted); background: none; cursor: pointer; font-size: 12px; font-weight: 500; }
	.text-button:hover { color: var(--pc-text); }
	/* Loop 4: AT hint — sighted users get arrows for free; SR/keyboard users get the contract. */
	.tree-a11y-hint { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
	.tree-empty { margin: 18px 8px; color: var(--editor-muted); font-size: 12px; line-height: 1.5; }
	.tree-empty p { margin-bottom: 10px; }

	/* Loop 1+3: mature Tree theming — components-svelte ships stone-*/ /* light-first classes.
	   Map to pc- tokens so dark #0d0d0d keeps contrast; keep library keyboard/ARIA intact.
	   Icon exception: TreeFolder/File own their lucide folder/file glyphs (aria-hidden, decorative).
	   Project reicon-only rule stays for our UI; forking the package to swap its internal icons
	   would break mature keyboard/selection updates. Name text carries meaning. */
	.tree-list :global([role="tree"]):focus-visible { outline: 1px solid var(--pc-focus-ring); outline-offset: 2px; }
	.tree-list :global([role="treeitem"]):focus-visible { outline: 1px solid var(--pc-focus-ring); outline-offset: -1px; }
	.tree-list :global([data-component-part="tree-folder"] [role="treeitem"]),
	.tree-list :global([data-component-part="tree-file"]) { color: var(--pc-text-muted); }
	.tree-list :global([data-component-part="tree-folder"] [role="treeitem"]:hover),
	.tree-list :global([data-component-part="tree-file"]:hover) { color: var(--pc-text); background: var(--pc-surface); }
	/* Selected page: wrapper carries state (TreeFile has no selected prop). */
	.tree-page-wrapper { border-radius: 9px; }
	.tree-page-wrapper.active :global([data-component-part="tree-file"]) { color: var(--pc-text); background: var(--pc-surface-2); border: 1px solid var(--editor-border); }
	.tree-page-wrapper.active :global([data-component-part="tree-file"]:hover) { background: var(--pc-surface-2); }

	.editor-canvas { display: flex; min-width: 0; min-height: 0; height: 100%; flex-direction: column; background: var(--pc-bg); overflow: hidden; }
	.mode-switch { gap: 2px; padding: 2px; border: 1px solid var(--editor-border); border-radius: 8px; }
	.command-mode-switch button { min-width: 28px; padding: 0; justify-content: center; }
	.mode-switch button { display: inline-flex; align-items: center; gap: 5px; min-height: 26px; padding: 0 8px; border: 1px solid transparent; border-radius: 6px; color: var(--editor-faint); background: transparent; cursor: pointer; font-size: 11px; }
	.mode-switch button:hover { color: var(--editor-muted); }
	.mode-switch button.active { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface); }
	.canvas-icon-action { display: grid; place-items: center; width: 29px; height: 29px; border-radius: 8px; }
	.canvas-icon-action.danger { color: color-mix(in oklch, var(--red-6) 75%, var(--editor-muted)); }
	.canvas-icon-action.danger:hover { border-color: color-mix(in oklch, var(--red-6) 40%, var(--editor-border)); color: var(--red-6); background: color-mix(in oklch, var(--red-6) 10%, transparent); }
	.canvas-scroll { flex: 1; min-height: 0; padding-inline: 48px; overflow-y: auto; overflow-x: hidden; overscroll-behavior-y: contain; scrollbar-gutter: stable; }
	/* Bottom breathing room: fixed-overlay desktop owns its scroll, so it needs
	   its own bottom inset above the viewport edge (+ safe-area). The workspace
	   main's pb-20 lg:pb-0 already clears the mobile nav (lg:hidden) when the
	   editor flows at <=1024, so inner pad stays modest there. 72px mirrors the
	   original 92px intent without double-padding the workspace main. */
	.canvas-sheet { width: min(100%, var(--editor-content-max)); margin: 0 auto; padding: 22px 0 calc(72px + env(safe-area-inset-bottom, 0px)); }
	.writing-surface { display: block; width: 100%; min-height: 480px; border: 0; outline: 0; resize: vertical; color: var(--pc-text); background: transparent; font: inherit; font-size: 15px; line-height: 1.6; }
	.writing-surface::placeholder { color: var(--editor-faint); }
	.markdown-mode { font-family: var(--font-mono, ui-monospace, monospace); font-size: 13px; letter-spacing: -.005em; line-height: 1.55; }

	.site-config-shell { display: grid; grid-template-columns: 258px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); align-items: stretch; flex: 1; min-height: 0; overflow: hidden; border-bottom: 0; background: var(--pc-bg); }
	.site-config-sidebar { min-width: 0; min-height: 0; height: 100%; overflow-y: auto; overflow-x: hidden; scrollbar-gutter: stable; padding: 22px 12px 26px; border-right: 1px solid var(--editor-border); }
	.site-config-sidebar-title { padding: 0 10px 18px; color: var(--pc-text); font-size: 15px; font-weight: 650; letter-spacing: -.02em; }
	.site-config-nav { display: grid; gap: 3px; }
	.site-config-nav-item { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 38px; padding: 0 11px; border: 1px solid transparent; border-radius: 9px; color: var(--editor-muted); background: transparent; cursor: pointer; font: inherit; font-size: 13px; text-align: left; transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease; }
	.site-config-nav-item:hover,
	.site-config-nav-item:focus-visible { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface); outline: 0; }
	.site-config-nav-item.active { border-color: var(--editor-border); color: var(--pc-text); background: var(--pc-surface-2); font-weight: 600; }
	.site-config-nav-item :global(svg) { flex: 0 0 auto; color: var(--editor-faint); }
	.site-config-nav-item.active :global(svg) { color: var(--pc-text); }
	.site-config-main { min-width: 0; min-height: 0; height: 100%; overflow-y: auto; overflow-x: hidden; padding: 38px clamp(30px, 6vw, 96px) calc(100px + env(safe-area-inset-bottom, 0px)); scrollbar-gutter: stable; }
	.site-config-heading { width: min(100%, 1080px); margin: 0 auto; padding-bottom: 22px; border-bottom: 1px solid var(--editor-border); }
	.site-config-heading h1 { margin-top: 7px; color: var(--pc-text); font-size: clamp(24px, 2.2vw, 32px); font-weight: 650; letter-spacing: -.045em; line-height: 1.1; }
	.site-config-heading p { max-width: 620px; margin-top: 9px; color: var(--editor-muted); font-size: 13px; line-height: 1.5; }
	.site-config-row { display: grid; grid-template-columns: minmax(220px, .68fr) minmax(280px, 1fr); align-items: center; gap: clamp(30px, 5vw, 80px); width: min(100%, 1080px); margin: 0 auto; padding: 34px 0; border-bottom: 1px solid var(--editor-border); }
	.site-config-row-start { align-items: start; }
	.site-config-copy { max-width: 320px; }
	.site-config-copy h2 { color: var(--pc-text); font-size: 16px; font-weight: 600; letter-spacing: -.02em; }
	.site-config-copy p { margin-top: 8px; color: var(--editor-muted); font-size: 14px; line-height: 1.55; }
	.site-config-input { width: 100%; min-height: 46px; padding: 0 14px; border: 1px solid var(--editor-border); border-radius: 9px; outline: 0; color: var(--pc-text); background: var(--pc-bg); font: inherit; font-size: 14px; transition: border-color 120ms ease, background-color 120ms ease; }
	.site-config-input:hover,
	.site-config-input:focus-visible { border-color: color-mix(in oklch, var(--pc-text) 38%, var(--editor-border)); background: var(--pc-surface); outline: 0; }
	.site-config-textarea { min-height: 96px; padding-block: 12px; resize: vertical; line-height: 1.5; }
	.site-config-field-stack { display: grid; gap: 10px; }
	.site-config-color-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
	.site-config-color-grid label { display: grid; gap: 7px; color: var(--editor-muted); font-size: 12px; }
	.site-config-color-grid .site-config-input { min-height: 46px; padding: 5px; }
	.site-config-toggle-stack { display: grid; gap: 11px; }
	.site-config-toggle { display: flex; align-items: center; gap: 10px; min-height: 28px; color: var(--pc-text); font-size: 13px; }
	.site-config-toggle input { width: 16px; height: 16px; accent-color: var(--pc-text); }
	.site-config-list { display: grid; gap: 10px; }
	.site-config-list-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; gap: 8px; align-items: center; }
	.site-config-list-row .site-config-input { min-width: 0; }
	.site-config-static-label { min-height: 46px; padding: 13px 14px; overflow: hidden; border: 1px solid var(--editor-border); border-radius: 9px; color: var(--editor-muted); background: var(--pc-bg); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
	.site-config-remove,
	.site-config-add { border: 0; color: var(--editor-muted); background: transparent; cursor: pointer; font: inherit; font-size: 12px; text-align: left; }
	.site-config-remove:hover,
	.site-config-add:hover { color: var(--pc-text); }
	.site-config-preview { display: grid; gap: 5px; padding: 16px; border: 1px solid var(--editor-border); border-radius: 10px; background: var(--pc-surface); }
	.site-config-preview strong { color: var(--pc-text); font-size: 15px; }
	.site-config-preview span { overflow: hidden; color: var(--editor-faint); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
	.site-config-preview p { color: var(--editor-muted); font-size: 13px; line-height: 1.45; }

	.document-editor-surface { box-sizing: border-box; width: 100%; max-width: 1040px; margin: 0 auto; padding: 28px clamp(22px, 5vw, 72px) calc(72px + env(safe-area-inset-bottom, 0px)); background: var(--pc-bg); min-width: 0; overflow-wrap: anywhere; }
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
	/* Phone: stack editor + site-config; tablet (681-1024) keeps grid but
	   flows inside workspace scroller (see +layout 1024 switch). Both ranges
	   must delegate scroll to the workspace's flex-1 overflow-y-auto, so inner
	   scrollers become overflow:visible (no nested clip) and bottom pad adds
	   safe-area + modest inset — workspace main's pb-20 already clears mobile nav. */
	@media (max-width: 1024px) {
		.docs-editor-shell { height: auto; min-height: calc(100dvh - var(--pc-header-h)); overflow: visible; }
		.editor-workspace,
		.site-config-shell,
		.editor-tree,
		.site-config-sidebar,
		.editor-canvas,
		.site-config-main,
		.canvas-scroll,
		.tree-list { overflow: visible; }
		.site-config-main,
		.canvas-scroll,
		.tree-list { max-height: none; }
	}
	@media (max-width: 680px) {
		.editor-commandbar { align-items: flex-start; flex-direction: column; gap: 7px; padding: 8px; }
		.command-leading,
		.command-actions { width: 100%; }
		.command-actions { justify-content: flex-end; }
		.editor-workspace { display: block; height: auto; min-height: 0; }
		.site-config-shell { display: block; height: auto; min-height: 0; }
		.site-config-sidebar { border-right: 0; border-bottom: 1px solid var(--editor-border); }
		.site-config-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.site-config-main { padding: 28px 20px calc(72px + env(safe-area-inset-bottom, 0px)); }
		.site-config-row { display: block; padding: 24px 0; }
		.site-config-input { margin-top: 16px; }
		.site-config-field-stack,
		.site-config-toggle-stack,
		.site-config-list,
		.site-config-preview { margin-top: 16px; }
		.site-config-list-row { grid-template-columns: 1fr; }
		.site-config-list-row .site-config-remove { margin-top: -4px; }
		.site-config-color-grid { margin-top: 16px; }
		.editor-tree { min-height: 0; border-right: 0; border-bottom: 1px solid var(--editor-border); }
				.editor-canvas { min-height: 0; }
		.canvas-scroll { padding-inline: 20px; }
		.canvas-sheet { padding: 36px 0 calc(36px + env(safe-area-inset-bottom, 0px)); }
		.document-editor-surface { min-height: 0; padding: 20px 0 calc(36px + env(safe-area-inset-bottom, 0px)); }
		.document-page-title { font-size: 36px; }
		.document-page-description { font-size: 16px; }
	}
	@media (prefers-reduced-motion: reduce) {
		.command-back,
		.branch-switch,
		.icon-action,
		.canvas-icon-action { transition: none; }
	}
</style>
