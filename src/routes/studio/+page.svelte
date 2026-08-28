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

	<div class="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
		<div class="rounded-[16px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-5">
			<label class="block text-sm font-600">Title <span class="text-[var(--pc-text-faint)]">(the YouTube title)</span></label>
			<input bind:value={title} placeholder="e.g., ChatGPT 6 – The most human launch yet" class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)]" />
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
			<label class="mt-4 block text-sm font-600">Description / Changelog (markdown)</label>
			<textarea bind:value={desc} rows="6" placeholder="Write a crafted changelog, incident note, or launch story..." class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none"></textarea>

			<div class="mt-4 rounded-[12px] border border-dashed border-[var(--pc-border-strong)] bg-[var(--pc-surface-2)] p-6 grid place-items-center text-center">
				<Upload size={28} weight="Outline" />
				<p class="mt-2 text-sm font-600">Upload video (Supabase Storage) — drag & drop</p>
				<p class="text-xs text-[var(--pc-text-muted)]">MP4 • max 500 MB • thumbnail auto-generated</p>
				<button class="mt-3 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-4 py-2 text-sm font-600">Select file</button>
			</div>

			<div class="mt-6 flex gap-3">
				<button class="flex-1 rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)] py-3 text-sm font-700">Publish update</button>
				<button class="rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-6 py-3 text-sm font-600">Save draft</button>
			</div>
			<p class="mt-3 text-xs text-[var(--pc-text-faint)]">Superforms + Zod validation will be wired to Supabase `states` table. This is UI-only preview.</p>
		</div>

		<div>
			<p class="text-xs font-700 tracking-widest uppercase text-[var(--pc-text-muted)]">Preview (VideoCard)</p>
			<div class="mt-3 rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-3">
				<div class="aspect-video rounded-[10px] overflow-hidden bg-[var(--pc-surface-2)] grid place-items-center text-[var(--pc-text-muted)] text-sm">
					{#if title}{title}{:else}Your title preview{/if}
				</div>
				<p class="mt-3 text-sm font-600 line-clamp-2">{title || 'Untitled launch'}</p>
				<p class="text-xs text-[var(--pc-text-muted)] capitalize">{type} • Just now • 0 views</p>
			</div>

			<div class="mt-6 rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4">
				<h3 class="text-sm font-700">Tips for craft</h3>
				<ul class="mt-2 text-xs leading-5 text-[var(--pc-text-muted)] list-disc pl-4">
					<li>Launch videos > 6 mins perform 2.3x better</li>
					<li>Use a 16:9 thumbnail with bold type</li>
					<li>Incidents: be transparent, include timeline</li>
				</ul>
			</div>
		</div>
	</div>
</div>
