<script lang="ts">
	import { mockStates } from '$lib/data/mockStates';
	import { Upload } from 'reicon-svelte';
	let title = $state('');
	let type = $state('launch');
	let desc = $state('');
</script>

<svelte:head><title>Studio — Product Client</title></svelte:head>

<div class="mx-auto max-w-[1100px] px-3 md:px-6 py-6">
	<h1 class="text-[22px] font-800 tracking-tight">Studio</h1>
	<p class="text-sm text-[var(--pc-text-muted)]">Create a state update — launch, changelog, incident, fix or event. Craft matters.</p>

	<div class="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6 pc-enter-stagger">
		<div class="pc-bezel p-1.5">
			<div class="pc-bezel-inner p-5 bg-[var(--pc-surface)]">
				<label for="pc-title" class="block text-sm font-600">Title <span class="text-[var(--pc-text-faint)]">(the YouTube title)</span></label>
				<input id="pc-title" bind:value={title} placeholder="e.g., ChatGPT 6 – The most human launch yet" class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-all duration-200" />
			<div class="mt-4 grid grid-cols-2 gap-3">
				<label class="block">
					<span class="text-sm font-600">Type (State)</span>
					<select bind:value={type} class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm">
						<option value="launch">Launch</option>
						<option value="changelog">Changelog</option>
						<option value="incident">Incident</option>
						<option value="fix">Fix</option>
						<option value="event">Event</option>
					</select>
				</label>
				<label class="block">
					<span class="text-sm font-600">Product</span>
					<select class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm"><option>Bento</option><option>ChatGPT</option><option>Linear</option></select>
				</label>
			</div>
			<label for="pc-desc" class="mt-4 block text-sm font-600">Description / Changelog (markdown)</label>
			<textarea id="pc-desc" bind:value={desc} rows="6" placeholder="Write a crafted changelog, incident note, or launch story..." class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"></textarea>

			<div class="mt-4 rounded-[12px] border border-dashed border-[var(--pc-border-strong)] bg-[var(--pc-surface-2)] p-6 grid place-items-center text-center hover:border-[var(--pc-border)] transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]">
				<Upload size={28} weight="Outline" />
				<p class="mt-2 text-sm font-600">Upload video (Supabase Storage) — drag & drop</p>
				<p class="text-xs text-[var(--pc-text-muted)]">MP4 • max 500 MB • thumbnail auto-generated</p>
				<button class="mt-3 pc-btn-ghost py-2">Select file</button>
			</div>

			<div class="mt-6 flex gap-3">
				<button class="flex-1 pc-btn-primary py-3">Publish update <span class="pc-btn-icon">→</span></button>
				<button class="pc-btn-ghost px-6 py-3">Save draft</button>
			</div>
			<p class="mt-3 text-xs text-[var(--pc-text-faint)]">Superforms + Zod validation will be wired to Supabase `states` table. This is UI-only preview — data stays local until you nuke mocks.</p>
			</div>
		</div>

		<div class="space-y-4">
			<p class="text-xs font-700 tracking-widest uppercase text-[var(--pc-text-muted)]">Preview (VideoCard)</p>
			<div class="pc-bezel p-1.5">
				<div class="pc-bezel-inner p-3 bg-[var(--pc-surface)]">
					<div class="aspect-video rounded-[10px] overflow-hidden bg-[var(--pc-surface-2)] border border-[var(--pc-border)] grid place-items-center text-[var(--pc-text-muted)] text-sm">
						{#if title}{title}{:else}Your title preview{/if}
					</div>
					<p class="mt-3 text-sm font-600 line-clamp-2 text-balance">{title || 'Untitled launch'}</p>
					<p class="text-xs text-[var(--pc-text-muted)] capitalize">{type} • Just now • 0 views</p>
				</div>
			</div>

			<div class="pc-bezel p-1.5">
				<div class="pc-bezel-inner p-4 bg-[var(--pc-surface)]">
					<h3 class="text-sm font-700 tracking-tight">Tips for craft</h3>
					<ul class="mt-2 text-xs leading-5 text-[var(--pc-text-muted)] list-disc pl-4">
						<li>Launch videos &gt; 6 mins perform 2.3× better — keep first 8 seconds tight.</li>
						<li>Use 16:9 thumbnail with bold ApfelGrotezk type, 80ch max.</li>
						<li>Incidents: be transparent, include timeline + green “resolved”.</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
