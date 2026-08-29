<script lang="ts">
	import { Select } from 'bits-ui';
	import { ChevronDown } from 'reicon-svelte';

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
</script>

<Select.Root type="single" bind:value items={options} {name} {disabled}>
	<Select.Trigger
		{id}
		class="pc-select-trigger {invalid ? 'pc-select-invalid' : ''}"
		aria-invalid={invalid || undefined}
	>
		<Select.Value {placeholder} />
		<ChevronDown size={15} weight="Outline" aria-hidden="true" />
	</Select.Trigger>
	<Select.Content class="pc-select-content" sideOffset={6}>
		<Select.Viewport class="pc-select-viewport">
			{#each options as option (option.value)}
				<Select.Item value={option.value} label={option.label} disabled={option.disabled} class="pc-select-item">
					{option.label}
				</Select.Item>
			{/each}
		</Select.Viewport>
	</Select.Content>
</Select.Root>

<style>
	:global(.pc-select-trigger) { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 42px; gap: 10px; padding: 0 12px; border: 0; border-radius: 10px; color: var(--pc-text); background: var(--pc-surface); font: inherit; font-size: 13px; text-align: start; outline: none; cursor: pointer; transition: background-color 150ms ease, box-shadow 150ms ease; }
	:global(.pc-select-trigger:hover) { background: var(--pc-surface-2); }
	:global(.pc-select-trigger:focus-visible) { box-shadow: 0 0 0 2px var(--pc-accent-light); }
	:global(.pc-select-trigger[data-placeholder]) { color: var(--pc-text-faint); }
	:global(.pc-select-trigger[aria-disabled="true"]) { cursor: not-allowed; opacity: .5; }
	:global(.pc-select-invalid) { box-shadow: 0 0 0 2px var(--red-6); }
	:global(.pc-select-content) { z-index: 60; min-width: var(--bits-select-anchor-width); overflow: hidden; border-radius: 13px; padding: 5px; color: var(--pc-text); background: var(--pc-surface-2); box-shadow: 0 18px 44px rgba(0, 0, 0, .34), 0 0 0 1px var(--pc-border-strong); }
	:global(.pc-select-viewport) { max-height: 280px; overflow: auto; }
	:global(.pc-select-item) { display: flex; align-items: center; min-height: 34px; padding: 0 9px; border-radius: 8px; color: var(--pc-text-muted); font-size: 12px; outline: none; cursor: pointer; }
	:global(.pc-select-item[data-highlighted]) { color: var(--pc-text); background: var(--pc-surface); }
	:global(.pc-select-item[data-disabled]) { cursor: not-allowed; opacity: .45; }
	@media (prefers-reduced-motion: reduce) { :global(.pc-select-trigger) { transition: none; } }
</style>
