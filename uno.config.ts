import { defineConfig, presetUno, presetIcons } from 'unocss';

export default defineConfig({
	presets: [
		presetUno(),
		presetIcons({
			scale: 1.2,
			extraProperties: { display: 'inline-block', 'vertical-align': 'middle' }
		})
	],
	safelist: [
		// Classes in UI component script blocks (Button, Card, Badge, Chip, Input, Textarea, Toggle)
		// svelte-scoped only scans templates, not script blocks
		'inline-flex', 'items-center', 'justify-center', 'gap-2', 'font-medium', 'font-normal',
		'rounded-full', 'rounded-[10px]', 'rounded-[20px]', 'rounded-[12px]',
		'transition-[background-color,color,opacity,transform]', 'transition-[background-color,color,opacity]',
		'transition-[background-color,color]', 'transition-[background-color,box-shadow,border-color]',
		'transition-[background-color]', 'duration-150', 'duration-200',
		'cursor-pointer', 'disabled:opacity-50', 'disabled:cursor-not-allowed',
		'focus-visible:outline-2', 'focus-visible:outline-offset-2', 'focus-visible:outline-[var(--pc-accent-light)]',
		'focus:ring-2', 'focus:ring-[var(--color-primary)]', 'outline-none',
		'hover:opacity-[0.88]', 'active:scale-[0.96]',
		'bg-[var(--pc-text)]', 'bg-[var(--pc-bg)]', 'bg-[var(--pc-surface)]', 'bg-[var(--pc-surface-2)]',
		'bg-[var(--pc-accent)]', 'bg-[var(--pc-accent-hover)]', 'bg-[var(--pc-border-strong)]',
		'bg-transparent', 'bg-[rgba(119,152,18,0.15)]',
		'text-[var(--pc-text)]', 'text-[var(--pc-bg)]', 'text-[var(--pc-text-muted)]', 'text-[var(--pc-text-faint)]',
		'text-white', 'text-xs', 'text-sm', 'text-[10px]', 'text-[11px]', 'text-[13px]', 'text-[9px]',
		'text-[rgb(119,152,18)]', 'text-[var(--red-6)]',
		'h-8', 'h-9', 'h-10', 'h-full', 'h-px', 'w-full', 'w-px',
		'size-4', 'size-5', 'size-6', 'size-7', 'size-8', 'size-9', 'size-10', 'size-12', 'size-20',
		'px-2', 'px-2.5', 'px-3', 'px-4', 'px-5', 'py-0.5', 'py-1', 'py-2.5',
		'p-3', 'p-4', 'p-5',
		'border', 'border-[var(--pc-border-strong)]', 'border-transparent', 'ring-2', 'ring-[var(--red-6)]',
		'placeholder:text-[var(--pc-text-faint)]',
		'opacity-50', 'hover:bg-[var(--pc-surface-2)]', 'hover:bg-[var(--pc-border-strong)]',
		'hover:bg-[var(--pc-surface)]',
		'resize-none', 'whitespace-nowrap', 'shrink-0', 'flex-col',
		// Sidebar + FilterChips script-block classes
		'rounded-xl', 'rounded-lg', 'px-3.5', 'py-2', 'text-[10px]',
		'focus-visible:outline-offset-0',
		'data-[state=on]:bg-[var(--tab-active-bg)]', 'data-[state=on]:text-[var(--tab-active-color)]',
		'data-[state=on]:shadow-[var(--tab-active-shadow)]',
		'data-[state=off]:bg-[var(--tab-bg)]', 'data-[state=off]:text-[var(--tab-color)]',
		'data-[state=off]:hover:bg-[var(--tab-hover-bg)]', 'data-[state=off]:hover:text-[var(--tab-hover-color)]',
		// No Tailwind preflight – we use Open Props normalize
	],
	// No Tailwind preflight – we use Open Props normalize
	preflights: [],
	shortcuts: {
		'pc-chip':
			'inline-flex items-center justify-center h-9 px-3 rounded-lg text-[13px] font-normal cursor-pointer transition-[background-color,color] duration-150 bg-[var(--tab-bg)] text-[var(--tab-color)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--tab-hover-color)] data-[active=true]:bg-[var(--tab-active-bg)] data-[active=true]:text-[var(--tab-active-color)] data-[active=true]:shadow-[var(--tab-active-shadow)]'
	}
});
