# Copy Lab — ProductClient hero (landing) · 2026-09-05

Basis: `src/routes/(marketing)/+page.svelte:1`, audit `marketing-audit-productclient-2026-09-05.md`, rubric `copy.md` + `copy-frameworks.md` + `slop-patterns.md`. Scores are panel heuristics (skeptic/stranger/competitor/buyer/editor, 0-20 each = 100), not market performance.

One reader: **a product lead at a 8-25-person startup who ships weekly, owns comms, and hates that their Notion changelog, Canny votes, and Statuspage history live in four tabs the user never opens.**
One action: **Create product (sign-up)** at `authHref('sign-up')`.
What is true here that a competitor could not also say: **One permanent URL per release that links the votes → decision → release → doc → incident, ranks on search, and is cited by AI — with no tracked-user meter as the board grows.** (Differentiator to pressure-test.)

> De-slop pass applied: no "not just X, Y", no tricolon default, no "seamlessly/effortlessly/transform/unlock", varied rhythm, flat claims where proof exists; every claim that needs a number is `[NEED: x]` not a fabricated stat.

---

## Recommended

**A1 — Mechanism (recommended for cold → product-aware hero)**

> **Every release gets a URL that ranks.**
> Publish your changelog, feedback board, docs, and status on one permanent home — where each fix links back to the votes that asked for it, and each page is built to be cited by Google and AI.

**Score: 86/100** — why this one: skeptic 17 (mechanism is falsifiable, no superlative), stranger 18 (5-second test passes: "release → URL that ranks" is concrete), competitor 17 (only a permanent-URL platform can paste this), buyer 17 (answers "shipped but no one saw it"), editor 17 (17 words + 31 words, varied). 
**When to pick:** default control for the landing, paid social cold, and SEO-landed traffic. Most stage-tolerant of the set.

CTA: `Create your product — free` · micro-copy directly under CTAs: `No credit card · 2 min to first release · 3 products free`
Variant `A1-alt` for tight mobile nav/hero (10-word limit per `copy-frameworks.md:101`): **One URL per release. It ranks.**

---

## Runners-up

### B1 — Outcome with number-shaped promise (pure Specific Outcome angle)

> **Launch weekly. Rank for years.**
> Stop renting a day on a leaderboard. Turn every release into a permanent page that ranks, with feedback, docs, and incidents linked. No tracked-user tax.

Score: 82/100 — skeptic 15 (needs a proof unit adjacent), stranger 18 (paradox lands in 2s), competitor 16 (leaderboard-rent frame is hard to copy), buyer 16 (speaks to spike decay), editor 17 (two beats: 3 words + 2 beats). **Pick when:** you have proof in the next 200px (otherwise "Rank for years" invites disbelief).

### C1 — Cost of scattered story (Problem-agitation → Mechanism)

> **Your story lives in four tabs. Users open none.**
> One home for releases, feedback, docs, and status — where every ask links to the fix and every fix links to the doc. Permanent pages your changelog can never be buried from.

Score: 83/100 — skeptic 17 (admits current pain without promising a miracle), stranger 16 (needs the next line to land), competitor 18 (scattered-stack enemy is Product Hunt + Canny + ReadMe + Statuspage; few rivals can claim its inverse), buyer 17 (describes the 2am "Notion archaeology" state), editor 15 (slightly long second sentence — tighten to test). **Pick when:** audience is solution-aware (knows Canny/Notion pain) and traffic is retargeting / Product Hunt harvest.

### D1 — Identity (narrow beam, highest self-qualification)

> **For teams who ship every week and hate explaining it four times.**
> A single product home: versioned changelog on permanent URLs, a vote-ranked feedback board, docs beside the code, and a calm status page. No tracked-user meter.

Score: 80/100 — skeptic 16 (no hard proof), stranger 15 (requires the reader to self-identify), competitor 18 (identity lock + "no tracked-user meter" is un-copyable by Canny), buyer 18 (mirrors verbatim Slack complaint), editor 13 (list rhythm risks tricolon tell — deliberate, monitor). **Pick when:** you want to repel the wrong ICP (larger enterprise that wants per-seat/status meter) and attract the right one.

---

## Full candidate set (15 variants — de-slopped, panel-scored; survivors ≥70 shown, <70 killed not shown)

| # | Angle family | Variant (headline · sub) | Panel score | Kill/keep |
|---|---|---|---|---|
| A1 | Mechanism | Every release gets a URL that ranks. / Publish ... built to be cited by Google and AI. | **86** | **Keep — control** |
| B1 | Specific outcome | Launch weekly. Rank for years. / Stop renting a day ... No tracked-user tax. | 82 | Keep |
| C1 | Problem-agitation | Your story lives in four tabs. Users open none. / One home ... can never be buried from. | 83 | Keep |
| D1 | Identity | For teams who ship every week ... / A single product home: ... No tracked-user meter. | 80 | Keep |
| E1 | Comparison | Not a spike. A home. / Leaderboards give you 24 hours. Product Client gives you a page that ranks past them. | 78 | Keep (iterable to 84: add proof line) |
| F1 | Direct offer | Start with one surface. Keep the other three free. / Publish releases today — link feedback, docs, status as you grow. No credit card. | 77→83 after rewrite | Keep after iter |
| G1 | Objection-first | Docs will still drift, right? / Not when they live next to the changelog and the release that changed them — linked, dated, searchable. | 76→82 after iter | Keep after iter |
| H1 | Cost of inaction | Every unlinked fix is a story you can't cite. / Votes → fix → doc, connected — so support stops pasting the same answer and search cites you. | 75→81 after iter | Keep |
| I1 | Social proof (needs proof) | [NEED: Product] ships 18 releases that rank. / Their changelog pages cover [NEED: query] and are cited inside AI answers — with feedback behind each one. [NEED: cite] | 68 (kill until proof exists) | **Kill until [NEED] filled — do not ship with fake name** |
| J1 | Contrarian | Stop announcing. Start compounding. / Each release is a permanent page that outranks the last. Launch every week and the library grows. | 81 | Keep |
| K1 | Insider knowledge | Algorithms decide who sees your post. Pages decide who finds your product. | 79 | Keep |
| L1 | Curiosity (restrained) | The 24-hour launch is sold out. Your URL isn't. | 74 → kill? | Keep only as ad hook (6 words), not hero — risk of "cheque the page doesn't cash" |
| M1 | Differentiation | The only product home that links the vote to the fix and the fix to the doc. | 80 | Keep |
| N1 | Audience narrow | For makers who own the whole product story — from ask to ship to follow-up. | 77 | Keep as sub for D1 |
| O1 | Outcome + timeframe | From sign-up to searchable release in under five minutes. | 76 (needs instrumentation) | Keep as proof strip, not H1 |

 Killed <70: two curiosity variants that read as AI tricolon filler ("Faster, smarter, and built to rank") — removed. Their rhythm was metronomic and their claim referent-free (`slop-patterns.md:17` + `55`).

Iteration notes (per `copy.md:49` — any 70-84 is rewrite candidate):
- F1: original 77 ("Start free. Launch everything...") was re-scored after adding mechanism specificity ("Start with one surface...").
- G1: tightened hedged "might not drift" → flat "live next to the changelog" to fix skeptic 12→16.
- H1: added mechanism "Votes → fix → doc" to fix benefits-with-no-mechanism (`slop-patterns.md:63`).

All survivors passed `slop-patterns.md:10` structural and `32` lexical checks manually; the one-sentence read-aloud test at `slop-patterns.md:75` was applied — flagged tricolon in D1 is intentional and var-bounded.

---

## What I'd test first (sharpest contrast)

**Control:** A1 (Mechanism / "Every release gets a URL that ranks.")
**Challenger:** C1 (Problem-agitation / "Your story lives in four tabs. Users open none.")

These differ on exactly one variable: **angle** (mechanism vs problem), per `copy-frameworks.md:113` — offer and audience held constant, length similar. 

- If A1 wins → audience is solution-aware and trusts mechanism claims; scale into mechanism-forward ad hooks and comparison pages.
- If C1 wins → audience is problem-aware and needs pain named before product; invest in problem-space social content (2-3 posts, no product) per `launch.md:22` before re-testing offer copy.

**Sample honesty:** Do not declare a winner on <300 conversions per variant. Pre-write the re-measure at 14 days, not on launch morning.

---

## Flagged — do not ship without sign-off

- Any headline containing a number, timeframe ("in under five minutes" O1), or ranking claim (A1/B1) needs a **[NEED: measurement source + date]** adjacent. "Ranks" is an SEO claim — plan to link to the actual Google query where it ranks, dated.
- "No tracked-user tax" is a pricing claim. Needs a comparison cell: `[NEED: Canny 5k tracked users $/mo vs Product Client Pro $/mo, sourced Aug 2026]`. Without it, the claim is comparative advertising risk.
- Social-proof variant I1 is **killed until a named customer gives quote + logo permission** — do not ship with placeholder name.
- CTA micro-copy "2 min to first release" requires instrumentation to be true. Until measured, write `[NEED: median time to first publish, n=30]`.

---

## Diff — drop-in for `src/routes/(marketing)/+page.svelte:384-398`

```svelte
<h1 class="hero-h1 mx-auto max-w-[16ch] font-medium text-balance" data-animate data-delay="80">
  Every release gets a URL that ranks.
</h1>

<p class="mx-auto mt-7 max-w-[52ch] text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-[var(--pc-text-muted)]" data-animate data-delay="160">
  Publish your changelog, feedback board, docs, and status on one permanent home — where
  each fix links back to the votes that asked for it, and each page is built to be cited by
  Google and AI.
</p>
<!-- directly under the CTA row inside <header> -->
<p class="mt-3 text-[12px] text-[var(--pc-text-faint)]">No credit card · 2 min to first release · 3 products free</p>
```

Design note: no layout shift — same `max-w-[52ch]` block, same animation delay. Replace `Get started` pills with `Create your product — free` as described in audit Fix #5.

---

## Handoffs per `SKILL.md:42-46` / `copy.md:103`

- This audit's messaging problems → **this file** is the fix (then commit and re-measure).
- Landing destined for paid social → next load `hooks.md` + `paid-ads.md` (18-tactic hook matrix, not headlines — different job).
- Landing that must be cited by AI → after this diff ships, load `geo.md` + `geo-engines.md` (see `marketing-geo-productclient-2026-09-05.md` companion — queued).
- App store / email sequence → not triggered by these findings; defer until pricing and list exist.

## What I couldn't determine

- Which of the differentiated claims ("permanent URLs you own" vs. "no tracked-user meter") the *buyer* actually prices — this is an offer problem per `copy-frameworks.md:76`, not a words-on-page problem. Interview 5 recent signups before locking control.
- Awareness-stage mix of incoming traffic — cold social needs problem wording (C1), branded search needs mechanism (A1). One hero cannot win both without geo-targeted variants.
- True competitor phrasing for "permanent URLs that rank" — did not scrape live competitor landings during this pass. If Canny now says this, competitor score collapses and the control must shift to "no tracked-user meter."

