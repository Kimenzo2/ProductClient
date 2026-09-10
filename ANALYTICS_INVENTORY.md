# Analytics Inventory — ProductClient + P-Landing

## ProductClient routes (existing)
- `src/routes/workspace/analytics/+page.svelte` — kayn cards (Views/Return visits/Followers/Link clicks + sparkline) + Engagement + Product updates + Boost + Incidents, range 7d/30d/90d, empty states, 500 guard emptyAnalytics()
- `src/routes/workspace/products/*`, `src/routes/workspace/releases/*`, `src/routes/workspace/feedback/*`, `src/routes/workspace/roadmap/*` (+ editor), `src/routes/workspace/docs/*`, `src/routes/workspace/incidents/*` (queue + [id] + new + post-incident-flow + follow-ups), `src/routes/workspace/status/*`, `src/routes/workspace/proof/*`, `src/routes/workspace/inbox/*`, `src/routes/workspace/search/*`, `src/routes/workspace/settings/*`, `src/routes/studio/*`, `src/routes/you/*`, `src/routes/m/[handle]` (P-Landing public, not ProductClient)
- Nav: `src/lib/components/layout/Sidebar.svelte` workspaceGroups + `panelRegistry` 10 panels (products/inbox/feedback/docs/proof/decisions/roadmap/releases/incidents/analytics/status)

## P-Landing Analytics UI kit (visual source — clone, don't edit)
- **No dedicated analytics route in repo** — analytics is Mintlify dashboard (app.mintlify.com) + ProductClient's kayn analytics is the source to clone. Visual tokens to clone:
  - Typography: `Inter` `12px` label `11px` tabular-nums, `15px` metric, `20px` section h2, `24px` signal `26px` strong, `text-[var(--pc-text-faint)]` / `text-muted`
  - Spacing: `rounded-[20px]` cards `border border-[var(--pc-border-strong)]` `bg-[var(--pc-bg)]` `p-4`/`p-5`, `rounded-[14px]` inner `bg-[var(--pc-surface)]` `px-3 py-3`, `gap-3` grid, `h-[36px]` sparkline
  - Color: `oklch(0.62 0.145 113)` brand `--pc-accent` / `--pc-accent-soft`, `--pc-surface` / `--pc-surface-2`, `--pc-text` / `--pc-text-muted` / `--pc-text-faint`, `--pc-border-strong`
  - Borders / frames: `border border-[var(--pc-border-strong)]` flat opaque, no shadow, `rounded-[20px]` outer, `rounded-[14px]` inner, `h-dvh` sidebar 240px
  - Number treatment: `formatCount` M/K, `tabular-nums`, `text-[24px]` hero, `text-[15px]` metric
  - Empty states: `StatePanel` / `empty-state` `No products yet` `No engagement yet` etc., same tone
  - Date-range control: `7d/30d/90d` `h-7 rounded-full px-3` `bg-[var(--pc-surface-2)]` vs `bg-[var(--pc-text)]` active, `island:true` tooltip
  - Chart: `svg viewBox 360x260` `h-[250px]` `polyline` `stroke var(--pc-accent)` `1.8px` + grid `0.5px` `var(--pc-border-strong)`, `Views over time` + `Rankings`

## Tables (Supabase public — ProductClient)
- `profiles` (41 rows) — `id, display_name, full_name, avatar_url, gamification_data:{bio,banner_url,website,twitter,github, followers...}`
- `products` — **MISSING** (maker-analytics expects `products` with `maker_id, follow_count, docs_nonempty` etc.) → empty fallback
- `events` — MISSING (launches/releases/changelogs)
- `product_interactions` — MISSING (human_view, return_visit, clickout, feedback_filed, agent_fetch)
- `boosts` — MISSING (stake_gross, started_at, ends_at)
- `follows` — MISSING
- `incidents` — MISSING (use `statusEditor` incident projection as fallback)
- Existing: `transactions`, `user_subscriptions`, `subscription_events`, `payment_history`, `feedback_reports`, `tenants` via RPC `get_my_tenant`/`ensure_my_tenant` (not table), `status_pages`, `storage.buckets` (`avatars` public)

## Decisions
- Do not invent P-Landing Analytics route — clone its **kayn** frames/tokens already in ProductClient analytics.
- 6 new Analytics pages will share same shell (`WorkspaceHeader` + `range` + `island` tooltips) and same chart lib (inline SVG, no new library).
- Instrument missing events into `product_interactions` / `events` only if absent — add `analytics_events` if needed, idempotent by `event_id`.
- Overview links to P-Landing Analytics for launch views/boosts — do not duplicate.
