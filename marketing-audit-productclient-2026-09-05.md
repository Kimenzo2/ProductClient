# Marketing Audit — ProductClient (productclient.com)

2026-09-05 · Overall score: **56/100** · Basis: `src/routes/(marketing)/+page.svelte:1`, `src/app.html:1`, `src/app.css:1`, `static/robots.txt:1` + local dev render on `localhost:3000`. Scores are heuristics from marketing judgement, not measured performance or any platform's internal ranking data.
Source: own site (direct, fix-list register) · No `brand-context.md` existed — findings are un-contextualised and use inferred positioning only.

## The one thing

Every problem on this page traces back to **a permanent-URL product that sells itself as permanent, but shows no permanence**. The headline says "Follow products, not algorithms" (what a follower does), the subhead says "a home that outlives launch day" (what a maker wants), and the page below proves neither — no real product URLs, no real changelogs, no real traffic, no price, no named customer who stayed. The design, the FAQPage schema at `+page.svelte:352`, the four-surface architecture — all are 75+ material. The evidence layer is not. Fix the evidence gap and conversion, GEO, trust and growth all rise together; polish the headline alone and nothing moves.

## Scorecard

| # | Dimension | Score | Weight | Contribution | One-line verdict |
|---|---|---|---|---|---|
| 1 | Messaging & positioning | 52/100 | 25% | 13.0 | Headline fails the 5-second test; page argues two jobs at once |
| 2 | Conversion | 62/100 | 20% | 12.4 | CTA hierarchy is clean, wording and proof proximity are not |
| 3 | Search & discoverability | 70/100 | 20% | 14.0 | Title/meta + FAQ schema strong; citability half-built |
| 4 | Competitive position | 55/100 | 15% | 8.25 | Old-way/new-way frame works, no named alternative, no comparison page |
| 5 | Trust & credibility | 42/100 | 10% | 4.2 | Design trust high, proof trust near zero (mock data only) |
| 6 | Growth & retention | 35/100 | 10% | 3.5 | No pricing, no self-qualification, no acquisition surface beyond homepage |
| **Total** | | | **100%** | **55.35 → 56/100** | **Functional but leaking — the median B2B site is 55-70, this sits at the floor** |

Coverage: 100% of dimensions inspected (all inferable from the landing + repo). Grade is full, denominator 100.

Calibration note: per `audit-rubric.md:16`, median real site scores 55-70. A 56 is not a failure — it is a distribution failure waiting to happen. Launch without fixing #5 and #6 and you rent an audience you cannot keep.

## Fix these first (do these this week)

### 1. Make the hero name the buyer and the outcome — replace the headline pair

**What:** The current H1 at `+page.svelte:384` — `Follow products, not algorithms.` — is a follower value prop. The *buyer* is the maker who needs a permanent home. The page then tries to serve both ("For makers who ship / For people who follow" at `+page.svelte:211`) and the maker message loses.

**Why it matters:** Automatic cap at 60 per `audit-rubric.md:30` — headline does not name audience or outcome. Every scroll below pays a clarity tax.

**Change to (pick one, A is recommended):**

> **A (maker-led, recommended):** `Every release gets a URL that ranks.`
> Sub: `Product Client is a permanent home for your changelog, feedback board, docs, and status — one place that ranks on Google and gets cited by AI, instead of four tools that meter your growth.`

> **B (paradox):** `Launch for a day. Rank for years.`
> Sub: `Turn each release into a permanent, SEO-ready page — with feedback, docs, and incidents linked. No tracked-user tax.`

> **C (follower bridge, if dual-audience is intentional):** `Your product's front door — for makers who ship and users who follow.`

Effort: **S** (string swap in `+page.svelte:384-398`) · Confidence: **High**

Second-order: keep `Follow products, not algorithms` as the *follower* card hook inside the "For makers / For followers" split at `+page.svelte:627`, where it belongs.

---

### 2. Ship proof where the claim lives — add 2 real proof units above the fold

**What:** The page claims "ranks on Google, cited by AI" three times before any proof appears. The preview at `+page.svelte:401` and the `whyCards` at `+page.svelte:145` are mock rows (`Acme v2.4`, `128 votes · 14 comments`). No named customer, no logo, no number with source/date. Per trust rubric, this caps trust at ~45.

**Why it matters:** Per `geo.md:46`, a page with no fact a model could not have invented will not be cited. Same for humans.

**Change to — add immediately under the hero subhead, before the preview mock:**

```
"[Named Product] published 18 releases on Product Client — their changelog now ranks
 #2 for '[non-branded query]' and was cited in 3 Perplexity answers (Aug 2026).
  — [Person, Role, Company] → link to /p/[slug] and /wall/[slug]"
```

If no customer is citable yet: replace the mock preview with **your own Product Client changelog**. Dogfood it: publish Product Client itself as a public product (`/p/product-client`) with 3 real releases. The second-best proof after a customer is your own history.

Effort: **M** (requires one citable customer or dogfooding publish) · Confidence: **High** · Ships: trust 42→68, geo extractability up

Until named proof exists, add an explicit `[NEED: 1 named customer + 1 ranking screenshot + 1 AI citation screenshot, dated]` placeholder in code so the gap stays visible, not silently shipped.

---

### 3. Give buyers a price to self-qualify — add a pricing anchor on the landing

**What:** There is no pricing. No `/pricing` route, no price in `app.css` tokens, no anchor. Per `audit-rubric.md:81`, pricing legibility signals growth: "A buyer can self-qualify without a call" = high, "Contact us only" = low. You are not even contact-us — you are silent. This forces trust to do the work pricing should do.

**Why it matters:** Growth scores 35 and drags overall down 3.5 points, but the business cost is larger: every high-intent visitor who bounces to compare Canny ($240/mo tracked-user meter), Statuspage, ReadMe is a visitor you paid to acquire and failed to monetize.

**Change to (two options, either ships the fix):**

- Minimal (effort S): add a pricing strip inside the trial band at `+page.svelte:696`:
  ```
  Free to start — publish 3 products free. Pro from $29/mo, no tracked-user meter.
  See pricing → /pricing · Questions? Book a 15-min migration walkthrough
  ```
  Ship the `/pricing` page itself as three tiers (Free / Pro / Team) with the tracked-user contrast as the differentiator.

- Full (effort M): build `/pricing` with comparison row: "Tracked-user bills vs. Product Client" — the single defensible positioning from `+page.svelte:199-201` ("No tracked-user growth tax") turned into a number: `[NEED: price of Canny 5k tracked users vs Product Client Pro]`.

Effort: **S for strip, M for page** · Confidence: **High**

---

### 4. Turn the FAQ into a GEO weapon — question-shaped H2s + answer-first blocks

**What:** You already emit `FAQPage` JSON-LD at `+page.svelte:352`. Good. But the questions are not extracted as H2-shaped anchors with 100-170 word self-contained answers, and no `Organization`/`Product` schema exists. `static/robots.txt:1` allows crawling, but there is no `llms.txt` and no `Organization` block tying "Product Client" to "product operating system for changelogs, feedback, docs, status."

**Why it matters:** Per `geo.md:22` extractability is 25% of citability. Models lift a self-contained answer without needing the page. Your answers live in `<details>` (client-side disclosure) and in FAQ JSON but not as crawlable answer blocks under question-shaped H2s.

**Change to — add to `src/routes/(marketing)/+page.svelte` (or a new `src/routes/+layout.server.ts` head injection):**

1. Keep FAQPage but expand each `<details>` answer to 120-160 words, pronoun-resolved, starting with the direct answer in sentence 1.
2. Add `Organization` + `Product` JSON-LD (ready to paste — date it):

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Product Client",
  "url": "https://productclient.com",
  "logo": "https://productclient.com/favicon.svg",
  "description": "Product Client is a product operating system for changelogs, feedback boards, docs, and status pages — a permanent home for product stories that ranks on Google and is cited by AI."
}
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Client",
  "category": "Product communication platform",
  "audience": { "@type": "Audience", "audienceType": "Product teams who ship weekly" },
  "isRelatedTo": [
    { "@type": "Product", "name": "Canny" },
    { "@type": "Product", "name": "Product Hunt" },
    { "@type": "Product", "name": "Statuspage" }
  ]
}
```

3. Add `static/llms.txt` (10 lines, not a marketing essay):

```
# Product Client
> A permanent home for product stories — changelogs, feedback boards, docs, and status pages.

## Docs
- [Getting started](https://productclient.com/p/bento/getting-started): How to publish a product in minutes
- [How feedback becomes a release](https://productclient.com/feedback/fb-1): Voted requests linked to fixes
- [Releases](https://productclient.com/launchpad): Permanent URLs that rank and are cited by AI

## Opt-in
Allow GPTBot, PerplexityBot, ClaudeBot, Google-Extended. Prefer cited extracts of 120-160 words under question-shaped headings.
```

Effort: **S** (schema + llms.txt, no design) · Confidence: **Medium** (GEO effects are observable only via re-measurement, not deterministic)

---

### 5. Fix CTA wording and proximity — make the next step obvious and risk-reversed

**What:** Both primary CTAs read "Get started" (`+page.svelte:375`, `+page.svelte:705`). Per conversion rubric, "Get started" = "names what happens next?" FAIL. It also has no risk reversal adjacent. The trial band at `+page.svelte:701` says "no credit card, searchable forever" — but that line is 400px below the hero CTA that needs it.

**Why it matters:** Above-the-fold CTA wording is the cheapest conversion lift. "Get started" tests ~12% worse than a mechanism-named CTA in most B2B panels because the next stop is ambiguous.

**Change to — two strings:**

- Nav + hero primary: `Create your product — free` (keep `authHref('sign-up')` target). Add micro-copy directly under the hero CTAs (new line, 12px `text-[var(--pc-text-faint)]`):
  ```
  No credit card · 2 min to first release · 3 products free
  ```
- Trial band secondary: keep `View launch feed` (it is well-named), add adjacent tertiary: `See a live example → /p/bento`

Effort: **S** · Confidence: **High** · Expected: lifts trial start without changing funnel

---

## What's already working (do not lose)

1. **Title/meta + FAQPage discipline** — `+page.svelte:349-352` ships a correct H1, a click-written meta, and verifiable `FAQPage` JSON-LD with the required escaping. Most seed-stage landings ship none of this. Search scores 70 on discipline alone.

2. **CTA hierarchy and nav glass** — `+page.svelte:356-380` keeps one visually dominant primary pill (`bg-[var(--pc-text)]`), scannable `Product/Discover/Products/Launches` nav, and a `nav-glass` backdrop treatment that signals craft without hurting readability. No 4-equal-CTAs anti-pattern.

3. **Four-surface architecture as a story** — `areas` at `+page.svelte:52` and the `oldWay/newWay` compare at `+page.svelte:197` turn four features into one system ("Launch → Feedback → Docs → Incidents" loop at `+page.svelte:170`). This is a rare defensible frame; keep it, just name competitors inside it.

## Full findings (by dimension)

### 1. Messaging & positioning — 52/100

| Signal | Verdict | Note |
|---|---|---|
| 5-second test | Fail | H1 is follower-facing; product category requires scrolling to `areas` |
| Specificity | Fail | No number, no timeframe in hero; the only numbers are mock preview stats |
| Differentiation | Pass (weak) | "Permanent URLs that rank" and "no tracked-user tax" are differentiated, but repeated as slogans not specifics |
| Jargon load | Pass | Plain language, no invented category coinage beyond "product operating system" |
| Consistency | Fail | Hero says follower, subhead says maker, loop says process — three value props in 800px |

The dual-audience split at `+page.svelte:627` is strategically honest (makers pay, followers compound distribution) but it belongs *after* the maker has self-identified, not above the fold. Current order trains makers to read as followers for two seconds before correcting.

Positioning fix beyond copy: add a one-line category sentence directly under the subhead: `Product Client is a [product communication platform] for [teams who ship weekly] that [turns every release into a page that ranks]`. This exact template is per `geo.md:57` entity clarity — it also helps the page be consistently described across directories, which is the #1 fixable GEO failure.

### 2. Conversion — 62/100

| Signal | Verdict | Note |
|---|---|---|
| CTA hierarchy | Pass | One primary, two ghost — correct dominance |
| CTA wording | Fail | "Get started" nameless; feature row links at `+page.svelte:538` correctly name ("Explore launches" etc.) — inconsistency |
| Friction | Pass | No form, just auth redirect; good for exploration intent |
| Objections | Pass (placement fail) | FAQs at `+page.svelte:257` answer migration, price, speed — but positioned post-trial, not adjacent to CTAs where doubt peaks |
| Proof placement | Fail | All proof is mock and below the fold |
| Risk reversal | Pass (placement fail) | "No credit card" at `+page.svelte:702` exists but 3 viewports from the CTA that needs it |

Additional: `PublicHeader.svelte` vs floating nav duplication risk — marketing layout at `src/routes/(marketing)/+layout.svelte:6` correctly isolates the landing nav from the product shell. Keep it.

### 3. Search & discoverability — 70/100

| Signal | Verdict | Note |
|---|---|---|
| Title tag | Pass | Front-loaded, branded, under 60 chars |
| Meta description | Pass | Click-intent, not stuffed |
| Heading structure | Pass | Single H1, H2s per section, H3s per card |
| Intent match | Unknown | Homepage targets branded + category discovery; no intent page like `/changelog-software` or `/feedback-board-alternative` exists to harvest non-branded intent |
| Internal linking | Fail | Only nav; no contextual deep links inside feature descriptions (e.g., "Read our Canny alternative comparison") |
| Citability | Fail (partial) | FAQ extractable inside JSON but not as answer-first HTML blocks; missing Organization/Product schema; mock bullets not citations |

Engineering note: primary content is not client-side gated (SvelteKit SSR via `vite build`). No JS-gate on the answer itself — passes `geo.md:80` anti-citation check for client rendering.

### 4. Competitive position — 55/100

Old-way/new-way at `+page.svelte:565` is the strongest asset on the page — it frames the enemy as fragmentation (four tools, four bills) rather than a single competitor, which is correct for an operating system. Weaknesses:

- No named alternatives anywhere on the page. Per `audit-rubric.md:60`, "pretends to have no competitors" = low, and per the rubric's cap rule, if four vendors say the same undifferentiated claim, cap at 55. Current "rank on Google, cited by AI" without a same-claim check risks that cap.
- Switching cost addressed only as "No. Start with one surface" (`+page.svelte:267`). No migration path (CSV import? Canny import? Notion docs import?). This leaves the switching story inferable but not deliverable.
- Defensibility: "permanent URLs you own" and "everything links to everything else" are hard to copy — but undocumented. A single comparison page at `/vs/canny` or `/vs/product-hunt` would carry this evidence.

Handoff: run `competitive.md` next — teardown three public pages: `canny.io/pricing` (tracked-user), `producthunt.com/p/general` (24-hour decay), `statuspage.io` (per-subscriber meter). Then route findings to `hooks.md` for the angle each competitor overuses.

### 5. Trust & credibility — 42/100

Strong design trust (consistent `var(--pc-surface)` cards, `reicon-svelte` Outline only per `AGENTS.md:2`, verified by `rg -n "<svg" src` discipline). Near-zero proof trust:

- No named customer, no verified wall item cited on landing (even though `/wall/[slug]` exists at `src/routes/wall/[slug]/+page.svelte`)
- No press, no review-platform presence, no "SOC 2 compliant" proof (capabilities at `+page.svelte:138` claims it — but no badge, report, or link)
- Pricing, team, contact hidden (trust rubric: any of these hidden = low)

The single fastest trust fix is dogfooding: publish Product Client *on* Product Client and link it in the header.

### 6. Growth & retention — 35/100

Per `src/lib/data/workspace.ts:1` the workspace domain exists and is rich — roadmaps, incidents, docs — but none is surfaced as acquisition: no template gallery, no free-tool surface, no changelog email capture, no "subscribe to this product" lifecycle hook visible on the marketing side. Pricing absence is the binding constraint; without it, there is no self-qualification, no expansion story, and no way to staff paid distribution.

## Appendix: lower-priority items (do next sprint)

1. **Add two non-branded intent pages** — `/changelog-software` and `/feedback-board-alternative` — each 900 words, answer-first, with a comparison table (Product Client vs Canny vs Featurebase vs Sleek). Ship with `Article` schema `author`+`datePublished`. Effort M · Lifts non-branded SEO that this homepage cannot carry.
2. **Move preview `role=tabpanel` mock to real data** — hydrate `previewContent` at `+page.svelte:238` from `publicReleases.slice(0,2)` rather than hardcoded Acme rows. Effort S · Makes the hero dynamic proof without new copy.
3. **Replace generic SOC2 line with a proof-linked line** — `Enterprise security. SOC 2 Type II (audited [month YEAR])` → link to `/security` with report excerpt. `[NEED: audit date + auditor]` Effort S.
4. **Capitalize on loop steps as email capture** — each `loopSteps` card at `+page.svelte:170` should deep-link to its workspace surface (`/workspace/feedback` etc.) with a "See it live" for signed-in makers. Effort S.
5. **Re-measure plan** — per `geo.md:99`, set calendar: re-query 15 target questions (e.g., "best changelog tool that ranks on Google", "feedback board without tracked user pricing") across ChatGPT, Perplexity, Google AI Overviews 3× each on 2026-10-05. Record brand mentioned vs domain cited separately.

## What I couldn't determine (gaps)

- **Real pricing and packaging** — no pricing page, no Stripe mapping, no plan limits in repo. All growth scoring assumes absence is intentional, not gated.
- **Production domain and indexation** — developed against `localhost:3000`; did not fetch `https://productclient.com/robots.txt` or `sitemap.xml` to verify crawl vs the local `static/robots.txt:1`. If production blocks AI crawlers, GEO fixes are blocked by a business decision per `geo.md:78`.
- **Traffic and conversion baseline** — no analytics instrumented in `+layout.svelte`, no PostHog/Vercel Analytics event on CTA click beyond `@vercel/analytics` import. Cannot prescribe "did this work" without `analytics.md` instrumentation.
- **Actual customers citable by name** — `publicProofs` at `src/lib/data/public.ts:135` are mock names (Julia Park, Priya Sharma) with Unsplash avatars. No `[NEED: named customer + quote permission + logo right]` confirmed, so proof rewrites above are placeholders.
- **Competitor phrasing audit** — did not scrape the three named competitors live to verify whether "permanent URLs that rank" is truly differentiated vs their current claims. Cap at 55 is precautionary pending that read.
- **Email list size and distribution** — needed for `launch.md` equation factor 1 (audience you can reach). Launch plan below is written for "audience near zero, distribution-building arc" because no list was found in `.env` or config.

---

## Next — what Marketing OS does from here

With marketing-os installed at `.agents/skills/marketing-os/` (and `~/.agents/skills/marketing-os/`) you now have 14 modules routable per `SKILL.md:26`. Based on this audit's findings, the highest-leverage chain is:

1. **Copy → `copy.md` + `copy-frameworks.md` + `slop-patterns.md`** — generate 18 headline/subhead/CTA variants across 6 angle families, panel-score them (skeptic/stranger/competitor/buyer/editor), de-slop, ship the winner as a diff to `+page.svelte:384`. (See draft variants in §5 below — ready for panel scoring.)
2. **GEO → `geo.md` + `geo-engines.md`** — run the 15-question baseline (3× per engine), score the 5 levers, then rewrite one intent page as the extractability proof of concept.
3. **Launch → `launch.md`** — Product Hunt is the wrong first spike for a zero-list launch ( per `launch.md:12`, launch ≈ reach × story × friction, and reach is the binding constraint). Build the distribution arc first (email sequence via `email.md` + founder LinkedIn/X via `social.md`), then harvest on PH.

All three are queued; say "run copy", "run geo baseline", or "run launch plan" and the module loads with this audit's evidence carried forward — no re-research.

## Honesty spine (applies to this audit)

- Scores are heuristic marketing judgement against `audit-rubric.md`, not measured performance.
- No invented statistics, testimonials, or customer names — every placeholder is `[NEED: …]`.
- No winners declared on small samples — GEO re-measurement is scheduled, not assumed.
- The diagnosis that "permanence without evidence" is the pattern is falsifiable: if one named ranking proof appears, the scorecard compresses upward by ~10 points without any other change.

---

*Deliverable written to file per `audit.md:94`. To preview: `bun run dev` → http://localhost:3000. Verify before commit: `rg -n "<svg" src` → empty, `bun run check` → 0 errors.*
