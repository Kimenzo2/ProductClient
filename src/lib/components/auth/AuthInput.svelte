<script lang="ts">
	let {
		id,
		label,
		value = $bindable(''),
		type = 'text',
		name,
		placeholder = '',
		autocomplete,
		required = false,
		minlength,
		error = '',
		hint = '',
		disabled = false
	}: {
		id: string;
		label: string;
		value?: string;
		type?: string;
		name?: string;
		placeholder?: string;
		autocomplete?: 'name' | 'email' | 'username' | 'current-password' | 'new-password';
		required?: boolean;
		minlength?: number;
		error?: string;
		hint?: string;
		disabled?: boolean;
	} = $props();

	let describedBy = $derived([hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined);
</script>

<div class="auth-field">
	<label for={id}>
		<span>{label}</span>
		{#if required}<span class="required" aria-hidden="true">*</span>{/if}
	</label>
	<input
		{id}
		{name}
		{type}
		{placeholder}
		{autocomplete}
		{required}
		{minlength}
		{disabled}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
		class:error
	/>
	{#if hint && !error}<p id={`${id}-hint`} class="auth-hint">{hint}</p>{/if}
	{#if error}<p id={`${id}-error`} class="auth-error">{error}</p>{/if}
</div>

<style>
	.auth-field { display: grid; gap: 8px; }
	.auth-field label { display: flex; align-items: baseline; gap: 4px; color: var(--pc-text); font-size: 13px; font-weight: 500; }
	.required { color: var(--pc-accent-light); }
	.auth-field input { width: 100%; min-height: 48px; border: 1px solid var(--pc-border-strong); border-radius: 13px; background: rgba(251, 251, 251, 0.035); padding: 0 14px; color: var(--pc-text); font: inherit; font-size: 14px; outline: none; transition: border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease; }
	.auth-field input::placeholder { color: var(--pc-text-faint); }
	.auth-field input:hover { background: rgba(251, 251, 251, 0.05); }
	.auth-field input:focus { border-color: var(--pc-accent-light); background: rgba(251, 251, 251, 0.055); box-shadow: 0 0 0 3px rgba(119, 152, 18, 0.18); }
	.auth-field input.error { border-color: #e07a7a; }
	.auth-field input:disabled { cursor: not-allowed; opacity: .6; }
	.auth-hint, .auth-error { margin: 0; font-size: 12px; line-height: 1.45; }
	.auth-hint { color: var(--pc-text-faint); }
	.auth-error { color: #f09b9b; }
	@media (prefers-reduced-motion: reduce) { .auth-field input { transition: none; } }
</style>
