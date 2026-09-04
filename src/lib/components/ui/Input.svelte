<script lang="ts">
	let {
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		disabled = false,
		invalid = false,
		class: className = '',
		id,
		name,
		'aria-describedby': describedBy,
		onkeydown,
		...restProps
	}: {
		value?: string;
		type?: string;
		placeholder?: string;
		disabled?: boolean;
		invalid?: boolean;
		class?: string;
		id?: string;
		name?: string;
		'aria-describedby'?: string;
		onkeydown?: (e: KeyboardEvent) => void;
		[key: string]: unknown;
	} = $props();

	const base = 'w-full rounded-[10px] bg-[var(--pc-surface)] px-3 py-2.5 text-[13px] outline-none transition-[background-color,box-shadow,border-color] duration-200 placeholder:text-[var(--pc-text-faint)] focus:ring-[0.5px] focus:ring-[var(--pc-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed';
</script>

<input
	{type}
	{placeholder}
	{disabled}
	{id}
	{name}
	aria-invalid={invalid || undefined}
	aria-describedby={describedBy}
	bind:value
	class="{base} {invalid ? 'ring-2 ring-[var(--red-6)]' : ''} {className}"
	{onkeydown}
	{...restProps}
/>
