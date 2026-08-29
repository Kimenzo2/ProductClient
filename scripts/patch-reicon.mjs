// Patch reicon-svelte duplicate Icon export
// The package exports `Icon` twice (line 2 and line 1281), causing a build error.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const file = resolve('node_modules/reicon-svelte/index.js');

if (!existsSync(file)) {
  console.log('[patch-reicon] node_modules not installed yet, skipping');
  process.exit(0);
}

const content = readFileSync(file, 'utf-8');

// Only patch if the duplicate exists (line 1281 pattern)
const target = "export { default as Icon } from './icons/Icon.svelte';";
if (content.includes(target)) {
  const patched = content.replace(target, "export { default as IconIcon } from './icons/Icon.svelte';");
  writeFileSync(file, patched, 'utf-8');
  console.log('[patch-reicon] Fixed duplicate Icon export');
} else {
  console.log('[patch-reicon] Already patched or pattern not found');
}
