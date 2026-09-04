<script lang="ts">
	let {
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		invalid = false,
		rows = 4,
		class: className = '',
		id,
		'aria-describedby': describedBy,
		...restProps
	}: {
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		invalid?: boolean;
		rows?: number;
		class?: string;
		id?: string;
		'aria-describedby'?: string;
		[key: string]: unknown;
	} = $props();

	const base = 'w-full rounded-[10px] bg-[var(--pc-surface)] px-3 py-2.5 text-[13px] outline-none resize-none transition-[background-color,box-shadow,border-color] duration-200 placeholder:text-[var(--pc-text-faint)] focus:ring-[0.5px] focus:ring-[var(--pc-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed';
</script>

<textarea
	{placeholder}
	{disabled}
	{id}
	{rows}
	aria-invalid={invalid || undefined}
	aria-describedby={describedBy}
	bind:value
	class="{base} {invalid ? 'ring-2 ring-[var(--red-6)]' : ''} {className}"
	{...restProps}
></textarea>
