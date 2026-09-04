<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowRight, Search } from 'reicon-svelte';
	import { workspaceSearchRecords } from '$lib/search/workspace-search';

	let { placeholder }: { placeholder: string } = $props();
	let query = $state('');
	let results = $derived(query.trim() ? workspaceSearchRecords(query).slice(0, 5) : []);

	function submitSearch() {
		const next = query.trim();
		void goto(next ? `/workspace/search?q=${encodeURIComponent(next)}` : '/workspace/search');
	}

	function labelFor(kind: string): string {
		return kind === 'Doc' ? 'Help' : kind === 'Decision' ? 'Decision' : kind === 'Problem' ? 'Problem' : kind === 'Incident' ? 'Service problem' : kind === 'Release' ? 'Product update' : kind;
	}
</script>

<div class="launcher">
	<form class="launcher-form" onsubmit={(event) => { event.preventDefault(); submitSearch(); }}>
		<Search size={19} weight="Outline" class="launcher-icon" aria-hidden="true" />
		<label for="workspace-launcher" class="sr-only">Search or start a task</label>
		<input id="workspace-launcher" bind:value={query} placeholder={placeholder} autocomplete="off" spellcheck="false" />
		<button type="submit" aria-label={query.trim() ? 'Search workspace' : 'Open workspace search'}><ArrowRight size={17} weight="Outline" /></button>
	</form>

	{#if query.trim()}
		<div class="launcher-results" aria-label="Matching workspace records">
			{#if results.length}
				{#each results as result (result.kind + result.id)}
					<a href={result.href} class="launcher-result">
						<span class="result-copy"><strong>{result.title}</strong><small>{labelFor(result.kind)} · {result.subtitle}</small></span>
						<ArrowRight size={14} weight="Outline" aria-hidden="true" />
					</a>
				{/each}
				<a href={`/workspace/search?q=${encodeURIComponent(query.trim())}`} class="all-results">See all results <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a>
			{:else}
				<div class="launcher-empty">
					<strong>No matching workspace records</strong>
					<span>Try a product, request, problem, update, or help page.</span>
				</div>
			{/if}
		</div>
	{/if}

	<p class="launcher-note">Search by the words people used, or start with one of the actions below.</p>
</div>

<style>
	.launcher { width: min(100%, 680px); margin-inline: auto; }
	.launcher-form { display: flex; align-items: center; gap: 11px; min-height: 62px; padding: 7px 8px 7px 19px; border: 1px solid var(--pc-border-strong); border-radius: 19px; background: var(--pc-bg); transition: border-color 100ms ease, background-color 100ms ease; }
	.launcher-form:focus-within { border-color: var(--pc-focus-ring); background: var(--pc-bg); box-shadow: 0 0 0 0.5px var(--pc-focus-ring); }
	:global(.launcher-icon) { flex: 0 0 auto; color: var(--pc-text-muted); opacity: .72; }
	.launcher-form input { min-width: 0; flex: 1; border: 0; outline: 0; color: var(--pc-text); background: transparent; font-size: 15px; }
	.launcher-form input::placeholder { color: var(--pc-text-muted); opacity: .8; }
	.launcher-form button { display: grid; place-items: center; width: 46px; height: 46px; flex: 0 0 auto; border: 0; border-radius: 14px; color: var(--pc-bg); background: var(--pc-accent-light); cursor: pointer; transition: transform 150ms ease, opacity 150ms ease; }
	.launcher-form button:hover { opacity: .9; transform: translateX(1px); }
	.launcher-form button:active { transform: scale(.96); }
	.launcher-results { display: grid; gap: 2px; margin-top: 8px; padding: 7px; border: 1px solid var(--pc-border-strong); border-radius: 16px; background: var(--pc-bg); }
	.launcher-result { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 11px; border-radius: 11px; color: var(--pc-text-muted); transition: background-color 150ms ease, color 150ms ease; }
	.launcher-result:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.result-copy { min-width: 0; }
	.result-copy strong, .result-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.result-copy strong { color: inherit; font-size: 12px; font-weight: 500; }
	.result-copy small { margin-top: 3px; color: var(--pc-text-faint); font-size: 10px; }
	.launcher-result > :global(svg) { flex: 0 0 auto; color: var(--pc-accent-light); opacity: .8; }
	.all-results { display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin-top: 4px; padding: 9px; border-top: 1px solid var(--pc-border-strong); color: var(--pc-accent-light); font-size: 11px; }
	.launcher-empty { display: grid; gap: 3px; padding: 13px 11px; }
	.launcher-empty strong { color: var(--pc-text); font-size: 12px; font-weight: 500; }
	.launcher-empty span { color: var(--pc-text-muted); font-size: 11px; }
	.launcher-note { margin: 11px 4px 0; color: var(--pc-text-faint); font-size: 11px; text-align: center; }
	@media (max-width: 560px) { .launcher-form { min-height: 56px; padding-left: 15px; border-radius: 16px; }.launcher-form input { font-size: 14px; }.launcher-form button { width: 42px; height: 42px; border-radius: 12px; }.launcher-note { line-height: 1.45; } }
	@media (prefers-reduced-motion: reduce) { .launcher-form, .launcher-form button, .launcher-result { transition: none; } }
</style>
