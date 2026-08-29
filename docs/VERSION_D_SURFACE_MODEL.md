# Version D surface model

## Purpose

Version D separates Product Client into two deliberate surfaces:

- **Public** — pages a customer, visitor, buyer, or search engine can read.
- **Workspace** — pages used by a product team to collect evidence, make decisions, publish work, and measure what happened.

This is a frontend prototype boundary. It improves navigation and prevents accidental disclosure in the UI, but it is not an authorization system. Before real data is connected, workspace routes must also be protected by authentication, membership checks, and server-side access rules.

## The route contract

| Surface | Routes | Primary job | What it must not show |
| --- | --- | --- | --- |
| Public | `/`, `/products`, `/p/*`, `/launchpad`, `/launch/*`, `/update/*`, `/feedback/*`, `/docs/*`, `/status/*`, `/wall/*`, `/m/*`, `/badge/*`, `/leaderboard`, `/search` | Help the general public discover, understand, trust, and respond to a product | Workspace navigation, team queues, private decisions, internal problems, internal analytics, authoring shortcuts |
| Workspace | `/workspace/*`, `/studio`, `/notifications`, `/following`, `/you`, `/workspace/settings` | Help product teams do the work behind the public pages | Public-only navigation being presented as team work, private records being indexed into the public search |

`/following`, `/you`, and `/notifications` are private user pages even though earlier prototypes placed them beside public discovery. They depend on the current user's identity and therefore do not belong in the public marketplace shell. `/leaderboard` is different: it is a public discovery page because its content does not depend on the current user.

`/feedback/new` remains public: a visitor can send feedback without entering the team's workspace. `/workspace/feedback/*` is the team's triage and linking view. Those are two views of the same kind of information with different audiences.

## Shell rules

### Public shell

The public shell has:

- a Product Client home link;
- public navigation for Discover, Products, and Launches;
- public search;
- theme control;
- a clearly labelled “Share feedback” path where useful.

It does not have:

- the `Workspace` badge;
- Quick Create;
- the notification bell;
- Inbox, Roadmap, Problems, Decisions, Analytics, or Settings links;
- an internal sidebar or workspace mobile navigation;
- a public search result that links into `/workspace`.

The public shell may provide a single workspace entry point in a future authenticated version, but it must be a sign-in/workspace doorway, not a mixed navigation list. Launchpad's “For makers: launch a product” link is that kind of explicit authoring doorway; it is not public navigation. The prototype may keep direct workspace URLs available to continue building the product, while still keeping them out of public navigation.

### Workspace shell

The workspace shell has:

- the workspace header and `Workspace` context label;
- Quick Create;
- notifications;
- the Understand / Decide / Deliver / Measure navigation;
- workspace mobile navigation;
- private search over all records available to the team.

Public previews may be linked from workspace pages because a team needs to check what customers will see. That link is an intentional preview action, not a shared shell.

## Search rules

Search is one product capability with two indexes:

- **Public search** includes products, public updates, public feedback pages, public help pages, public status pages, customer stories, and maker profiles.
- **Workspace search** includes the public records plus internal problems, roadmap items, product decisions, internal feedback views, incident records, and internal proof-management records.

The search result's URL must match the index that produced it. A public search result must never have an `href` beginning with `/workspace`, and an internal record must not be discoverable from public search merely because its title or description is useful.

The frontend keeps these indexes separate too. Public routes use `src/lib/data/public.ts`, which contains published projections without owners, decision options, consent fields, or workspace URLs. The workspace search implementation is a dynamic import that loads only when a workspace user opens search. This is still not a security boundary, but it keeps the prototype's public bundle from carrying the team's private mock records by default.

Search copy must also name the surface accurately. Public search should say “Search products, updates, help pages, feedback, and customer stories.” Workspace search may say “Search your product work” and may include decisions, problems, and service response records.

## Link rules

Every link should answer one of these questions:

1. Is this taking the reader to another public page for understanding or response?
2. Is this taking a team member to another workspace page for doing product work?
3. Is this an explicit preview from workspace to public?

If it answers none of those, the link is probably a navigation leak or an unclear action.

Public pages must use public paths for related content:

- a public update links to public status, docs, feedback, and the product page;
- a public feedback page links to public product context and public feedback submission;
- a public docs page links to other public docs and public product context;
- a public status page links to public updates and public help pages.

Workspace pages may link to internal records and may also link to public previews.

## “Public with hidden internal components”

Some records have both public and workspace views. The record is not a shared arena; it has two deliberate presentations.

| Record | Public presentation | Workspace presentation |
| --- | --- | --- |
| Product | Product profile, updates, feedback invitation, public proof | Product setup, connected evidence, publishing controls, team context |
| Update | Published explanation for customers | Draft/review/publish context and linked evidence |
| Feedback | Public request and support action | Original message, classification, problem link, decision link, response action |
| Help doc | Reader-facing answer and helpfulness prompt | Content inventory, unanswered searches, review workflow |
| Service problem | Status, impact, timeline, and customer updates | Owner, response timeline, internal follow-up, publishing controls |
| Customer story | Approved quote and product context | Consent, source, tags, approval, placement controls |

The public page may hide controls, metadata, and internal relations, but it must not conditionally render an internal navigation shell. “Hidden internal components” means a smaller public presentation of the record, not one page that exposes both audiences' controls.

## Prototype acceptance checks

The Version D prototype is ready for backend integration only when:

- loading a public route never renders workspace navigation or Quick Create;
- loading a workspace route never renders public-only discovery navigation as if it were the team's work queue;
- public search cannot return internal-only record kinds or internal URLs;
- public pages do not link to internal routes except an explicit future sign-in/workspace doorway;
- workspace pages can open a public preview without changing shell ownership;
- direct URLs remain deterministic even without backend auth;
- the route-to-surface helper has one testable definition, rather than route checks scattered across components.
