// Patch reicon-svelte duplicate Icon export
// The package exports `Icon` twice (line 2 and line 1281), causing a build error.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const reiconFile = resolve('node_modules/reicon-svelte/index.js');

if (!existsSync(reiconFile)) {
  console.log('[patch-reicon] node_modules not installed yet, skipping');
} else {
  const content = readFileSync(reiconFile, 'utf-8');
  const target = "export { default as Icon } from './icons/Icon.svelte';";
  if (content.includes(target)) {
    const patched = content.replace(target, "export { default as IconIcon } from './icons/Icon.svelte';");
    writeFileSync(reiconFile, patched, 'utf-8');
    console.log('[patch-reicon] Fixed duplicate Icon export');
  } else {
    console.log('[patch-reicon] Already patched or pattern not found');
  }
}

// Patch components-svelte shiki worker import (worker.ts → worker.js)
// Vite + rolldown tries to bundle new Worker(new URL("./worker.ts", import.meta.url))
// but dist only has worker.js, causing [UNRESOLVED_ENTRY] on Vercel.
const workerFile = resolve('node_modules/components-svelte/dist/utils/shiki/worker-client.js');
if (existsSync(workerFile)) {
  const wc = readFileSync(workerFile, 'utf-8');
  if (wc.includes('./worker.ts')) {
    writeFileSync(workerFile, wc.replaceAll('./worker.ts', './worker.js'), 'utf-8');
    console.log('[patch-reicon] Fixed shiki worker import (worker.ts → worker.js)');
  } else if (wc.includes('./worker.js')) {
    console.log('[patch-reicon] Shiki worker already correct (worker.js)');
  }
} else {
  console.log('[patch-reicon] worker-client.js not found, skipping shiki patch');
}
