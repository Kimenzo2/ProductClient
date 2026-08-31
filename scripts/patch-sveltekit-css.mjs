/**
 * Patches @sveltejs/kit's render.js to handle vite-plugin-svelte 7.x CSS format.
 * SK2.70.3 assumes CSS is a string or function, but vite-plugin-svelte 7.x
 * may return an object { code, map }. This adds a fallback for that case.
 *
 * Runs as part of `prepare` (svelte-kit sync).
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const file = resolve(
	process.cwd(),
	'node_modules/@sveltejs/kit/src/runtime/server/page/render.js'
);

if (!existsSync(file)) {
	// Compiled build — skip
	process.exit(0);
}

const src = readFileSync(file, 'utf8');

const needle = `Object.entries(await node.inline_styles()).forEach(([filename, css]) => {
			if (typeof css === 'string') {
				inline_styles.set(filename, css);
				return;
			}

			inline_styles.set(filename, css(\`\${assets}/\${paths.app_dir}/immutable/assets\`, assets));
		});`;

if (!src.includes(needle)) {
	// Already patched or different version — skip
	process.exit(0);
}

const patched = src.replace(
	needle,
	`Object.entries(await node.inline_styles()).forEach(([filename, css]) => {
			if (typeof css === 'string') {
				inline_styles.set(filename, css);
				return;
			}
			if (typeof css === 'function') {
				inline_styles.set(filename, css(\`\${assets}/\${paths.app_dir}/immutable/assets\`, assets));
				return;
			}
			if (css && typeof css === 'object' && typeof css.code === 'string') {
				inline_styles.set(filename, css.code);
				return;
			}
		});`
);

writeFileSync(file, patched, 'utf8');
console.log('[patch-sveltekit-css] Patched render.js for vite-plugin-svelte 7.x compat');
