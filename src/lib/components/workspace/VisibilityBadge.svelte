<script lang="ts">
	import { Export, UserSquare } from 'reicon-svelte';

	let {
		label = 'Internal'
	}: {
		label?: 'Internal' | 'Public preview' | 'Audience-specific';
	} = $props();

	const isPublic = $derived(label === 'Public preview');
	let Icon = $derived(isPublic ? Export : UserSquare);
	const displayLabel = $derived(label === 'Public preview' ? 'Customer preview' : label === 'Audience-specific' ? 'Selected people' : 'Internal only');
</script>

<span class="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-[var(--pc-surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--pc-text-muted)]">
	<Icon size={12} weight="Outline" aria-hidden="true" />
	{displayLabel}
</span>
