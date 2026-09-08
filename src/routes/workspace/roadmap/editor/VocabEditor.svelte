<script lang="ts">
	import { Add, Trash } from 'reicon-svelte';
	import { Input, Label } from '$lib/components/ui';

	let {
		kind,
		entries,
		usage,
		onAdd,
		onRemove,
		onUpdate,
		armedKey
	}: {
		kind: 'stages' | 'confidence';
		entries: Record<string, { label: string }>;
		usage: (key: string) => number;
		onAdd: (kind: 'stages' | 'confidence', key: string, label: string) => boolean;
		onRemove: (kind: 'stages' | 'confidence', key: string) => void;
		onUpdate?: (kind: 'stages' | 'confidence', key: string, label: string) => void;
		armedKey: string | null;
	} = $props();

	let newKey = $state('');
	let newLabel = $state('');

	function submit() {
		if (onAdd(kind, newKey, newLabel)) {
			newKey = '';
			newLabel = '';
		}
	}
</script>

<div class="vocab-list">
	{#each Object.entries(entries) as [key, entry] (key)}
		<div class="vocab-row">
			<code>{key}</code>
			<div class="field"><Label for={`ed-${kind}-${key}`} class="sr-only">Display name for {key}</Label><Input
					id={`ed-${kind}-${key}`}
					value={entry.label}
					oninput={(e: Event) => {
						const v = (e.currentTarget as HTMLInputElement).value;
						if (onUpdate) onUpdate(kind, key, v);
						else entry.label = v;
					}}
				/></div>
			<span class="usage-count">{usage(key)} in use</span>
			<button
				type="button"
				class="icon-button danger"
				aria-label={armedKey === `${kind}:${key}` ? `Confirm remove ${key}` : `Remove ${key}`}
				disabled={usage(key) > 0}
				title={usage(key) > 0 ? 'Reassign items first' : `Remove ${key}`}
				onclick={() => onRemove(kind, key)}
			>
				<Trash size={15} weight="Outline" aria-hidden="true" />
			</button>
		</div>
	{/each}
</div>
<div class="add-vocab">
	<div class="field"><Label for={`ed-${kind}-new-key`}>New ID</Label><Input id={`ed-${kind}-new-key`} bind:value={newKey} placeholder="lowercase-words" /></div>
	<div class="field"><Label for={`ed-${kind}-new-label`}>Display name</Label><Input id={`ed-${kind}-new-label`} bind:value={newLabel} placeholder="What customers see" /></div>
	<div><button type="button" class="quiet-action" onclick={submit}><Add size={13} weight="Outline" aria-hidden="true" />Add entry</button></div>
</div>

<style>
	.vocab-list { display: grid; gap: 10px; padding: 4px 0 0; }
	.vocab-row { display: grid; grid-template-columns: 130px minmax(0, 1fr) auto 40px; align-items: center; gap: 12px; }
	.vocab-row code { overflow: hidden; color: var(--pc-text-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
	.usage-count { color: var(--pc-text-faint); font-size: 11px; white-space: nowrap; }
	.add-vocab { display: grid; grid-template-columns: 130px minmax(0, 1fr) auto; align-items: end; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--pc-border-strong); }
	.field { display: grid; gap: 8px; align-content: start; }
	.icon-button { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 50%; color: var(--pc-text-muted); background: transparent; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
	.icon-button:hover:not(:disabled) { color: var(--pc-text); background: var(--pc-surface-2); }
	.icon-button:disabled { opacity: .35; cursor: not-allowed; }
	.icon-button.danger:hover:not(:disabled) { color: var(--pc-status-degraded); }
	.icon-button:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 2px; }
	.quiet-action { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: transparent; color: var(--pc-text-muted); font: inherit; font-size: 11px; cursor: pointer; }
	.quiet-action:hover { color: var(--pc-text); }
	.quiet-action:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	@media (max-width: 720px) { .vocab-row { grid-template-columns: minmax(0, 1fr); } .add-vocab { grid-template-columns: minmax(0, 1fr); } }
</style>
