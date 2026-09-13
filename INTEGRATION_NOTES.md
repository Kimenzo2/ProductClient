# Integration notes — Feedback · Inbox · Releases · Customer Stories

Inventory taken 2026-09-13 against project `okoctdtcwyfmfqvfbojw` (ProductClient), Postgres 17.6.

## What exists (reused, not rewritten)

| Object | Shape | Role in this integration |
| --- | --- | --- |
| `products` | `id uuid`, `maker_id not null`, `tenant_id null`, `slug unique`, `launched_at timestamptz null`, `deleted_at null` | Ownership anchor. RLS law = `products.maker_id = auth.uid()`. Publish gate = `launched_at is not null`. |
| `profiles` | self-row RLS. **No `active_product_id`** | **Add column** (nullable FK → products). Client already calls `set_active_product` + reads `profiles.active_product_id`; both silently failed until now. |
| `events` | `product_id not null`, `type text` ('launch' \| 'release' in the feed vocabulary), `title`, `body`, `payload jsonb`, `published_at`, `deleted_at` | Feed = launch + release kinds. `payload->>'release_id'` is the back-reference (there is no `ref_id` column; subjects live in `payload`). One row per release, idempotent insert on publish. |
| `feedback_reports` | `user_id not null`, `product_id null`, `status`, `created_at` | Internal QA-style reports keyed by user. **Not** visitor feedback. Left untouched. |
| `docs_releases` | `tenant_id`, `version bigint`, `document jsonb`, `content_hash` | Docs **versioning pipeline**, not product changelog. Left untouched; no `docs_pages.release_id` fork in v1. |
| `roadmap_docs` | `tenant_id`, `doc jsonb`, `version int` | Roadmap content lives in `doc` jsonb — **no SQL-level status vocabulary to share**, so `feedback_items.status` carries the prompt's own CHECK vocab (new|reviewing|planned|in_progress|shipped|closed). No second shared vocabulary was forked because none exists at SQL level. |
| `tenants` / `tenant_members` + `user_can_manage_tenant()` | Tenant helpers | Docs/incidents/roadmap are tenant-based. The four new domains are **product-based** per prompt law 1. Tenant helpers untouched. |

## What does not exist (added by migrations in this folder)

- `profiles.active_product_id` (+ `get_my_products`, `set_active_product` RPCs — client called them before they existed)
- `feedback_items` (+ `feedback_create` / `feedback_list` / `feedback_set_status`)
- `inbox_threads`, `inbox_messages` (+ `inbox_list` / `inbox_thread` / `inbox_reply` / `inbox_mark_read`) — **Inbox ≠ Notifications; no `notifications` table created**
- `releases` (+ `release_upsert` / `release_publish` / `release_list_maker` / `release_list_public`) — publish gated on `products.launched_at`; feed event idempotent via `payload->>'release_id'`
- `customer_stories` (+ direct RLS-scoped CRUD; public read only `published = true`)

## Decisions recorded

1. `feedback_items.body` is canonical; the first `inbox_messages` row **copies** the body so Inbox renders without joins. Replies live only in inbox_messages (no `feedback_comments`).
2. Public feedback insert (`anon`) is allowed only on launched/public products — same visibility predicate as the existing `products` public SELECT policy. Implemented inside `feedback_create`, which is the one `security definer` function in this set (documented: RLS bypass is intentional, the function re-validates product visibility + input lengths, and `feedback_items` grants no anon SELECT).
3. Visitor replies in Inbox are **out of scope in v1** (maker replies only), per the prompt's allowed simplification.
4. `releases.event_id` points at the feed event; created once (idempotent), only when `launched_at is not null`. Coming-soon products cannot publish releases.
5. Client wiring reuses the existing `/workspace/feedback`, `/workspace/inbox`, `/workspace/releases`, `/workspace/proof` routes — no parallel pages, no redesign.
6. `github_*` and `avatars` tables referenced by unfinished client code are missing; out of scope here.
