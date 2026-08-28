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
			'inline-flex items-center justify-center h-9 px-3 rounded-lg text-[13px] font-normal cursor-pointer transition-[background-color,color] duration-150 bg-[var(--tab-bg)] text-[var(--tab-color)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--tab-hover-color)] data-[active=true]:bg-[var(--tab-active-bg)] data-[active=true]:text-[var(--tab-active-color)] data-[active=true]:shadow-[var(--tab-active-shadow)]'
	}
});
