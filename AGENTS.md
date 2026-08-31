# AGENTS.md — ProductClient

This file is read by future AI agents working in `C:\Users\admin\Downloads\ProductClient`. Follow it strictly.

## 1) Dev server — NEVER kill localhost
- `localhost:3000` is the dev server (`bun run dev` via Vite + SvelteKit 2.70.3). **Do not kill it** when a task is given.
- The user explicitly said: "When I give you a Task stop killing localhost."
- If you need to restart for a breaking config change (SvelteKit bump, Vite plugin), ask first. Otherwise use HMR — edits hot-reload without restart.
- Current process: `node` listening on `[::1]:3000` (PID varies) + `bun` watcher. Never `Stop-Process`/`taskkill` unless user approves.


## 2) Icons — ALWAYS use Reicon
- **All icons must be from `reicon-svelte` Outline weight. Never use inline `<svg>` or other libraries (lucide, heroicons, etc).**
- Install: `bun add reicon-svelte` (already at 1.0.102). Docs: https://reicon.dev/docs + `node_modules/reicon-svelte/README.md:60`.
- Usage (Outline is default, be explicit):
  ```svelte
  import { Home, Search, Bell, Menu, Add, Play, Verified } from 'reicon-svelte';
  <Home size={18} weight="Outline" />
  <Search size={16} weight="Outline" />
  ```
- For smallest bundle you may use direct path: `import Home from 'reicon-svelte/icons/Home.svelte'` — but prefer barrel for consistency unless fixing a bundler bug.
- **Weights:** Only `Outline`. Do not use `Filled` unless user explicitly asks. Always pass `weight="Outline"` (even though default) for clarity.
- **Props:** `size` (number=px), `color` (leave unset to inherit `currentColor`), `weight`, plus any SVG attrs `class` `style` `aria-label`.
- **Bug patch applied:** `node_modules/reicon-svelte/index.js:1281` had duplicate `export { default as Icon }` — patched to `IconIcon` to avoid `[PARSE_ERROR] Duplicated export 'Icon'` in `bun run build`. If you reinstall the package, re-apply: `s/ export \{ default as Icon \} from '\.\/icons\/Icon\.svelte';/export \{ default as IconIcon \} from '\.\/icons\/Icon\.svelte';/`.
- Verification before commit: `rg -n "<svg" src --glob "*.svelte"` must return **no results** (all icons via Reicon). `bun run check` must be 0 errors and `bun run build` must succeed.
- Icon mapping reference (product uses these): Header `Menu/Search/Mic/Add/Sun/Moon/Bell/CloseCircle/Play`; Sidebar `Home/Video/Compass/Bell/Box/Heart/History/Inbox/ArrowDown`; VideoCard `Play/Verified/MoreH`; Discover `Sort/Search/Play/Home/Video/Users2/UserSquare`; Watch `Play/Verified/Add/Heart/Dislike/Share/Upload`; Studio `Upload`; Channel `Verified`.

## 3) Stack — do not reintroduce Tailwind
- Stack is `Bun 1.4.0 + Svelte 5.57.0 + SvelteKit 2.70.3 + Open Props + Bits UI + UnoCSS (svelte-scoped, preflights: []) + Supabase`. `open-props` normalize is the reset; `unocss` provides only atomic utilities (`flex`, `grid`, `px-3`, shortcut `pc-chip`), not Tailwind.
- No `tailwindcss` direct dep, no `@tailwind` directive, no `tailwind.config.*`. Verify with `bun pm ls` (should show `bits-ui/open-props/unocss` only) and `rg tailwind src --glob '!node_modules'` only comments.
- **UnoCSS config — `unocss/vite` global mode with `@unocss/extractor-svelte`**
  - `svelte.config.js`: has `vitePreprocess()` and adapter config
  - `vite.config.ts`: `import { sveltekit } from '@sveltejs/kit/vite'` — no UnoCSS plugin needed, it auto-loads from `uno.config.ts`
  - `+layout.svelte`: `import 'virtual:uno.css'` (required for global mode)
  - SvelteKit 2 does NOT use Vite 8's Environment API — global mode `transformIndexHtml` works correctly
  - Reference: https://unocss.dev/integrations/vite

## 4) Theme — dark is default
- `src/app.css:8` defines exact tokens from user dump (`--primary 119 152 18`, `--background-dark 13 13 13` → `#0d0d0d`, grayscale `--gray-*`, typography `--font-inter`, `--font-family-headings-custom: ApfelGrotezk`). Dark is default via `:root`; light is `.light`.
- Theme is managed by an **inline `<script>` in `src/app.html`** that sets `html.className` before rendering (prevents FOUC). Toggle via `$lib/theme.ts` (`toggleTheme`, `getTheme`, `setTheme`).
- **Do NOT re-introduce `mode-watcher`** — it injects an inline `<script>` during SSR that swallows CSS `<link>` tags.
- Do not change defaults without user approval.

## 5) Project paths
- Workspace: `C:\Users\admin\Downloads\ProductClient`
- Dev URL: `http://localhost:3000` (Vite server.port 3000). Do not change port.

## 6) Writing issues for the svelte-5-doctor tool

The user runs `svelte-5-doctor` against ProductClient frequently. When a bug is found, write the issue for the tool's maintainer using this format:

- **No project-specific framing.** Don't mention ProductClient, the user's app name, or their specific routes. Describe the issue as a global Svelte problem that would affect any project using the tool.
- **Plain explanation, not a report.** Write like you're explaining something to a colleague — not like you're filing a Jira ticket. No severity labels, no priority numbers, no bullet-point severity matrices.
- **Structure:**
  1. One sentence stating what the tool does wrong.
  2. Why it's wrong — what Svelte rule or behavior it violates.
  3. A broken example (what the tool produces).
  4. What it should do instead.
  5. The root cause — what the tool's logic is missing.
- **Tone:** Direct, specific, no flattery or padding. Just the problem and the fix.
- **Example style:**
  > The tool adds hardcoded `href="#"` to `<a>` tags when fixing unused CSS selectors. This creates a duplicate attribute error because the element already has a dynamic `href` binding. A pre-check for existing `href` bindings would prevent this.

Known issues found so far:
1. **`$state()` generic syntax** — tool changes `$state<Type>(val)` to `$state()<Type>(val)` which Svelte 5 rejects. Correct: `$state<Type>(val)`.
2. **Keyed each blocks on non-id objects** — tool adds `(item.id)` to `{#each}` blocks but many arrays don't have `id`. Tool should introspect the element type first. Static const arrays don't need keyed blocks at all.
3. **Duplicate `href="#"` injection** — tool adds `href="#"` to `<a>` tags that already have dynamic `href` bindings, causing `attribute_duplicate` errors.

## 7) UnoCSS safelist — classes in script blocks
- The UnoCSS svelte extractor (`@unocss/extractor-svelte`) only scans `<template>` blocks, NOT `<script>` blocks. Any utility classes defined as string constants in script are invisible to it — no CSS generated, UI breaks.
- All 7 UI components (`Button`, `Card`, `Badge`, `Chip`, `Input`, `Textarea`, `Toggle`) plus `Sidebar.svelte` and `FilterChips.svelte` define classes in script blocks.
- These classes MUST be in the `safelist` array in `uno.config.ts`. When adding new UI components or changing class strings in script blocks, update the safelist.
- Also: Bits UI components, Open Props design tokens, and UnoCSS utilities are all required. Never remove any of these dependencies.

## 8) Verification checklist before finishing any task
- [ ] `rg -n "<svg" src` → empty
- [ ] All new icons import from `reicon-svelte` with `weight="Outline"`
- [ ] `bun run check` → 0 errors, `bun run build` → success

