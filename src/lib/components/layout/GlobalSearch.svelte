<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
import { AlertTriangle, Box, Compass, FileText, Heart, History, Inbox, Search, UserSquare } from 'reicon-svelte';
import { publicSearchKinds, publicSearchRecords, workspaceSearchKinds } from '$lib/search/search';
import type { SearchKind, SearchRecord } from '$lib/search/types';
	import type { AppSurface } from '$lib/routing/surfaces';

	let {
		open = false,
		initialQuery = '',
		surface = 'public',
		onClose
	}: {
		open?: boolean;
		initialQuery?: string;
		surface?: AppSurface;
		onClose?: () => void;
	} = $props();

	let query = $state('');
	let kind = $state<'All' | SearchKind>('All');
	let selectedIndex = $state(0);
	let inputEl = $state<HTMLInputElement | undefined>(undefined);
	let dialogEl = $state<HTMLDialogElement | undefined>(undefined);
	type SearchRunner = (query: string, kind: 'All' | SearchKind) => SearchRecord[];
	let workspaceSearchRecords = $state<SearchRunner | undefined>(undefined);
	let workspaceSearchLoading = $state(false);

	const icons: Record<SearchKind, typeof Search> = {
		Product: Box,
		Decision: Compass,
		Problem: Compass,
		Release: History,
		Feedback: Inbox,
		Roadmap: Compass,
		Doc: FileText,
		Incident: AlertTriangle,
		Proof: Heart,
		Maker: UserSquare
	};

	let availableSearchKinds = $derived(surface === 'public' ? publicSearchKinds : workspaceSearchKinds);
	let results = $derived(surface === 'public' ? publicSearchRecords(query, kind) : workspaceSearchRecords ? workspaceSearchRecords(query, kind) : []);
	let visibleResults = $derived(results.slice(0, 12));

	async function loadWorkspaceSearch() {
		if (workspaceSearchRecords || workspaceSearchLoading) return;
		workspaceSearchLoading = true;
		try {
			const module = await import('$lib/search/workspace-search');
			workspaceSearchRecords = module.workspaceSearchRecords;
		} finally {
			workspaceSearchLoading = false;
		}
	}

	$effect(() => {
		if (open) {
			query = initialQuery;
			kind = 'All';
			selectedIndex = 0;
			if (surface === 'workspace') void loadWorkspaceSearch();
			tick().then(() => inputEl?.focus());
		}
	});

	function close() {
		onClose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, Math.max(visibleResults.length - 1, 0));
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
			return;
		}
		if (event.key === 'Tab' && dialogEl) {
			const focusable = Array.from(dialogEl.querySelectorAll<HTMLElement>('button, input, a[href], [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'));
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (!first || !last) return;
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
			return;
		}
		if (event.key === 'Enter' && visibleResults[selectedIndex]) {
			event.preventDefault();
			goto(visibleResults[selectedIndex].href);
			close();
		}
	}

	function labelFor(record: SearchRecord): string {
		return record.kind === 'Doc' ? 'Help' : record.kind === 'Decision' ? 'Product decision' : record.kind === 'Problem' ? 'Problem' : record.kind === 'Incident' ? 'Service problem' : record.kind === 'Proof' ? 'Customer story' : record.kind === 'Release' ? 'Product update' : record.kind;
	}

	function filterLabel(item: 'All' | SearchKind): string {
		return item === 'All' ? 'Everything' : item === 'Doc' ? 'Help' : item === 'Decision' ? 'Decisions' : item === 'Problem' ? 'Problems' : item === 'Incident' ? 'Service problems' : item === 'Proof' ? 'Customer stories' : item === 'Release' ? 'Product updates' : `${item}s`;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[calc(var(--pc-header-h)+18px)] sm:pt-[calc(var(--pc-header-h)+32px)]">
			<button class="absolute inset-0 bg-black/40 backdrop-blur-[16px] saturate-[140%] supports-[backdrop-filter]:bg-black/30" onclick={close} aria-label="Close search"></button>

		<dialog
			open
			bind:this={dialogEl}
			aria-modal="true"
			aria-label="Global search"
			class="relative z-10 w-full max-w-[720px] overflow-hidden rounded-[22px] bg-[var(--pc-bg)]/80 backdrop-blur-[20px] saturate-[180%] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.25)] supports-[backdrop-filter]:bg-[var(--pc-bg)]/70"
		>
			<div class="flex items-center gap-3 px-4 py-3.5">
				<Search size={20} weight="Outline" class="shrink-0 opacity-60" />
				<input
					bind:this={inputEl}
					bind:value={query}
					onkeydown={handleKeydown}
					type="search"
					autocomplete="off"
					autocorrect="off"
					spellcheck="false"
					placeholder={surface === 'public' ? 'Search products, updates, and help...' : 'Search your product work...'}
					class="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--pc-text-faint)] sm:text-sm"
					aria-label={surface === 'public' ? 'Search public Product Client pages' : 'Search workspace Product Client records'}
				/>
				{#if query}
					<button class="grid size-9 shrink-0 place-items-center rounded-full text-xs text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]" onclick={() => (query = '')} aria-label="Clear search">Clear</button>
				{/if}
				<kbd class="hidden shrink-0 rounded-[8px] bg-[var(--pc-surface)] px-2 py-1 text-xs text-[var(--pc-text-faint)] sm:inline">Esc</kbd>
			</div>

			<div class="flex gap-1 overflow-x-auto border-y border-[var(--pc-border-strong)]/50 px-4 py-2 scrollbar-none">
				{#each availableSearchKinds as item}
					<button
						class="h-9 shrink-0 rounded-full px-3 text-xs transition-[background-color,color] duration-150 {kind === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)]'}"
						onclick={() => { kind = item; selectedIndex = 0; }}
						aria-pressed={kind === item}
					>
						{filterLabel(item)}
					</button>
				{/each}
			</div>

			<div class="max-h-[min(62vh,560px)] overflow-y-auto p-2">
				{#if surface === 'workspace' && !workspaceSearchRecords}
					<div class="flex flex-col items-center px-6 py-12 text-center">
						<p class="text-sm font-medium">Loading your product work...</p>
						<p class="mt-1 max-w-[34ch] text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-65">Your team records stay out of public search.</p>
					</div>
				{:else if !query.trim()}
					<div class="px-3 pb-2 pt-3">
						<div class="flex items-center justify-between">
							<p class="text-xs font-medium text-[var(--pc-text-muted)]">Jump back in</p>
							<span class="text-xs text-[var(--pc-text-faint)]">{results.length} available</span>
						</div>
						<p class="mt-1 text-xs text-[var(--pc-text-faint)]">{surface === 'public' ? 'Search products, updates, help pages, and customer stories.' : 'Search by product, person, status, or the words in a message.'}</p>
					</div>
				{:else if visibleResults.length === 0}
					<div class="flex flex-col items-center px-6 py-12 text-center">
						<div class="grid size-10 place-items-center rounded-full bg-[var(--pc-surface)]"><Search size={16} weight="Outline" class="opacity-55" /></div>
						<p class="mt-3 text-sm font-medium">No matching records</p>
						<p class="mt-1 max-w-[34ch] text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-65">{surface === 'public' ? 'Try a product name, an update, a help page, or a customer story.' : 'Try a product name, a decision, a customer request, or a status like "monitoring".'}</p>
					</div>
				{:else}
					<div class="space-y-1">
						{#each visibleResults as result, index (result.kind + result.id)}
							{@const Icon = icons[result.kind]}
							<a
								href={result.href}
								target={result.href.startsWith('http') ? '_blank' : undefined}
								rel={result.href.startsWith('http') ? 'noopener noreferrer' : undefined}
								onclick={close}
								onmouseenter={() => (selectedIndex = index)}
								class="flex items-start gap-3 rounded-[14px] px-3 py-3 transition-[background-color] duration-100 {selectedIndex === index ? 'bg-[var(--pc-surface)]' : 'hover:bg-[var(--pc-surface)]'}"
								aria-current={selectedIndex === index ? 'true' : undefined}
							>
								<span class="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)]"><Icon size={16} weight="Outline" /></span>
								<span class="min-w-0 flex-1">
									<span class="flex items-center gap-2">
										<strong class="min-w-0 truncate text-[13px] font-medium">{result.title}</strong>
										<span class="shrink-0 text-xs font-semibold tracking-[0.08em] uppercase leading-[1.1] text-[var(--pc-text-faint)]">{labelFor(result)}</span>
									</span>
									<span class="mt-0.5 block truncate text-xs text-[var(--pc-text-muted)] opacity-70">{result.subtitle}</span>
									<span class="mt-1 block line-clamp-1 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-55">{result.description}</span>
									{#if result.relationPreview}<span class="mt-1 block truncate text-xs text-[var(--pc-accent-light)] opacity-80">Related: {result.relationPreview}</span>{/if}
								</span>
								{#if result.status}<span class="hidden shrink-0 rounded-full bg-[var(--pc-surface-2)] px-2 py-1 text-xs text-[var(--pc-text-muted)] sm:inline">{result.status}</span>{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-between bg-[var(--pc-surface)] px-4 py-2 text-xs text-[var(--pc-text-faint)]">
				<span role="status" aria-live="polite">{query.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : surface === 'public' ? 'Public Product Client search' : 'Workspace search'}</span>
				<span class="hidden gap-3 sm:inline-flex"><span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span></span>
			</div>
		</dialog>
	</div>
{/if}

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
