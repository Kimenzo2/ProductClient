<script lang="ts">
	import { Select } from 'bits-ui';
	import { ChevronDown, Check } from 'reicon-svelte';

	export type SelectOption = { value: string; label: string; disabled?: boolean };

	let {
		value = $bindable(''),
		options = [],
		placeholder = 'Select an option',
		id,
		name,
		disabled = false,
		invalid = false
	}: {
		value?: string;
		options?: SelectOption[];
		placeholder?: string;
		id?: string;
		name?: string;
		disabled?: boolean;
		invalid?: boolean;
	} = $props();

	let selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');
</script>

<Select.Root type="single" bind:value items={options} {name} {disabled}>
	<Select.Trigger
		{id}
		class="pc-select-trigger {invalid ? 'pc-select-invalid' : ''}"
		aria-invalid={invalid || undefined}
	>
		<span class="pc-select-value">
			{#if selectedLabel}{selectedLabel}{:else}<span class="pc-select-placeholder">{placeholder}</span>{/if}
		</span>
		<ChevronDown size={14} weight="Outline" aria-hidden="true" class="pc-select-chevron" />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content class="pc-select-content" sideOffset={8} collisionPadding={12}>
			<Select.Viewport class="pc-select-viewport">
				{#each options as option (option.value)}
					<Select.Item value={option.value} label={option.label} disabled={option.disabled} class="pc-select-item">
						<span class="pc-select-item-inner">
							<span class="pc-select-label">{option.label}</span>
							{#if value === option.value}<Check size={14} weight="Outline" class="pc-select-check" aria-hidden="true" />{/if}
						</span>
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>

<style>
	:global(.pc-select-trigger) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-height: 44px;
		gap: 12px;
		padding: 0 14px;
		border: 1px solid var(--pc-border-strong);
		border-radius: 12px;
		color: var(--pc-text);
		background: var(--pc-bg);
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1;
		text-align: start;
		outline: none;
		cursor: pointer;
		transition: background-color 100ms ease, border-color 100ms ease;
	}
	:global(.pc-select-trigger:hover) { background: var(--pc-surface); }
	:global(.pc-select-trigger:focus-visible) { border-color: var(--pc-focus-ring); box-shadow: 0 0 0 0.5px var(--pc-focus-ring); }
	:global(.pc-select-trigger[data-placeholder]) { color: var(--pc-text-faint); }
	:global(.pc-select-trigger[aria-disabled="true"]) { cursor: not-allowed; opacity: 0.5; }
	:global(.pc-select-value) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	:global(.pc-select-placeholder) { color: var(--pc-text-faint); }
	:global(.pc-select-chevron) { flex-shrink: 0; color: var(--pc-text-faint); transition: transform 150ms ease; }
	:global(.pc-select-trigger[data-state="open"] .pc-select-chevron) { transform: rotate(180deg); }
	:global(.pc-select-invalid) { border-color: var(--red-6); box-shadow: 0 0 0 0.5px var(--red-6); }
	:global(.pc-select-content) {
		z-index: 70;
		min-width: var(--bits-select-anchor-width);
		max-width: min(360px, calc(100vw - 24px));
		overflow: hidden;
		border-radius: 16px;
		padding: 6px;
		color: var(--pc-text);
		background: var(--pc-bg);
		border: 1px solid var(--pc-border-strong);
		/* flat — no shadow, no blur, opaque */
	}
	:global(.pc-select-viewport) { max-height: 240px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--pc-border-strong) transparent; }
	:global(.pc-select-item) {
		display: flex;
		align-items: center;
		min-height: 40px;
		padding: 0;
		border-radius: 10px;
		outline: none;
		cursor: pointer;
	}
	:global(.pc-select-item-inner) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		padding: 0 10px;
		min-height: 40px;
		border-radius: 10px;
		color: var(--pc-text-muted);
		font-size: 13px;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1.3;
		transition: background-color 100ms ease, color 100ms ease;
	}
	:global(.pc-select-item[data-highlighted] .pc-select-item-inner) { color: var(--pc-text); background: var(--pc-surface); }
	:global(.pc-select-item[data-state="checked"] .pc-select-item-inner) { color: var(--pc-text); background: var(--pc-surface); }
	:global(.pc-select-item[data-disabled]) { cursor: not-allowed; opacity: 0.45; }
	:global(.pc-select-label) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	:global(.pc-select-check) { flex-shrink: 0; color: var(--pc-accent-strong); }
	@media (prefers-reduced-motion: reduce) {
		:global(.pc-select-trigger), :global(.pc-select-chevron), :global(.pc-select-item-inner) { transition: none; }
	}
</style>
