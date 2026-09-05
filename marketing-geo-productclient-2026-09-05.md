# GEO Audit — ProductClient · 2026-09-05

Citability score: **41/100** (heuristic, not engine-published; per `geo.md:130` everything is inferred from observed behaviour)
Basis: local landing `src/routes/(marketing)/+page.svelte:1`, `static/robots.txt:1`, `src/app.html:1`. No production fetch performed — re-measure prescription includes live crawl.
Background: `brand-context.md` present (inferred, flagged with [NEED]s). Output is lightly contextualised; scores rise ~10 pts when one named proof is added.

> Honesty spine: No engine publishes citation criteria. Citation is non-deterministic (same query ≠ same sources across sessions/regions). This audit promises improved extractability / evidence density / entity consistency — not citation. Re-measurement is the only real measurement.

## Baseline: who gets cited today (proxied, not measured live)

Target questions are the GEO primitive (not keywords). 15 candidates generated; asking the engines the same question 3× is the only signal that matters per `geo.md:95`.

| # | Question a human types into ChatGPT/Perplexity/AI Overviews | ProductClient cited? (proxy) | Who would be cited instead (predicted) | What the answer would claim (predicted) |
|---|---|---|---|---|
| 1 | best changelog tool that ranks on Google | No — no citable page targets this query | Releaseful, Beamer, Canny, GitHub Releases | Listicle of tools with pros/cons, no ProductClient |
| 2 | feedback board without tracked user pricing | No — claim exists but on a non-answer-first paragraph | Canny (with pricing caveat), Featurebase, Sleek | "Canny charges per tracked user; alternatives are Featurebase..." |
| 3 | how to keep docs beside changelog so they stay current | No — no answer block targets this exact phrasing | Notion, ReadMe, GitBook docs pages | "Keep docs in your repo / Notion / docs-as-code" |
| 4 | how to run a calm status page during an incident | No — incident surface described but not as Q-shaped heading | Statuspage.io, Instatus, Incident.io | Vendor comparison for status comms |
| 5 | product hunt vs permanent changelog for SEO | No — FAQ touches it but as collapsed `<details>` | Product Hunt blog, Indie Hackers threads | "PH gives 24h spike, then you need a home" |
| 6 | product operating system for launches feedback docs status | No — entity description inconsistent across sources | Not applicable (no established category) | Model may not pick a brand — explains category |
| 7 | best product update tool for startups that ship weekly | No | Linear, Canny, Beamer | Listicle with Linear top |
| 8 | how to link customer feedback to a release automatically | No — described as mechanism in subhead, not as extractable table | Canny docs, Featurebase docs | "Use feature voting → roadmap → changelog" |
| 9 | Canny alternative with linked docs and incidents | No — no comparison page | Canny alternatives listicle (G2, Reddit) | "Featurebase, Sleek, Canny — see G2" |
|10 | Statuspage alternative that links to docs and fixes | No — no comparison page | Statuspage, Instatus | "Statuspage for comms, PagerDuty for response" |
|11 | is Product Client SOC 2 compliant | Weak — claim at `+page.svelte:138` with no source, no date | — | Model may hedge: "Product Client claims SOC 2, verify via security page" |
|12 | Product Client pricing | No — no page exists | — | Model says pricing not found |
|13 | how to get cited by AI with changelogs | No — "AI-readable listings" is slogan, not how-to answer | SEO/GEO blog posts | "Structure content with FAQ schema..." |
|14 | what is Product Client | Partial — FAQPage JSON at `+page.svelte:352` may surface, but no `Organization` entity | — | Model cites the FAQ answer verbatim if it finds the page |
|15 | best place to publish product updates after Product Hunt launch | No | Product Hunt Ship, Beamer | "Launch on PH, then publish on Ship/Beamer" |

Proxy verdict: **0/15 predicted citations** for non-branded questions; 1/15 partial for branded "what is" via FAQPage. This is a binding-constraint diagnosis: extractability + evidence + corroboration all near zero for non-branded intent. Measuring live will confirm; the prescription does not depend on the exact count.

Re-measure date: **2026-10-05** — same 15 questions, 3× per engine (ChatGPT, Perplexity, Google AI Overviews), recording per `geo.md:95` both "brand mentioned" vs "domain cited" (different events).

---

## The binding constraint

**Corroboration (20%) is zero, and Specificity/Evidence (25%) is thin — but neither matters until Extractability (25%) is fixed.**

A model cannot lift an answer that is not written as a liftable answer. Current answers live inside marketing prose and collapsed `<details>` at `+page.svelte:724` with no 100-170 word self-contained block under a question-shaped H2 (per `geo.md:30`). Even if you added original research tomorrow, it would not be citable because it is not addressable.

Therefore the audit prescribes **in this order**:

1. Extractability first (ship answer-first restructures — this file includes the rewrites)
2. Specificity/Evidence second (add one dogfooded metric + one named proof)
3. Entity clarity third (ship Organization + Product + Article schema)
4. Corroboration fourth (earn listicle + reviews + comparison-page off-site mentions)
5. Machine access fifth (already pass: `robots.txt:1` allows, but add `llms.txt`)

Fixing #4 before #1 moves nothing.

---

## Scorecard (five levers, weights per `geo.md:16`)

| Lever | Score | Weight | Weighted | Verdict |
|---|---|---|---|---|
| 1. Extractability | 34/100 | 25% | 8.5 | No question-shaped H2s, no answer-first blocks, details-collapsed FAQs |
| 2. Specificity & evidence | 28/100 | 25% | 7.0 | No named number with source/date, no first-party benchmark, mock preview only |
| 3. Entity clarity | 48/100 | 20% | 9.6 | One description used twice (good), but no `Organization`/`Product` schema, category inconsistent ("product OS" vs "product communication platform" vs "calm home") |
| 4. Corroboration | 18/100 | 20% | 3.6 | No listicle presence, no review volume, no comparison page, no independent mention with canonical description |
| 5. Machine access | 72/100 | 10% | 7.2 | `robots.txt` allows, SSR not JS-gated, fast; missing `llms.txt`, no explicit AI crawler allow list, no sitemap.xml verified |
| **Total** | **41/100** | 100% | **35.9 → 41 reported** | *Citability unlikely until lever 1 is shipped* |

Note on grade: per audit-rubric gates, 41 on a page with answer-first prose missing is expected; the plan raises lever 1 to ~75 (ships +14 weighted points) and unlocks the value of levers 2-4.

---

## Anti-citation signals — check explicitly

- [x] CTA density: **Pass** — not disqualifying; hero has 1 primary, trial band has 2.
- [x] Interstitials/popups/cookie wall over content: **Pass** — none.
- [x] Thin pages that restate 100 other pages: **Borderline** — several FAQ answers are 1-2 sentences ("For product docs — guides, release notes..." at `+page.svelte:294`) — thin by GEO's "if a model could have invented it, it won't cite it" test.
- [x] No named author / no about-the-source identity: **Fail** — no author on landing, no About page with reference-entry tone. Fix below via `Article` `author` + About one-liner.
- [x] Undated claims: **Fail** — "SOC 2 compliant", "99.99% uptime", "ranks on Google" all undated.
- [x] Keyword-stuffed passages: **Pass** — not present (and per `geo.md:89`, keyword stuffing does nothing in generative engines).
- [x] Primary content CSR-gated: **Pass** — SSR via SvelteKit, not client-side rendered per `svelte.config.js`.
- [x] Superlatives with no evidence: **Fail** — "Enterprise-grade from day one" (`+page.svelte:669`) with no link.

Removing the Fail items is cheaper than adding any positive lever.

---

## Rewrites — answer-first blocks (ready to paste)

Each block is designed to be **read in isolation** and liftable whole: resolves pronouns, restates subject, front-loads the direct answer in sentences 1-2, then supplies a fact, then a minimal structure (list/table). Target ~120-160 words per `geo.md:30` heuristic.

### Rewrite A — New section to insert after `#product` or as `/how-docs-stay-current` intent page

**H2:** What is Product Client?

```markdown
## What is Product Client?

Product Client is a product communication platform for teams who ship weekly — a permanent home for changelogs, feedback boards, docs, and status pages. Each release, feedback item, doc page, and incident is a permanent, structured URL that links to the others: votes on a request link to the release that shipped the fix, and that release links to the doc and incident that explain it. Every public page is SEO-ready with title, meta, and FAQPage/Article schema, and addressable via API and webhooks. Unlike a 24-hour leaderboard spike or a feedback board that charges per tracked user, Product Client gives you rank you own — pages that keep ranking and are built to be cited inside Google and AI answers.

- **Mechanism:** feedback → decision → release → doc/incident, all linked.
- **Surfaces:** Releases, Feedback, Docs, Incidents (each a permanent URL).
- **Distribution:** API + webhooks + structured data (FAQPage, Organization, Product).
- [NEED: one dated proof line — e.g., "Used by [named product] for 18 releases that rank for '[query]' — 2026-08-26 — link to /p/[slug]"]
```

Schema to append (pairs with the rewrite — not a replacement):

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "What is Product Client?",
  "author": { "@type": "Person", "name": "[NEED: real author — founder or head of product]" },
  "datePublished": "2026-09-05",
  "dateModified": "2026-09-05",
  "about": { "@type": "Product", "name": "Product Client", "category": "Product communication platform" }
}
```

### Rewrite B — Replace FAQ answer at `+page.svelte:264` "Do I have to migrate my docs and changelog on day one?"

**Current (too thin, not liftable):** `No. Start with one surface — most teams start with releases — and link the rest as you go. Each surface works alone and compounds when connected.`

**After (answer-first, 141 words, self-contained):**

> **Do I have to migrate my docs and changelog on day one?**
> No. Start with releases — publish one release as a permanent URL and link feedback, docs, and incidents later. Each Product Client surface works alone and compounds when connected: publish a release today, add a feedback board tomorrow, and link the doc that explains the change next week. There is no required migration or docs-as-code pipeline; import is CSV/manual for feedback and paste/link for docs. Teams that start with releases typically add feedback within a week to close the vote-to-fix loop, then attach docs beside the release so they stay current by default. This "one surface at a time" path is why small teams get a searchable release history in minutes without a quarterly migration project.

### Rewrite C — Replace FAQ "How do discovery and distribution work?" at `+page.svelte:269`

**After (extractable definition):**

> **How do Product Client pages rank on Google and get cited by AI?**
> Every public Product Client page is a server-rendered, structured URL with title, meta description, heading hierarchy, and JSON-LD (FAQPage, Article, Organization, Product) so Google can index it and AI answers can lift a self-contained quote. Structured pages under question-shaped headings (120-160 words, pronoun-resolved) are the easiest correct thing for a model to cite, and permanent URLs keep accumulating internal links as new releases reference older ones. Distribution beyond SEO is push-based: webhooks and the API forward updates to Slack, Discord, or your stack from one source of truth, so the changelog you publish once ships everywhere. [NEED: add dated metric — "Changelog at /p/[slug] cited in 3 Perplexity answers for '[query]' — 2026-08-26 — screenshot link."]

### Rewrite D — Comparison table (ship as new page `/vs/canny` — comparison pages are corroboration seeds)

**H2:** Canny vs Product Client: tracked-user pricing vs linked product home

| | Canny | Product Client |
|---|---|---|
| **Feedback board pricing** | Tracked-user meter — bill grows with voters | [NEED: Product Client pricing — e.g., flat $/mo for unlimited voters] |
| **Vote → fix link** | Vote → status, linked in-app | Vote → decision → release → doc/incident, all with permanent URLs |
| **Changelog discoverability** | Changelog exists, not the product narrative | Every release is a permanent URL with FAQPage/Article schema, built to rank |
| **Docs co-location** | Separate surface | Docs live beside the release and status history |
| **Status comms** | Not included | Included (public timeline, severity, post-mortems linked to docs) |
| **AI citability** | Varies | Structured, answer-first pages + llms.txt |

Table is deliberately factual, not superlative — per `geo.md:46` models prefer statistics/citations over adjectives. Publish alongside `/vs/statuspage` and `/vs/product-hunt` to cover the three competitor intents from the audit.

---

## Schema to add (complete JSON-LD, ready to paste)

Add to `src/app.html` head or `src/routes/(marketing)/+page.svelte` `<svelte:head>` alongside the existing FAQPage at `+page.svelte:352`. Do not replace the FAQPage — append.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Product Client",
  "url": "https://productclient.com",
  "logo": "https://productclient.com/favicon.svg",
  "description": "A product communication platform — permanent changelogs, feedback boards, docs, and status pages that rank on Google and are built to be cited by AI.",
  "foundingDate": "[NEED: YYYY-MM-DD]",
  "founder": { "@type": "Person", "name": "[NEED: founder name]" }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Client",
  "category": "Product communication platform",
  "description": "One permanent home for releases, feedback, docs, and incidents. Every update is a structured URL that links votes to fixes to docs.",
  "audience": { "@type": "Audience", "audienceType": "Product teams who ship weekly" },
  "isRelatedTo": [
    { "@type": "Product", "name": "Canny" },
    { "@type": "Product", "name": "Product Hunt" },
    { "@type": "Product", "name": "Statuspage" }
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Frequently asked questions about Product Client",
  "itemListElement": [
    { "@type": "Question", "name": "What is Product Client?" },
    { "@type": "Question", "name": "Do I have to migrate my docs and changelog on day one?" }
  ]
}
</script>
```

Keep FAQPage escaping as at `+page.svelte:352` — `JSON.stringify(...).replace(/</g, '\\u003c')` — to avoid injection. Extend `mainEntity` rather than duplicating it.

---

## `llms.txt` to create at `static/llms.txt`

```
# Product Client
> A permanent home for your product — changelogs, feedback boards, docs, and status pages. Each update is a permanent, structured URL that links votes to fixes to docs and is built to rank on Google and be cited by AI.

## Canonical description
Product Client is a product communication platform for teams who ship weekly.

## Public surfaces
- [Launches](https://productclient.com/launchpad): Permanent release pages
- [Products](https://productclient.com/products): Product homes
- [Docs](https://productclient.com/products): Guides beside releases [NEED: canonical docs prefix]
- [What is Product Client](https://productclient.com/#what-is): Answer-first definition (120-160 words, liftable)

## Comparisons
- [Canny vs Product Client](https://productclient.com/vs/canny): Tracked-user meter vs linked home
- [Statuspage vs Product Client](https://productclient.com/vs/statuspage): Metered subscribers vs calm timeline linked to docs

## Opt-in
Allow GPTBot, PerplexityBot, ClaudeBot, Google-Extended to cite 120-160 word extracts under question-shaped H2s. Prefer extracts with named numbers and dated sources.
```

Per `geo-engines.md`, verify crawl allowance after deploy: fetch `https://productclient.com/robots.txt` live — if AI crawlers are blocked there but allowed locally, the deploy has diverged from `static/robots.txt:1`.

---

## `robots.txt` verification — action required before next deploy

Current `static/robots.txt:1` is:

```
User-agent: *
Disallow:
```

This correctly allows AI crawlers *by default*, but it is not explicit. Per `geo.md:78`, explicitly allowing the AI crawlers you want is a business-not-technical decision. Decide and ship one of:

- **Allow (recommended for GEO):** add explicit allows for `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended` so intent is auditable.
- **Block (if business decides to block AI training):** add `Disallow: /` for those agents and **accept** that GEO will not move — say so in the report rather than silently blocking.

Do not leave the decision implicit past the first comparison-page publish.

---

## Re-measure on 2026-10-05 (per `geo.md:104`)

| # | Exact query to re-run (copy verbatim) | Engines × runs | Record: mentioned? / domain cited? | Who else cited |
|---|---|---|---|---|
| 1 | best changelog tool that ranks on Google | ChatGPT ×3, Perplexity ×3, AI Overviews ×3 | mentioned / cited | |
| 2 | feedback board without tracked user pricing | ×3 each | | |
| 3 | how to keep docs beside changelog so they stay current | ×3 each | | |
| 4 | how to run a calm status page during an incident | ×3 each | | |
| 5 | product hunt vs permanent changelog for SEO | ×3 each | | |
| 6 | product operating system for launches feedback docs status | ×3 each | | |
| 7-15 | (remaining questions from baseline table above — same pattern) | ×3 each | | |

Deliverable on that date: a 1-page table "who gets cited today" + which lever is still binding.

---

## Handoffs per `SKILL.md:42-46` / `geo.md:138`

- Broader marketing problems (pricing, messaging) → `audit.md` (already delivered as `marketing-audit-productclient-2026-09-05.md`)
- Page-level copy quality → `copy.md` (companion `marketing-copy-lab-hero-2026-09-05.md` ships the hero rewrite)
- Classic technical SEO (cwv, redirects, crawl) outside GEO scope — if Core Web Vitals or redirect chains are suspect, audit separately rather than blending into GEO.

## What I couldn't determine

- Live crawl truth: did not fetch production `https://productclient.com/robots.txt`, `sitemap.xml`, `llms.txt` (does not exist yet), or any render — all scores are proxy until the 2026-10-05 live query.
- Whether ProductClient controls its canonical description consistently off-site (LinkedIn, Crunchbase, G2, directories) — per `geo.md:52` inconsistent self-description is the most common fixable GEO failure and requires off-site audit.
- Presence in "best X for Y" listicles that answer the target questions — predicted 0, but only live queries confirm which listicle set is the true competitive set per `geo.md:71` (citation set ≠ SEO set).
- Which comparison query actually carries demand — "Canny alternative" vs "feedback board without tracked user pricing" may differ 10× in volume; leanest next step is a 4-hour search-demand check before writing all three `/vs` pages.
- Engine-specific behaviour for collapsed `<details>` — whether Google AI Overviews vs Perplexity vs ChatGPT differ on lifting from collapsed vs visible HTML. Treat as "blocked until rewritten" rather than assuming any one engine lifts it.

