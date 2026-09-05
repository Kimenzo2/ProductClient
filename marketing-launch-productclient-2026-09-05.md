# Launch plan — ProductClient public beta · 2026-09-05

Date: **T0 = 2026-09-22** (recommended — movable, see constraints) · Metric: **verified products published** (not traffic, not PH rank) · Reachable audience today: **~near zero** (no email list found, no social following instrumented, no press contacts in repo) — therefore this is a **distribution-building arc with a launch at the end**, not a launch day.

Per `launch.md:12`, Launch outcome ≈ (audience you can reach) × (story worth repeating) × (friction to act). Weakest factor is **audience you can reach**. Polishing assets before building that audience wastes the spike.

---

## The story

One sentence: **Give your product a permanent URL that ranks — a home for your changelog, feedback, docs, and status that outlives the launch-day spike.**

One enemy: **The scattered stack and rented rank** — Product Hunt for a day, Canny that taxes your listeners, docs that drift, status that meters subscribers. Four tools, four bills, zero memory.

One number: **[NEED: the first number to anchor — e.g., "18 releases by [named product] now ranking for '[query]' since Aug 22" — DO NOT invent; without this, the story is decoration per launch.md:51]**

Until that number exists, the honest story is: "Product Client is the home we built for our own releases — and we're opening 30 maker spots to dogfood four surfaces in one place."

---

## The constraint

| Factor | Honest read | What this plan does |
|---|---|---|
| Audience you can reach | Near zero — no list, no community seeded, no partner posts scheduled | Turns T-4→T-1 into list-building, not asset-polishing. Target: 250 qualified emails + 15 day-one voices before T0. Without this, PH traffic is browsers not buyers per `launch.md:57`. |
| Story worth repeating | Medium — "rank you own vs rank you rent" is sharp but unproven until one ranking proof is citable | Ships proof before pitch: dogfood ProductClient itself as a public product with 3 real releases (see seeding). |
| Friction to act | Low — "Create product — free, no CC, 2 min to first release" but unverified | Dry-runs conversion path on mobile at T-1 per `launch.md:28`; adds `No credit card · 2 min` micro-copy from audit Fix #5. |

If reachable audience cannot reach ~200 engaged makers by T0, **move T0** — immovable dates cut scope per `launch.md:4`. Better to delay PH two weeks than to launch to an empty room.

---

## Timeline — dated, owned, hour-by-hour for day 0

### T-4 to T-2 weeks (now → Sep 15) — Seeding

- [ ] **Lock proof** — Publish Product Client itself at `/p/product-client` with 3 releases (use real commits from `bun run build` history). Owner: founder. Status: [NEED: confirm public product publish flow works — `/p/[slug]` exists at `src/routes/p/[slug]/+page.svelte:1`]
- [ ] **Close audit Fixes 1,4,5** — hero headline diff (A1), FAQ answer-first + Organization/Product schema, CTA micro-copy. All S-effort, H-confidence. Owner: eng.
- [ ] **Build asset stack** (below) and verify every claim now — SOC 2 date, pricing, uptime — not on launch morning per `launch.md:21`.
- [ ] **Warm channels** — 2-3 problem-space posts (no product) via `social.md`: (a) "Why our Notion changelog stopped ranking" (b) "Canny's tracked-user math at 5k voters" (c) "The doc that drifted". Founder personal > brand per `launch.md:34`.
- [ ] **Email seed** — If no list, start one: `/launchpad` and changelog share → email capture. Send 1-2 of the 8-sequence via `email.md` (welcome → "the scattered stack" teardown). Goal: 250 qualified.
- [ ] **Recruit day-one voices: 10-30 people** who will comment/share within first hours — ask individually not BCC per `launch.md:23`. Track in sheet: name, platform, confirmed time, exact ask.

### T-1 week (Sep 16-21) — Freeze

- [ ] Feature freeze — launch week absorbs zero scope per `launch.md:27`.
- [ ] Dry-run conversion path end-to-end on mobile — sign-up → publish first release → share link — the #1 launch-day failure per `launch.md:28`.
- [ ] Pre-write everything: posts, emails, replies to 10 predictable questions + predictable criticism (see Risks).
- [ ] Confirm day-one voices with exact time (00:01 Pacific for PH) and exact ask per `launch.md:30`.

### Launch day — T0 Mon Sep 22 — sequencing (00:01 Pacific → 24h window per `launch.md:51`)

| Time (PT) | Action | Owner | Asset |
|---|---|---|---|
| 00:01 | Ship primary listing (PH if chosen; otherwise launchpad + own blog). First-hour velocity is the PH strategy per `launch.md:53`. | Founder | Listing + gallery first image = value prop, not logo; tagline ≤60 chars: "Every release gets a URL that ranks" |
| 00:05 | Personal-note wave to day-one list — individual DMs, not BCC per `launch.md:32`. | Founder | DM template (see asset stack) |
| 09:00 | Email blast to list (launch sequence email 3: the open). | Marketing | Email #3 of 8 |
| 09:15 | Founder posts on personal LinkedIn + X (personal > brand per `launch.md:34`). | Founder | Posts #0 (see social.md) |
| 09:00-13:00 | Reply to *everything* for 3-4 hours — early engagement compounds distribution per `launch.md:35`. | Founder + team | Pre-written replies |
| 14:00 | Community drops where genuinely welcome (participate, don't spam) per `launch.md:36` — Indie Hackers, r/SaaS, relevant Discords. | Founder | Community blurb 100w |
| 19:00 | Evening results-so-far post — momentum reporting is content per `launch.md:37`. | Founder | "X releases published, Y feedback items, Z stars" — only real numbers |

### T+1 week — Harvest (where half the value is — per `launch.md:43` most teams stop at day 1 and forfeit it)

- Day 2: "How we built the linked product home" post — mechanism, not feature list.
- Day 3-4: Objection-teardown + case-study emails (sequence 5-6 via `email.md`).
- Day 5-7: Numbers retrospective — launch metrics shared openly are a high-performing post per `launch.md:45`.
- Throughout: collect every question asked → they become FAQ answers, content calendar, and objection list for `copy.md` per `launch.md:46`.

---

## Product Hunt specifics — verify before running

Current durable truths per `launch.md:50`:

- Launch at **00:01 Pacific** for full 24h voting window.
- Hunter matters less than maker's network; first-hour velocity shapes the day.
- Gallery first image = value prop not logo; tagline ≤60 chars outcome not category; maker comment = story + honest why not feature list.
- **Never buy/trade upvotes or run pods** — detection unranks per `launch.md:56`, and traffic quality is worthless.
- PH traffic is browsers not buyers — expect signups + feedback, not revenue. Set internal expectation per `launch.md:57` or the team reads a good launch as a failure.
- [NEED: verify current PH mechanics Sept 2026 — rules drift on a scale of weeks per `SKILL.md:95` — re-check tagline limits, gallery specs, hunting flow with search before locking assets.]

Recommendation for this launch: **Do not make PH the first spike.** Seed the home with 3 real Product Client releases, build 250 emails, then run PH as the harvest, not the sowing. If PH is forced to T0, cap internal metric to "signups + feedback items created" and treat rank as vanity.

---

## Asset stack

| Asset | Status | Route | Owner | Link / Draft |
|---|---|---|---|---|
| One-sentence story + 3 proof points | Drafted (see The Story) — [NEED: number] | `positioning.md` | Founder | This doc §The story |
| Launch email sequence (8) | Not written | `email.md` | Marketing | Recommended arc: 1 Welcome ("the scattered stack") 2 Problem deep-dive (tracked-user math) 3 Launch open (day 0) 4 Demo video 5 Objection ("docs will drift?") 6 Case study (Product Client dogfood) 7 Pricing + risk reversal 8 Retrospective + referral |
| Founder LinkedIn + X posts day 0-7 | Not written | `social.md` | Founder | Harvest the 8 emails into threaded posts; personal > brand |
| Landing page copy | **Ready diff** | `copy.md` | Eng | `marketing-copy-lab-hero-2026-09-05.md` A1 diff for `+page.svelte:384` |
| Demo video script ≤90s: problem → mechanism → result → CTA | Not written | `copy.md` | Design | Outline: 0-10s pain (4 tabs) → 10-45s mechanism (linked surfaces) → 45-75s result (permanent URL ranks, cited) → 75-90s CTA (Create product — free) |
| FAQ / 10 objection replies | **Partially ready** | `copy.md` | Product | GEO rewrites B+C already answer two; need 8 more from Risks + audit FAQ harvest |
| Press/partner blurb 100w paste-ready | Not written | `copy.md` | Marketing | Draft: "Product Client is a permanent home for product stories — changelogs, feedback boards, docs, and status pages on one structured URL each. Every fix links to the votes that asked for it and the doc that explains it. Pages rank on Google and are built to be cited by AI, without a tracked-user meter. Teams publish 3 products free; Pro from [NEED: $]. productclient.com" |
| Comparison pages `/vs/canny` `/vs/statuspage` | Not written — M effort | `geo.md` | Marketing | Use table from `marketing-geo-productclient-2026-09-05.md` Rewrite D |

---

## Day-one voices

| Name | Platform | Ask | Confirmed time | Notes |
|---|---|---|---|---|
| [NEED: 5 names from founder's network who ship weekly] | LinkedIn/X/PH | Comment within first hour: what they shipped + link to their Product Client product if they dogfood | 00:15-01:00 PT | Asked individually, not BCC |
| [NEED: 5 community members from feed/launchpad] | PH/Product Hunt comments | Upvote + honest first-impression reply | 09:00 PT | No pod, no purchased vote — unpaid organic only |
| [NEED: 3 design/dev partners] | X | Repost with one-line why they care | 09:15 PT | Personal share, not brand RT |

Target: 15 confirmed before T-1, 25 by T0. Record confirmations, not intentions.

---

## Risks — top 3, each with pre-written response

1. **"This is just another changelog tool."**
   Response: "Changelog is one of four surfaces — the bet is that they compound when they're linked. A release that doesn't link to the votes that asked for it and the doc that explains it is a post; a release that does is a page that ranks. That's the piece no changelog tool carries — here are three linked examples: `/update/[id]` → `/feedback/fb-1` → docs."

2. **"Why not just use Notion / GitHub Releases — it's free."**
   Response: "If your releases are already searched and cited, keep it. Most Notion changelogs are the ones that stopped ranking after the team stopped updating the docs page. Product Client is the home for teams where the changelog *is* distribution — permanent URLs with schema + linked context — not where distribution lives elsewhere. Free to start; one surface at a time."

3. **"Where are your customers? Mock data?"**
   Response: Honest spine per `SKILL.md:88` — no invented proof. "You're right — earlier previews were mock. Product Client itself is now the first public product on Product Client (link). [NEED: named early customer], who we onboarded last week, has published 18 releases that rank for [query] — happy to share the query and the citation screenshot, dated."

---

## What I couldn't determine

- Email list size and sender reputation — no list, no domain warm-up, no deliverability check possible; the 250 target is a direction not a projection per `launch.md:100` (do not project launch numbers).
- Social following and community membership — no X/LinkedIn handles found in repo, so seeding plan is unanchored.
- True production conversion friction — cannot dry-run until mobile smoke test at T-1.
- Whether the date is movable — assumed movable; if T0 is locked (e.g., investor demo), scope must cut to landing fixes 1+5 + dogfood releases only, and PH should be deferred to a second spike.
- Press/partner network — none discoverable; launch should not depend on press pickups in this window.

---

## Honesty spine

Do not project launch numbers per `launch.md:100`. Variance is enormous. Give levers and leading indicators: list size × historical CTR gives a floor for day-one traffic; that's as far as honest math goes. If the plan depends on an audience that doesn't exist yet, this document is the distribution plan with a launch at the end — and it says so.

## Handoffs

- Story not settled → `positioning.md` before launching an unpositioned product per `launch.md:20`.
- Assets pending → `copy.md` (landing), `email.md` (sequence 1-8), `social.md` (founder posts), `geo.md` (comparison pages).
- Paid distribution planned → `paid-ads.md` + `hooks.md` (18-tactic hook engine) — deferred until post-launch when organic reach is measured.

