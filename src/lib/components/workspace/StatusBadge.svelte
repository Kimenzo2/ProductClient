<script lang="ts">
	let {
		label,
		tone = 'neutral'
	}: {
		label: string;
		tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
	} = $props();

	const tones = {
		neutral: 'bg-[var(--pc-surface)] text-[var(--pc-text-muted)]',
		accent: 'bg-[rgba(119,152,18,0.16)] text-[var(--pc-accent-light)]',
		success: 'bg-[rgba(74,222,128,0.12)] text-[#86efac]',
		warning: 'bg-[rgba(234,179,8,0.14)] text-[#fde047]',
		danger: 'bg-[rgba(248,113,113,0.13)] text-[#fca5a5]'
	};

	const dots = {
		neutral: 'bg-[var(--pc-text-faint)]',
		accent: 'bg-[var(--pc-accent-light)]',
		success: 'bg-[#86efac]',
		warning: 'bg-[#fde047]',
		danger: 'bg-[#fca5a5]'
	};
</script>

<span class="inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium whitespace-nowrap {tones[tone]}">
	<span class="size-1.5 rounded-full {dots[tone]}" aria-hidden="true"></span>
	{label}
</span>
