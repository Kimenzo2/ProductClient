import { defineConfig, presetUno, presetIcons, transformerDirectives } from 'unocss';

export default defineConfig({
	presets: [
		presetUno(),
		presetIcons({
			scale: 1.2,
			extraProperties: { display: 'inline-block', 'vertical-align': 'middle' }
		})
	],
	transformers: [transformerDirectives()],
	// No Tailwind preflight – we use Open Props normalize
	preflights: [],
	shortcuts: {
		'pc-chip':
			'px-3 py-1.5 rounded-full text-sm font-500 bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-border)] transition-colors cursor-pointer border border-transparent data-[active=true]:bg-[var(--pc-text)] data-[active=true]:text-[var(--pc-bg)] data-[active=true]:border-[var(--pc-text)]'
	}
});
