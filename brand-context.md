# Brand context — ProductClient

Fill quality here compounds across every marketing-os module (audit → copy → geo → launch). Inferred from `src/routes/(marketing)/+page.svelte:1` and `src/lib/data/public.ts:1` on 2026-09-05. Review each [NEED] — a plausible guess left unflagged becomes a false-advertising claim.

---

## Product

**What it is, in one sentence a stranger would understand:**
A permanent home for your product — versioned changelogs, feedback boards, docs, and status pages in one place that ranks on Google and gets cited by AI.

**What it actually does (the mechanism, not the promise):**
Each update is a permanent, structured URL (releases, feedback, docs, incidents) with linked context: feedback votes → triaged status → release that shipped the fix → doc that explains it → incident timeline if it broke. All pages are SEO-ready (title/meta, heading hierarchy, FAQPage/Article schema) and API/webhook-addressable. Workspace at `src/lib/data/workspace.ts:1` powers the maker side; public surfaces at `src/routes/p/[slug]`, `/update/[id]`, `/wall/[slug]`, `/docs/[product]/[...slug]` compound over time rather than decaying like a feed.

**What it does NOT do (this prevents overclaiming):**
- Not a social feed or launch-day spike platform (it gives a spike a home, not the spike itself — `+page.svelte:80` "Launch every week and compound" vs. Product Hunt's 24h window)
- Not a feedback tool that meters tracked users (no Canny-style growth tax — `+page.svelte:201` claim, no helpdesk ticketing)
- Not a docs-as-code pipeline with interactive API playgrounds/SDK generation (`+page.svelte:294` "If you need interactive API playgrounds, keep that stack")
- Not an on-call/response platform — status is the calm public face in front of formal incident response (`+page.svelte:300`)
- [NEED: confirm boundaries on auth (SAML/OIDC scope), data residency, and what "Enterprise security / SSO / RBAC / audit logs" at `+page.svelte:138` actually covers vs. aspiration]

---

## Audience

**Who buys it:** Makers and product teams who ship weekly — founders, product leads, and eng managers at seed to Series B startups (and indie makers) who own the product story end-to-end. Followers (end users who track products) are the distribution audience, not the buyer.

**What they believe before they arrive:** Launch platforms rent attention for a day; feedback boards get more expensive as you grow; docs drift from the product; status pages are metered by subscriber. They believe marketing is another feed to fight.

**What they worry about at 2am:** "We shipped but no one saw it" / "Our changelog is five Notion pages no one links to" / "Support is drowning because we have no calm status page during an incident" / "Our docs are stale, users stopped trusting them" / "We're paying a tracked-user tax for praise that should be proof."

**What they'd use instead if you didn't exist:** Product Hunt (launch spike) + Canny/Featurebase/Sleek (feedback, with tracked-user pricing) + ReadMe/GitBook/Notion (docs) + Statuspage.io/Instatus (status) + Notion/social scattered — or a self-hosted Notion + Discord combo. The scattered stack is the real competitor.

---

## Positioning

**The one thing true about us that a competitor could not also say:**
One system where *every signal becomes a story and every story has a permanent, linkable, rankable URL* — feedback → decision → release → doc → incident all linked, and each page compounds on search and inside AI answers, with no tracked-user meter as you grow.

Alternatives to test (pick one, not all — positioning is a choice):
1. Rank you own vs. rank you rent (permanent URLs vs. leaderboard decay)
2. No growth tax on listening (no tracked-user meter)

**Category we compete in:** Product communication platform / Product operating system — "A calm product operating system. Releases, feedback, docs, and incidents live in one place." Prefer naming it `product communication platform` externally for search intent, `product OS` internally.

**Named competitors:** Product Hunt (launch-day spike), Canny (feedback / tracked-user meter), Featurebase/Sleek (feedback alternatives), ReadMe/GitBook/Notion (docs), Statuspage.io/Instatus (status), Linear (reference product UX, not direct). [NEED: Confirm top 3 to teardown — recommended: Canny, Product Hunt, Statuspage.io]

---

## Proof

**Numbers we can cite (with source and date):**
- [NEED: The one number per `launch.md` — e.g., "18 releases published by [customer], #2 for [query] (Aug 2026)" — flag until sourced. DO NOT invent.]
- [NEED: Changelog rank screenshot + Perplexity/ChatGPT citation screenshot, dated]
- [NEED: Time from account creation → first useful release (claim at `+page.svelte:248` is "under five minutes" — instrument and cite median)]
- Current landing claims to retire until sourced: "rank on Google, get cited by AI" (no source), "99.99% uptime" at `+page.svelte:142`, "SOC 2 compliant" at `+page.svelte:138`.
- [NEED: Decide whether to keep 99.99% — either link to status history with measured uptime or rewrite as "[NEED: measured uptime window]"]

**Named customers we're allowed to name:** [NEED: 1-2 customers with logo + quote permission + wall link]. Interim: dogfood ProductClient itself as a public product (`/p/product-client`) — publish 3 real releases so the landing has a live example to link to at `+page.svelte:401` preview.

**Claims that need legal sign-off:** SOC 2 Type II, SSO/RBAC scope, pricing no-meter claim comparison ("no tracked-user tax" vs. Canny at 5k users), uptime, "AI-readable listings" neutrality across engines.

---

## Voice

**How we sound:** Calm, direct, maker-to-maker. Short sentences. Evidence before adjective. Optimistic without hype. The product is calm during an incident — the copy is too.

**How we never sound:** Hypey ("revolutionary", "next-generation"), corporate ("solutions", "capabilities", "synergy"), or AI-telled (no "not just X, but Y", no tricolon-as-default, no "in today's fast-paced world"). Run every prose deliverable through `slop-patterns.md` before shipping.

**Words we always use:** release (not update), permanent URL (not post), feedback board (not idea box), product home / front door, linked, calm (for incidents), compound / ranks / cited (for SEO/GEO value prop).

**Words we never use:** empower, streamline, unlock, elevate, seamlessly, truly/genuinely/incredibly, solutions/offerings/capabilities, "in today's world", "the leading platform for..." (superlative without proof).

---

## Constraints

**Regulatory or legal limits:** [NEED: data residency, DPA, sub-processors, retention]. SOC 2 language must match auditor letter date.

**Anything off-limits:** No fabricated statistics, testimonials, customer names, or case studies — write `[NEED: x]` and flag (per `SKILL.md` honesty spine). No invented traffic figures for AI search. Never promise citation — promise extractability. Never touch live campaigns or handle credentials. Never kill `localhost:3000` dev server per `AGENTS.md:1` — use HMR. All icons must be `reicon-svelte` Outline weight only, verified by `rg -n "<svg" src` → empty.

---

*Saved as `brand-context.md` in project root (also readable from `.claude/` or `.agents/` per `marketing-os/SKILL.md`). Every module reads it automatically. Revisit when positioning, pricing, or proof firms up — stale context is worse than none.*
