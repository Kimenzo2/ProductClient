import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { defineConfig } from 'vite';

const componentsSvelteDir = resolve(process.cwd(), '..', 'components-svelte');
const localComponentsSvelteDist = resolve(componentsSvelteDir, 'dist');
const installedComponentsSvelteDist = resolve(process.cwd(), 'node_modules', 'components-svelte', 'dist');
const componentsSvelteDist = existsSync(resolve(localComponentsSvelteDist, 'components', 'callout', 'Callout.svelte'))
	? localComponentsSvelteDist
	: installedComponentsSvelteDist;
const componentsSvelteComponents = {
	callout: ['callout', 'Callout.svelte'],
	card: ['card', 'Card.svelte'],
	'code-block': ['code-block', 'CodeBlock.svelte'],
	steps: ['steps', 'Steps.svelte'],
	step: ['steps', 'Step.svelte'],
	tabs: ['tabs', 'Tabs.svelte'],
	'tabs-item': ['tabs', 'TabsItem.svelte'],
	accordion: ['accordion', 'Accordion.svelte'],
	frame: ['frame', 'Frame.svelte'],
	expandable: ['expandable', 'Expandable.svelte'],
	property: ['property', 'Property.svelte']
} as const;
const componentsSvelteAliases = Object.entries(componentsSvelteComponents)
	.filter(([, [directory, file]]) => existsSync(resolve(componentsSvelteDist, 'components', directory, file)))
	.map(([name, [directory, file]]) => ({
		find: `components-svelte/${name}`,
		replacement: resolve(componentsSvelteDist, 'components', directory, file)
	}));
if (existsSync(resolve(componentsSvelteDist, 'styles.css'))) {
	componentsSvelteAliases.push({ find: 'components-svelte/styles.css', replacement: resolve(componentsSvelteDist, 'styles.css') });
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// Edra's compiled Svelte toolbar imports this package indirectly. Keep it
	// in Vite's dependency graph so SSR does not retain a stale missing-module
	// result after the package is installed or the lockfile changes.
	optimizeDeps: {
		include: ['tailwind-variants', 'svelte-sonner', 'highlight.js/lib/core']
	},
	resolve: {
		alias: componentsSvelteAliases
	},
	server: {
		host: 'localhost',
		fs: { allow: existsSync(resolve(componentsSvelteDist, 'components', 'callout', 'Callout.svelte')) ? [componentsSvelteDir] : [] },
		// Pinned per AGENTS.md contract: Supabase redirect URLs are registered
		// per exact localhost URL, so the port must never drift. strictPort
		// fails loudly instead of silently landing on a rejected URL.
		port: 3000,
		strictPort: true
	},
	preview: {
		host: 'localhost',
		port: 3000,
		strictPort: true
	}
});
