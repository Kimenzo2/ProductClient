# Product Client — Version C Competitor, Problem, and Frontend Research

**Status:** Research brief for the Version C prototype roadmap  
**Research date:** 2026-08-29  
**Scope:** Frontend information architecture, user workflows, object relationships, search, and prototype validation  
**Backend status:** Intentionally out of scope for this pass; backend implications are recorded only as future design constraints

## Executive position

Product Client should not become a smaller copy of Product Hunt, Productboard, Linear, Mintlify, Senja, or incident.io. Each of those products solves one part of the product lifecycle well. Their strongest shared lesson is that teams need a trustworthy chain from **signal** to **decision** to **delivery** to **communication** to **learning**.

The Version C opportunity is to make that chain understandable to both technical and non-technical people:

```text
Customer / team signal
        ↓
Problem or opportunity
        ↓
Decision and evidence
        ↓
Roadmap bet / delivery work
        ↓
Release and documentation
        ↓
Adoption, feedback, incidents, and proof
        ↺
```

The central frontend object should therefore not be a feature card. It should be a **product thread**: a visible, navigable chain of related records with a clear owner, state, audience, evidence, and next action.

Version C should optimize for these outcomes:

1. A non-technical customer can understand what exists, what changed, what is planned, what is broken, and how to give useful feedback.
2. A product manager can move from raw feedback to a defensible decision without copying context between tools.
3. A developer can find the original problem, customer evidence, acceptance context, release, documentation, and incident history without entering a second planning universe.
4. A support, sales, or marketing teammate can answer “what is happening?” using a current source of truth rather than making a promise from memory.
5. Leadership can see whether product decisions are connected to outcomes rather than only counting shipped work.

The product should feel like one calm workspace with different views, not nine disconnected mini-products.

## 1. How this research was conducted

### Evidence hierarchy

This brief combines four kinds of evidence and keeps them separate:

| Evidence type | What it is useful for | How it is treated here |
| --- | --- | --- |
| Official product documentation | Understanding the workflow each vendor intentionally supports | High confidence for capability and interaction patterns; not proof that the workflow is easy or successful for every customer |
| Official product pages | Understanding positioning and the job the vendor claims to solve | Useful for category framing; vendor claims are not treated as independent outcome evidence |
| Public changelogs and help articles | Finding edge cases and operational details that marketing pages omit | Particularly useful for approval, filtering, sync, permissions, and lifecycle states |
| Anecdotal community/user evidence | Finding possible pain signals and unmet needs | Hypothesis-generating only; requires interviews or usability tests before product commitment |

The research intentionally favors primary sources. It does not use live browser testing of the current Product Client prototype, and it does not assume that a competitor’s advertised feature is automatically a requirement for Product Client.

### Questions used to compare products

For each category, the comparison asks:

- What user job is the product designed to complete?
- What is its canonical object: launch, request, insight, issue, document, testimonial, or incident?
- How does a record enter the system?
- How does it move through states?
- How does it connect to adjacent records?
- What can be shown internally versus publicly?
- What does search need to retrieve?
- Where does the workflow appear to become heavy, fragmented, or easy to misuse?
- What should Product Client learn without importing unnecessary complexity?

## 2. Competitor and adjacent-product landscape

These products are not all direct competitors. They are reference points for distinct parts of the combined product workflow.

| Product/category | Core job | Strong pattern to learn | Risk or gap Product Client should address |
| --- | --- | --- | --- |
| Product Hunt and launch communities | Create discovery, social proof, and a time-bound launch moment | A launch page combines story, media, comments, votes, maker participation, and visible momentum; the product page can become a longer-term source of truth | Launch attention is episodic. Ranking signals can encourage vanity behavior, and launch activity does not automatically become a durable product decision or delivery record |
| Productboard | Capture customer insight and use it to prioritize product opportunities | Feedback can be highlighted, linked to feature ideas, enriched with customer attributes, and used to support a roadmap | A customer-centric system can become a large repository that demands disciplined tagging and maintenance; it still needs a simpler everyday intake experience |
| Linear | Connect product delivery with customer requests, projects, releases, and updates | Requests can be linked to issues/projects, filtered by customer and business attributes, and used to close the feedback loop | Delivery tools are optimized for teams already comfortable with engineering concepts; they can leave non-technical audiences dependent on someone else to translate status |
| Canny | Collect public/private requests, segment voters, publish roadmaps, and announce changelog updates | A request has a visible lifecycle and can notify interested voters when its status changes | Feedback boards can turn into crowded lists of solutions. Public status can be mistaken for a promise, and different audiences may need different context |
| Aha! | Connect strategy, goals, ideas, prioritization, and roadmaps | Scorecards make trade-offs explicit and let teams explain why an idea moved forward | Powerful strategy frameworks can be intimidating or slow for a small team or a non-technical contributor; scoring can create false precision |
| Jira Product Discovery | Collect opportunities and insights, prioritize them in multiple views, and connect them to delivery | The same idea can be expressed as a problem, opportunity, request, or solution, then viewed as a list, board, matrix, or timeline | Flexibility and Jira connectivity are valuable, but the mental model can feel enterprise-heavy and delivery-centric for customers and stakeholders |
| Mintlify and modern docs platforms | Help users find, understand, and validate product knowledge | Search, cited assistant answers, page feedback, query analytics, and content-gap signals create a learning loop | Documentation feedback often stays inside the docs system instead of informing product decisions, releases, incidents, and roadmap context |
| Senja / Wall of Love tools | Collect, curate, approve, search, and reuse customer proof | Testimonials are not just collected; they are tagged, filtered, approved, pinned, embedded, and reused in multiple contexts | Proof can become marketing inventory disconnected from the underlying customer problem, product change, consent, or measurable outcome |
| incident.io | Coordinate incidents, capture timelines, create postmortems, and drive follow-up work | Incident context, people, timeline, templates, status, comments, follow-ups, and completion policies live together | Incident learning often ends at the postmortem or external issue tracker; the product opportunity and documentation correction still require deliberate linking |
| Atlassian Statuspage | Communicate incidents and maintenance to customers and subscribers | Clear states, affected components, consistent updates, subscriptions, incident history, and public/private/audience-specific pages | A communication surface is not the same as an incident command center. Public updates must be fast and human-readable without exposing internal investigation detail |

### 2.1 Product Hunt: discovery is a moment, trust is a history

Product Hunt’s [official launch definitions](https://www.producthunt.com/launch/definitions) and [launch-day guidance](https://www.producthunt.com/launch/launch-day-duties) distinguish a launch page from a longer-lived product page. A launch page is the event and conversation around a particular release; the product page can represent the product’s longer-term journey, including launches, reviews, and other information. Launch-day guidance emphasizes the maker’s role in replying to comments and monitoring position, upvotes, comments, and reviews. The platform’s [launch-day questions](https://www.producthunt.com/launch/launch-day-questions) also make clear that ranking depends on several signals and that the exact algorithm is not public.

**Frontend lessons:**

- A product needs a durable identity separate from a single event.
- A release should have an event view, a historical view, and a product-context view.
- Public participation should be visible, but the product must not confuse popularity with product quality.
- Every launch or announcement needs a path back to the actual product record, documentation, roadmap context, and feedback.
- Metrics should distinguish attention, qualified interest, activation, and learning.

**Version C implication:**

Build launch and release surfaces as **views of a product thread**, not as a separate social network. A launch can have a hero, media, maker response, comments, and reactions, but its primary links should point to the release, the changed product areas, relevant docs, and follow-up feedback.

### 2.2 Productboard: customer evidence must survive prioritization

Productboard’s [documentation](https://support.productboard.com/hc/en-us/articles/360058147693-What-is-Productboard) and [product-management materials](https://www.productboard.com/product-management-tools/) center on collecting customer feedback, turning notes into insights, linking insights to feature ideas, adding customer attributes, and using that context in prioritization and roadmaps. Its [customer-insight guidance](https://support.productboard.com/hc/en-us/articles/10071375851155-Support-your-feature-ideas-with-customer-insights) and [prioritization materials](https://www.productboard.com/prioritize-features/) describe customer importance signals and value/effort-style matrices.

**Frontend lessons:**

- The raw signal and the product decision are different records.
- A decision should preserve the people, accounts, segments, or evidence behind it.
- The UI must make “who asked?” and “how important is this problem?” answerable without opening five pages.
- Prioritization should be explainable. The score is not the decision; the reasoning behind the score is.

**Risk to avoid:**

Do not make every contributor fill a long structured form before they can report a problem. Capture should be fast; normalization and enrichment can happen later through progressive disclosure.

### 2.3 Linear: links reduce translation cost

Linear’s [customer-request workflow](https://linear.app/docs/customer-requests) links customer requests to issues and projects, supports customer attributes such as revenue, company size, or tier, allows filtering by request counts and those attributes, and includes integrations and API paths. Its [project and initiative updates](https://linear.app/docs/initiative-and-project-updates) provide health indicators, structured status updates, history, reminders, reactions, and shareable links. [Releases](https://linear.app/docs/releases) connect delivery work to production or staging and can automate release-note material.

**Frontend lessons:**

- A link is valuable only when it carries context: why this request matters, who it affects, what delivery work is attached, and what happened next.
- Project status should be readable in one sentence by a non-engineer.
- Release information should be generated from delivery context but edited by a human before publication.
- A single item may need an internal technical view and an external customer-readable view.

**Risk to avoid:**

Do not force clients to understand issue identifiers, sprint concepts, or engineering states. Product Client should translate delivery states into plain-language product states while retaining a technical detail layer for developers.

### 2.4 Canny: public feedback works when closure is visible

Canny’s [official feature materials](https://canny.io/features) describe boards, categories, tags, user segmentation, voter impact, public and internal roadmaps, status changes, notifications, changelogs, widgets, and release scheduling. Its [help materials](https://help.canny.io/en/articles/3816826-canny-101) distinguish public categories from internal tags and describe a request moving through a roadmap lifecycle before appearing in a changelog.

**Frontend lessons:**

- A feedback item needs an explicit state, not just a vote count.
- Interested people need a subscription or notification path.
- The public view and the internal view should be related but not identical.
- Closing the loop is a product action: “shipped,” “not planned,” “merged,” “answered,” or “needs more evidence” should be visible and explainable.

**Risk to avoid:**

Never let “under consideration” become a vague promise. Each public state should have a definition, owner, last-updated date, and confidence or commitment level.

### 2.5 Aha! and Jira Product Discovery: strategy is a translation layer

[Aha!](https://www.aha.io/) emphasizes goals, product discovery, idea management, visual roadmaps, feature prioritization, prototypes, customer interviews, feedback consolidation, and scorecards. Its [framework](https://www.aha.io/roadmapping/guide/the-aha-framework/the-aha-framework-for-product-development) describes scoring value, strategic fit, and effort. [Jira Product Discovery](https://www.atlassian.com/software/jira/product-discovery/features) emphasizes capturing problems, opportunities, requests, and ideas; adding insights and delivery links; customizing fields; and publishing views for different audiences.

**Frontend lessons:**

- One record may need multiple representations: list, board, matrix, timeline, roadmap, or stakeholder view.
- Strategy should explain what the team is trying to achieve, not only which features are next.
- An opportunity should be allowed to exist before a solution is selected.
- Views are audience adapters, not duplicate databases.

**Risk to avoid:**

Do not start Version C with a giant customizable field builder. First establish a small, opinionated model that users can understand. Add customization only where real workflows repeatedly fail without it.

### 2.6 Mintlify: search is a product-quality sensor

[Mintlify’s assistant](https://mintlify.com/docs/guides/assistant) provides natural-language answers with source citations and navigable links. Its [analytics](https://mintlify.com/docs/guides/analytics) include visitors, views, actions, popular pages, referrers, page feedback, search queries, and low-confidence searches. Its [feedback model](https://www.mintlify.com/docs/api/analytics/feedback) can include page path, comment, timestamp, source, status, helpfulness, and contact information; its newer [agent-feedback workflow](https://www.mintlify.com/docs/optimize/feedback) adds structured feedback from AI agents.

**Frontend lessons:**

- Search is not only navigation; failed searches expose missing product knowledge.
- Answers need provenance, links, and a path to report “wrong,” “outdated,” or “not enough.”
- Docs feedback should link to a product problem or content task rather than disappear into analytics.
- Search results should explain why a result matched and show the object type.

**Risk to avoid:**

An assistant that answers confidently without showing source, freshness, and scope will damage trust. Product Client should make “I found this in…” and “last updated…” first-class UI elements.

### 2.7 Senja and Wall of Love: proof requires governance

[Senja’s official materials](https://senja.io/testimonial-software/collect) describe collection forms, imports from external sources, search and filtering, tags, approvals, widgets, Walls of Love, pinning, exports, and usage analytics. The [help center](https://support.senja.io/widgets-6qt8l) also documents approval behavior and the distinction between stored testimonials and what is visible in a widget or wall.

**Frontend lessons:**

- Proof has a lifecycle: requested, received, reviewed, approved, featured, reused, archived.
- Attribution, source, consent, and usage context matter as much as the quote.
- The same proof asset may be embedded on a product page, launch page, release note, sales view, or public wall.
- Search by text, segment, product area, source, and use history is more valuable than a gallery alone.

**Risk to avoid:**

Do not treat positive testimonials as a replacement for representative feedback. Proof is one evidence type. It should sit beside problems, requests, support conversations, research, and usage signals.

### 2.8 incident.io and Statuspage: communication and learning are distinct jobs

[incident.io’s postmortem workflow](https://docs.incident.io/post-incident/postmortems-overview) keeps incident data, timelines, people, custom fields, and catalog context available inside the document; it supports templates, collaboration, comments, status workflow, multiple documents per incident, sharing/export, and follow-up tracking. Its [follow-up workflow](https://docs.incident.io/post-incident/follow-ups) can export actions to an issue tracker and track status, assignment, priority, labels, reminders, and completion. [Atlassian Statuspage](https://support.atlassian.com/statuspage/docs/what-is-statuspage/) focuses on external communication: incident states, affected components, incident history, subscribers, notifications, public/private/audience-specific pages, and consistent updates from investigation through resolution.

**Frontend lessons:**

- The live incident room, public status page, and postmortem are different audience surfaces for the same event.
- The event timeline should be reusable; people should not reconstruct it manually for every document.
- Follow-up actions must remain visible after the incident is closed.
- Public communication should be concise, empathetic, precise, and consistent across channels.
- A resolved incident should link to documentation corrections, roadmap work, a release, or a customer-facing explanation when appropriate.

**Risk to avoid:**

Do not merge internal incident response and public status communication into one overly exposed screen. A shared event model with permissioned views is safer and easier to understand.

## 3. Cross-product patterns that appear repeatedly

### Pattern A — The market is fragmented around objects, not around the lifecycle

Every category has a strong canonical object:

| Category | Canonical object |
| --- | --- |
| Launch/community | Launch, product page, comment, reaction |
| Customer-centric product management | Insight, request, opportunity, feature idea |
| Engineering delivery | Issue, project, initiative, release |
| Docs | Page, search query, answer, feedback item |
| Customer proof | Testimonial, quote, wall, widget |
| Incident management | Incident, timeline, status update, postmortem, follow-up |

The user’s actual work crosses those boundaries. A customer asks a question that reveals a problem. The problem becomes a roadmap decision. The decision becomes delivery work. The release changes docs. A launch communicates it. An incident may reveal a related reliability problem. A testimonial confirms value.

Product Client’s differentiator should be a **relationship layer** that gives these objects a coherent identity and makes the links legible.

### Pattern B — Visibility is a product feature

The strongest products make status visible to the right audience:

- public versus internal roadmap;
- customer-specific request visibility;
- internal incident versus public status page;
- internal postmortem versus customer-facing summary;
- approved proof versus private testimonial;
- draft versus published docs;
- private delivery detail versus plain-language release note.

Product Client should not make “public” a single global switch. Visibility should be modeled as an audience view of a record, with explicit publish status and a preview before exposure.

### Pattern C — Closure is more important than collection

Collecting feedback is easy. Deciding, communicating, and showing the result is the difficult part. A useful record should answer:

- What did we hear?
- What problem does it represent?
- How many or which people are affected?
- What did we decide?
- Who owns the decision?
- What is the current state?
- When was it last updated?
- What changed for the requester?
- Where is the source evidence?
- What remains unresolved?

### Pattern D — Automation must remain human-editable

Release notes, assistant answers, postmortems, status updates, and synthesized feedback can be drafted automatically. The human should be able to see the sources, edit the language, inspect freshness, and choose the audience before anything is published.

### Pattern E — The hidden cost is metadata maintenance

Tags, fields, segments, health indicators, severity levels, categories, and statuses create power but also create work. Version C should distinguish:

- required fields needed to make a decision safe;
- recommended fields that improve retrieval;
- optional fields for advanced teams;
- derived fields that the system can calculate from relationships and events.

The default interaction should be useful with a small amount of input. A blank system with 30 required fields is not enterprise-grade; it is an adoption barrier.

## 4. Problem hunting

The following problems are the strongest opportunities suggested by the research. They are deliberately phrased as user problems rather than feature requests.

| Problem | Who feels it | Observable consequence | Version C response |
| --- | --- | --- | --- |
| Context is scattered across tools | Everyone | People repeat the same explanation in feedback, tickets, roadmap, docs, release notes, and incident reports | A linked product-thread view with backlinks and a visible activity history |
| Feedback is captured as a solution instead of a problem | PM, support, customers | “Add X” requests are voted on without understanding the job, affected segment, workaround, or impact | Capture the original wording, then offer a lightweight problem-framing step |
| Collection has no closure | Customers, support, PM | The request disappears after submission or remains in “planned” indefinitely | Explicit states, owner, next update date, subscriptions, and closure messages |
| Public roadmaps create accidental promises | Customers, sales, leadership | “Planned” is interpreted as guaranteed delivery and dates are treated as commitments | Separate status from confidence, target window, and commitment level; show definitions in the UI |
| Internal and external audiences need different language | Developers, customers, sales | Technical notes are too detailed, public notes are too vague, and translation is manual | One record with audience-specific projections and a preview/publish boundary |
| Roadmaps display work but not reasoning | Leadership, PM, stakeholders | Teams debate order without seeing evidence, strategy, risk, or constraints | Decision panel with evidence, criteria, assumptions, confidence, and dissent |
| Search finds pages but not answers | Everyone | Users open several records or ask a teammate; low-confidence queries remain invisible | Global search across all object types, facets, source labels, relation previews, and failed-search capture |
| Docs are disconnected from product truth | Customers, support, developers | Docs go stale after release or do not explain known limitations and incidents | Link docs to releases, product areas, decisions, incidents, and feedback; show freshness and feedback state |
| Incident response stops at resolution | Engineering, support, PM | Follow-up work is lost, postmortems are late, and the same problem returns | Incident timeline plus postmortem plus tracked follow-ups linked to delivery and docs |
| Proof is stored separately from product learning | Marketing, PM, sales | Quotes are reused without knowing the product area, cohort, consent, or outcome | Proof records with source, approval, audience, tags, related problems/releases, and reuse history |
| Metrics reward attention instead of value | Leadership, marketing, PM | Upvotes, views, and comments look healthy while activation, retention, resolution, or understanding remains weak | Separate attention, evidence, decision, delivery, adoption, and trust metrics |
| Enterprise permissions are hard to reason about | Admins, support, clients | Sensitive feedback, private incidents, or unreleased work leaks or becomes inaccessible | Object-level audience model, clear visibility badges, safe previews, audit history, and permission-aware search |
| Integrations create competing truths | PM, engineering, support | A status differs between systems, sync direction is unclear, and users stop trusting the record | Display source-of-truth ownership, sync status, last sync, conflict state, and manual override path |
| Notification volume becomes another inbox | Everyone | People mute the product or miss the one update that matters | Event subscriptions, digest controls, audience-aware defaults, and actionable notifications |
| AI makes a polished but unsupported claim | Everyone | Users trust an answer that is stale, partial, or based on the wrong audience | Source citations, freshness, confidence, scope, feedback, and human approval for publication |

### The most dangerous failure modes

1. **A beautiful object graph that nobody maintains.** If links require too much manual work, the system will decay. Relationships need quick creation, sensible suggestions, and a low-friction “link later” path.
2. **A public promise disguised as an internal status.** “Planned,” “in progress,” and “targeted” need precise meanings and visible confidence.
3. **A search box that searches only titles.** The primary value of the product is hidden in comments, source snippets, docs, incident updates, release notes, and relationship context.
4. **A dashboard full of vanity metrics.** The product should reveal decision quality and closure, not only activity.
5. **A single view trying to serve every role.** The same record needs role-specific projections. Unification should happen in the data and links, not by placing every field on every screen.
6. **Backend-shaped frontend.** Showing IDs, raw integration states, empty technical fields, or database terminology will make the product feel like an admin console. The prototype must first validate user language and task flow.

## 5. What users likely want from a cohesive Product Client

These are requirements suggested by the cross-product comparison. They are not all Version C commitments; they should be validated with representative users.

### 5.1 A clear starting point

Users want to know what deserves attention now. The home view should not be a generic dashboard of everything. It should answer:

- What changed since I last visited?
- What needs my decision?
- Which customer promises need an update?
- Which release is approaching?
- Which incidents or follow-ups are open?
- Which searches, docs, or feedback signals indicate confusion?

The home view should adapt by role while preserving the same object language.

### 5.2 Fast capture from anywhere

A person should be able to capture a feedback signal, problem, incident, proof asset, decision note, or task from the global create action. The first step should ask only for:

- what happened or what was heard;
- who or what it concerns;
- where it came from;
- whether it is private or shareable.

The user can attach a product, customer, segment, or existing record immediately, or leave it for triage. A slow intake form is a major risk to adoption.

### 5.3 An inbox that is for decisions, not just messages

The inbox should normalize incoming work from product feedback, docs feedback, support, incident follow-ups, launch comments, proof submissions, and integrations. It should support:

- triage state;
- owner and team;
- duplicate or related records;
- problem framing;
- merge without losing original source;
- convert to problem, decision, follow-up, doc task, or roadmap candidate;
- snooze with a next review date;
- bulk actions that remain reversible;
- a clear reason why an item is waiting.

An inbox item is not necessarily a task. It is an unresolved signal that needs a next disposition.

### 5.4 Decisions with evidence, not just status

A product decision should have a compact summary:

- problem/opportunity statement;
- affected audience or segment;
- evidence count and representative sources;
- current workaround or cost of inaction;
- strategic goal or outcome;
- options considered;
- chosen direction;
- confidence and assumptions;
- owner and review date;
- related delivery, docs, release, incident, and proof records.

The user should be able to open any evidence item in context and return to the decision without losing place.

### 5.5 Roadmap views that communicate uncertainty honestly

The roadmap should support at least three projections of the same work:

1. **Decision view:** problems, outcomes, evidence, confidence, and trade-offs.
2. **Delivery view:** work items, dependencies, owners, release, and technical state.
3. **Public view:** plain-language themes, target window where appropriate, current status, and feedback path.

The roadmap needs a legend that defines every state. It should not require a tooltip hunt to discover whether “next” means committed, likely, or merely being explored.

### 5.6 Product truth pages

Every product or product area should have a compact truth page with:

- what it is for;
- current state;
- recent releases;
- relevant docs;
- roadmap themes;
- open feedback themes;
- known incidents and reliability notes;
- selected proof;
- owner and last updated date;
- a clear action to ask a question or submit feedback.

This is the place where the launch/community lesson, the docs lesson, the feedback lesson, and the incident lesson meet.

### 5.7 Release communication without duplicate writing

A release composer should pull from linked delivery work, decisions, docs, and resolved feedback. It should provide:

- internal technical summary;
- customer-readable summary;
- affected product areas;
- docs links;
- feedback items closed or advanced;
- known limitations;
- incident or reliability note when relevant;
- audience selection;
- preview and publish states;
- edit history and source links.

The release is a boundary between “work is happening” and “people can rely on this information.”

### 5.8 Search that exposes relationships

Global search should search across:

- product and product area names;
- feedback wording and comments;
- problem and decision summaries;
- roadmap and delivery records;
- releases and changelog entries;
- docs titles, headings, body, and aliases;
- incident titles, updates, and postmortems;
- proof text, tags, source, and speaker;
- people, organizations, segments, and integration references.

Search results should show type, state, owner, last updated, visibility, and a small relation preview. A result should answer “why is this here?” and “what else is attached?”

Search states are part of the product design:

- no query;
- suggestions and recent searches;
- exact result;
- broad result;
- no result with capture action;
- low-confidence answer with source disclosure;
- permission-filtered result;
- stale result with freshness warning;
- integration conflict result;
- loading and error states.

### 5.9 Docs that participate in the product loop

Docs should not be a separate publishing island. A page should be able to show:

- related product areas and releases;
- audience and visibility;
- last verified date;
- owner;
- helpfulness and qualitative feedback;
- common search queries that led to it;
- open content issues;
- related incidents or known limitations;
- a path to ask a follow-up question.

AI assistance can help synthesize or answer, but the UI must show citations, page links, freshness, and a feedback action.

### 5.10 Incidents that become learning

The incident experience should include three clearly related surfaces:

- **Incident room:** internal response, roles, live timeline, updates, and actions.
- **Status page:** customer-facing component status and plain-language updates.
- **Learning record:** postmortem, follow-ups, documentation changes, product problems, and releases.

The frontend should make the handoff visible: “resolved” is not the end of the thread if follow-ups or customer explanation remain open.

### 5.11 Proof that is useful, not merely decorative

The proof library should support:

- text, video, screenshot, case study, review, and quote;
- source and original link;
- consent and permitted uses;
- speaker, role, organization, segment, and product area;
- sentiment or theme as an aid, not a truth claim;
- approval workflow;
- featured/pinned state;
- related problem, release, or outcome;
- placement history and reuse analytics.

The public Wall of Love should link back to the product context where safe. The internal library should show the evidence context and governance fields.

## 6. Proposed product model for a linked frontend

The following is a prototype vocabulary. It is deliberately small enough to understand and broad enough to support later backend integration.

| Object | Meaning | Typical entry point | Important links |
| --- | --- | --- | --- |
| Workspace | Organization boundary and permission context | Workspace switcher/settings | products, people, teams, policies, integrations |
| Product | The thing customers use or discover | Product page, launch, product list | areas, releases, docs, feedback, incidents, proof |
| Product area | A bounded capability or domain | Product truth page | problems, roadmap items, docs, incidents, releases |
| Signal | Raw input such as feedback, research, support note, search gap, or launch comment | Global create, integration, public form | person, organization, product area, problem, decision |
| Problem/opportunity | Normalized user need or risk | Inbox triage, product page | signals, segments, decision, roadmap item, incident |
| Decision | Why the team chose a direction or did not choose one | Problem detail, decision workspace | evidence, goals, options, roadmap, delivery |
| Roadmap item/bet | Planned or explored outcome-oriented work | Decision, roadmap | problem, decision, delivery, release, public view |
| Delivery item | Engineering or operational work | Integration, roadmap, incident follow-up | roadmap item, release, incident, docs |
| Release | A coherent change communicated to an audience | Delivery, release composer | roadmap, docs, feedback closure, launch, incident |
| Doc page | Durable product knowledge | Docs, search, release | product area, release, incident, feedback, search queries |
| Incident | Reliability or service event | Incident room, integration, status page | product area, status updates, postmortem, follow-ups, docs |
| Proof asset | Customer evidence of value or experience | Public form, import, feedback | person, organization, product area, problem, release, placement |
| Audience/view | A projection of records for a group | Public page, stakeholder view | roadmap, product truth, docs, status, launch |
| Metric/event | Behavioral or operational signal | Analytics, integration | object, outcome, release, incident, search query |

### Relationship rules

The frontend should make these relationships visible without creating a graph database feeling:

- A signal can support many problems; a problem can have many signals.
- A problem can inform multiple decisions over time.
- A decision can produce one or more roadmap bets.
- A roadmap bet can contain multiple delivery items and belong to a release.
- A release can update many docs and close or change many feedback items.
- An incident can create multiple follow-ups, documentation changes, and product problems.
- A proof asset can relate to a problem, a release, a product area, or an outcome.
- A record can have an internal view and one or more public/audience-specific views.

These are product relationships, not necessarily user-visible technical foreign keys. The prototype should show meaningful labels such as “supports,” “caused,” “ships in,” “documented by,” and “communicated through.”

## 7. Version C frontend information architecture

### 7.1 Navigation principle

The primary navigation should group by the user’s work, not by backend entity count.

Recommended Version C shell:

```text
Product Client
├── Home
├── Inbox
├── Understand
│   ├── Feedback
│   ├── Problems
│   ├── Docs
│   └── Proof
├── Decide
│   ├── Roadmap
│   └── Decisions
├── Deliver
│   ├── Releases
│   └── Incidents
├── Insights
└── Settings
```

This is a conceptual grouping. It should not force every section into a separate visible route. On smaller screens or for clients with limited permissions, secondary sections can appear as contextual tabs or a “More” menu.

### 7.2 Global shell

| Element | Position | Why it exists | Behavior |
| --- | --- | --- | --- |
| Workspace/product switcher | Top-left | Establishes context before any action; prevents users confusing products or workspaces | Opens recent and favorite workspaces/products; shows current context in the trigger |
| Global search | Top center or largest header slot | Search is the cross-product connective tissue and the fastest route to any object | Opens command/search surface; preserves query when navigating to a result; supports keyboard shortcut |
| Global create button | Immediately beside search, visually primary | Capture should be available from every context | Menu offers signal, problem, decision, release, doc, incident, proof; current context prefilled but editable |
| Notifications/activity | Top-right | Surface decisions, mentions, state changes, and subscribed updates | Separates actionable from informational; supports digest controls |
| Help/feedback | Top-right, secondary | Gives users a way to report confusion about the product itself | Opens contextual help, contact, or product feedback without leaving current work |
| Profile/access | Far right | Account, role, and personal preferences | Never carries primary workflow actions |
| Primary nav | Left rail | Stable orientation and role-based access | Collapsible, but labels remain available on hover/focus and at narrow widths |
| Contextual subnav | Below page title or inside object | Keeps object-specific sections close to the object | Tabs are generated from the current object, not duplicated in the global rail |

### 7.3 Page-level action hierarchy

Every collection or detail page should make one primary action obvious. The action should be close to the content it changes.

Recommended order:

1. Primary action: create, publish, resolve, or save the page’s main outcome.
2. Secondary action: filter, share, preview, or invite.
3. Tertiary actions: export, duplicate, archive, delete, or integration operations.
4. Destructive actions: visually separated and confirmed with impact language.

Avoid placing five same-weight buttons in the header. The user should be able to infer what happens next from position and emphasis alone.

### 7.4 Object detail layout

The detail page is the most important reusable prototype pattern.

```text
Breadcrumbs / object type / visibility
Title                         Primary action   More
State · owner · last updated · audience

Tabs: Overview | Activity | Evidence | Relations | History

Main content column                         Context rail
├── Summary / problem / update               ├── Owner
├── Current state and next step              ├── Audience + visibility
├── Evidence or timeline                     ├── Product area
├── Related records                           ├── Dates / confidence
└── Comments / activity                       └── Integrations / IDs
```

The context rail should remain compact and scannable. It should not compete with the primary narrative. On mobile, it moves below the main content or opens as a “Details” sheet.

### 7.5 Internal linking rules

Every linked object should answer three questions before the user opens it:

- What type is it?
- What state is it in?
- Why is it related to this record?

Use relation labels rather than generic “linked items” where possible:

- **Supports this problem**
- **Created by this incident**
- **Ships in this release**
- **Explains this decision**
- **Documented by this page**
- **Requested by these customers**
- **Featured as proof of this outcome**

Backlinks are required. If a release links to a doc, the doc should show the release. If a problem links to a feedback signal, the signal should show the problem. A one-way link creates orphaned context.

## 8. Frontend screen map for the Version C prototype

This is the recommended prototype map. It is intentionally more detailed than a first implementation because the purpose of this pass is to expose the workflow before backend decisions harden it.

### Home

**Purpose:** Orient the user around decisions and changes, not activity volume.

**Required modules:**

- “Needs your attention” queue;
- recent changes across subscribed products or areas;
- release/incident strip;
- open customer commitments;
- search and docs quality signals;
- quick capture;
- role-aware explanation of why each item appears.

**Do not add yet:** a dense KPI wall without a clear action.

### Inbox

**Purpose:** Triage unresolved signals from multiple sources.

**Required controls:**

- all/unassigned/mine/team tabs;
- source and type filters;
- duplicate/related/convert actions;
- assign, snooze, merge, archive;
- quick preview without losing list position;
- bulk operations with undo;
- visible next action and due/review date.

**Important empty state:** Explain what enters the inbox and provide a capture button. Do not show a dead blank panel.

### Feedback

**Purpose:** Explore raw and normalized customer input.

**Required modules:**

- source, segment, product area, state, and impact filters;
- searchable feedback cards or rows;
- votes/reactions separated from evidence quality;
- requester/account context;
- conversion to problem;
- status update composer;
- subscribe/follow path;
- original source link.

**Risk:** A voting leaderboard will bias the interface toward loud or large audiences. Keep representative evidence visible beside volume.

### Problem detail

**Purpose:** Turn scattered signals into a clear user problem.

**Required modules:**

- problem statement and affected user;
- evidence list with source labels;
- segment/account impact;
- current workaround and cost of inaction;
- related incidents or docs gaps;
- options/decisions;
- confidence and assumptions;
- “what happens next” block;
- activity/history.

### Decision workspace

**Purpose:** Make prioritization defensible and legible.

**Required modules:**

- desired outcome/goal;
- evidence summary;
- options with trade-offs;
- effort/risk/impact inputs;
- decision owner and review date;
- dissent or unresolved assumptions;
- resulting roadmap bet;
- decision log.

**Frontend principle:** Display the reasoning before the score. A number without explanation creates false confidence.

### Roadmap

**Purpose:** Communicate direction at the right level of detail.

**Required views:**

- outcome/thematic roadmap;
- delivery timeline or board;
- public preview;
- filters by product, area, owner, confidence, and audience;
- legend for states and commitment levels;
- item detail drawer with evidence and next action.

**Required states:** exploratory, considered, planned, committed, in progress, shipped, paused, not planned, and archived. The exact labels can be tuned after user interviews, but each must have a plain-language definition.

### Product truth page

**Purpose:** Give any stakeholder one place to understand a product or product area.

**Required modules:**

- overview and owner;
- current status;
- latest release;
- relevant docs;
- roadmap themes;
- feedback themes;
- incidents/status;
- proof;
- ask/question/feedback action;
- public/internal preview toggle for authorized users.

This page is the strongest candidate for the “cohesive” product moment.

### Releases

**Purpose:** Turn delivered work into understandable communication.

**Required modules:**

- release list with state and audience;
- draft/in review/published/archive states;
- generated source material from linked work;
- customer-readable summary;
- technical notes;
- docs and feedback links;
- preview;
- publish and notify controls;
- change history.

### Docs

**Purpose:** Publish and improve durable product knowledge.

**Required modules:**

- docs navigation and search;
- page preview;
- last verified and owner;
- related releases/incidents/feedback;
- helpful/not helpful plus comment;
- low-confidence search and unanswered question queue;
- internal versus public draft state.

### Incidents

**Purpose:** Coordinate, communicate, and learn.

**Required modules:**

- incident list with severity/state/affected area;
- incident room and timeline;
- status-page preview;
- update composer with audience selector;
- postmortem status;
- follow-up list and owner;
- related docs, roadmap, release, and feedback;
- incident history.

### Proof / Wall of Love

**Purpose:** Govern and reuse customer evidence.

**Required modules:**

- collection/import;
- approval queue;
- tags, source, speaker, product area, and use permissions;
- search and filters;
- feature/pin controls;
- internal context and related outcomes;
- public wall preview;
- embed/share/export;
- reuse history.

### Insights / Analytics

**Purpose:** Inspect the health of the product loop.

**Required lenses:**

- signal volume and triage aging;
- evidence-linked decisions;
- roadmap freshness and stale commitments;
- release communication latency;
- docs search success and low-confidence queries;
- feedback closure rate and time to update;
- incident communication latency and follow-up completion;
- proof collection/approval/reuse;
- adoption or outcome measures where available.

Every chart should link to the records behind it. A metric without a drill-down is a screenshot, not a workflow.

## 9. Component-level decisions: why small frontend details matter

### Search position

Search belongs in the global shell because it is the cross-object entry point. It should not be hidden inside a page-specific toolbar. A contextual search can filter the current collection, but the global search must remain one click or shortcut away.

### Global create position

The create action belongs next to search because search and capture are complementary escape hatches: “I need to find something” and “I need to put something somewhere.” The current product or workspace context should be prefilled, but the menu must show the object type before submission.

### Header action position

The page header should contain the action that changes the page’s primary state: publish a release, update an incident, create a problem, or add a roadmap item. Secondary actions should not visually compete with it.

### Breadcrumbs

Breadcrumbs are especially important in a linked product because a user can arrive from search, a notification, a public view, or a relation chip. They answer “where am I?” and provide a reliable return path.

### Tabs versus long pages

Use tabs for stable categories of the same object—overview, evidence, activity, relations, history. Use a long page for a narrative that people need to scan together, such as a status update or release preview. Do not hide a critical state or next action behind a tab.

### Drawers versus full pages

Use a drawer for preview, quick triage, or selecting a relationship. Use a full page for decision-making, writing, comparison, incident coordination, and permission-sensitive publishing. A drawer should always offer “open full record” without resetting list position.

### Relation chips

Relation chips should show type, state, and label. A generic blue link is not enough. The user should be able to distinguish a problem from a release, a private incident from a public status, and a draft doc from a published doc.

### Empty states

Every empty state needs a reason and an appropriate action:

- no feedback yet → “Capture feedback” or “Connect a source”;
- no linked evidence → “Add evidence” or “Find in inbox”;
- no roadmap items → “Create a decision”;
- no incidents → “View service status” or “Create incident” only for authorized users;
- no proof → “Collect proof” or “Import existing proof”;
- no search results → “Create a signal” with the query prefilled.

### Loading and error states

The prototype must model loading, partial loading, empty, error, stale, and permission-denied states. A relationship-heavy interface can fail in one panel while the primary record remains usable. Prefer local recovery and clear source/sync information to a full-page failure.

### Destructive actions

Archive, delete, merge, unpublish, and send notifications are materially different actions. Keep them in an overflow menu or dedicated confirmation area, state what will happen to links and subscribers, and provide undo where practical.

### Notifications

Notifications should point to an action or change, not merely announce activity. “Three new comments” is weaker than “Three comments need your response on the public release.” The notification must deep-link to the right record and preserve the user’s return path.

## 10. Version C roadmap proposal

The roadmap below is ordered by cross-workflow leverage and learning value, not by the number of screens.

### C0 — Interaction and object foundation

**Prototype goal:** Validate the vocabulary and navigation before deep feature work.

Build:

- global shell with workspace/product context;
- global search surface with mocked cross-object results;
- create menu;
- object badges, state badges, audience badges;
- breadcrumbs;
- reusable detail layout;
- relation chips and backlinks;
- empty/loading/error/permission/stale states;
- mock object schema and sample linked threads.

**Success signal:** A new user can explain what a record is, where it came from, what it is connected to, and what action is available without a walkthrough.

### C1 — Signal to problem to decision

**Prototype goal:** Prove the core product-management loop.

Build:

- inbox;
- fast capture;
- feedback list/detail;
- duplicate/merge/convert interactions;
- problem detail;
- evidence panel;
- decision workspace;
- transparent prioritization inputs;
- activity and decision history.

**Success signal:** A PM can take several raw signals, consolidate them into one problem, make a decision, and still inspect the original evidence.

### C2 — Product truth and audience projections

**Prototype goal:** Prove that internal and external views can share one model without exposing the wrong detail.

Build:

- product/product-area truth page;
- internal roadmap view;
- public roadmap preview;
- audience/visibility controls;
- plain-language status definitions;
- shareable read-only view;
- link from public content back to feedback or question capture.

**Success signal:** A non-technical user can understand what is current and planned; an internal user can switch to evidence and delivery detail without creating a second record.

### C3 — Release and closure loop

**Prototype goal:** Prove that shipping creates communication and feedback closure.

Build:

- release list/detail;
- draft/review/published states;
- source panel from roadmap/delivery/docs/feedback;
- internal and customer summaries;
- docs links;
- closed-loop notifications;
- release preview and edit history.

**Success signal:** A team can publish a release from linked work and a requester can see what changed without reading engineering notes.

### C4 — Docs/search learning loop

**Prototype goal:** Prove that search and docs become product signals.

Build:

- global search across object types;
- result grouping and relation previews;
- no-result capture;
- low-confidence answer state;
- cited answer prototype;
- docs page feedback;
- query-gap review queue;
- related release/incident/feedback panels.

**Success signal:** A user can find an answer, verify its source, report a gap, and see the gap enter the product inbox.

### C5 — Incident to learning

**Prototype goal:** Prove that reliability work joins the product thread without compromising audience safety.

Build:

- incident list;
- incident room/timeline;
- status-page preview;
- internal/public update composer;
- postmortem view;
- follow-up items;
- links to docs, problems, roadmap, and release;
- privacy and audience warnings.

**Success signal:** A resolved incident has a clear customer communication history and a visible path to follow-up work.

### C6 — Proof and outcome evidence

**Prototype goal:** Position Wall of Love/testimonials as governed evidence, not a disconnected gallery.

Build:

- proof intake/import;
- approval and permitted-use states;
- search/tagging;
- related product area/problem/release;
- internal library;
- public wall preview;
- embed/share/reuse history;
- proof-to-outcome context.

**Success signal:** A teammate can find an approved proof asset for a specific product area and understand its source and allowed use.

### C7 — Operational polish and governance

**Prototype goal:** Validate enterprise trust before backend integration.

Build:

- permission-aware search and previews;
- audit history;
- saved views;
- integration source-of-truth states;
- conflict handling;
- export/API/webhook placeholders;
- retention/archive states;
- accessibility and keyboard flows;
- responsive layout and reduced-motion behavior.

**Success signal:** Users can tell what is private, what is synced, what changed, and who can act without administrator explanation.

## 11. Prioritization frame for Version C

Use a lightweight score rather than adopting a competitor’s full framework:

```text
Version C value = user outcome × cross-workflow leverage × trust impact
                 ÷ adoption friction and prototype complexity
```

Score each candidate from 1–5 on:

- **User outcome:** Does it remove a painful step or improve a meaningful decision?
- **Cross-workflow leverage:** Does it connect at least two major surfaces?
- **Trust impact:** Does it reduce ambiguity, stale information, or leakage?
- **Adoption friction:** How much training, metadata, or migration does it require? Lower friction scores higher.
- **Prototype complexity:** Can the interaction be validated before backend work? Lower complexity scores higher.

Highest-leverage candidates are likely:

| Candidate | Why it should rank high |
| --- | --- |
| Linked object detail layout | Reusable foundation for every workflow and the clearest way to validate the product thesis |
| Global search with relation previews | Connects everything and exposes whether the information architecture is understandable |
| Signal → problem → decision flow | The core product-management job and the main differentiator from launch, docs, and incident tools |
| Product truth page | Makes the combined product legible to non-technical audiences |
| Release closure loop | Connects delivery to customers, docs, feedback, and public communication |
| Visibility/audience preview | Essential for enterprise trust and internal/public cohesion |

Lower priority until validated:

- complex scorecard builders;
- fully automated AI prioritization;
- a social feed or algorithmic leaderboard;
- a complete issue tracker;
- deep observability and monitoring;
- a large workflow automation canvas;
- unlimited custom fields and arbitrary object types.

## 12. Backend-readiness questions to answer after the prototype

No backend implementation is required for this research pass. The frontend should, however, avoid assumptions that would make later integration painful.

### Identity and lifecycle

- Does every object have a stable ID independent of its title or slug?
- Can titles change without breaking links?
- Are draft, published, archived, and deleted states distinct?
- Is “not planned” different from “archived” and “rejected”?
- Can one release or incident have multiple audience projections?

### Relationships

- Are links many-to-many where the workflow requires it?
- Can a relationship have a reason, label, source, or confidence?
- Are backlinks generated automatically?
- What happens to links when a record is merged or archived?

### Permissions and publishing

- Is visibility defined at workspace, product, object, field, and audience levels?
- Can a public projection omit private evidence while retaining a safe summary?
- Can a customer see their own feedback without seeing another account’s context?
- Are publish and notify separate actions?
- Is there a preview that is permission-accurate?

### Search and indexing

- Which fields are full-text searchable?
- Are comments, doc headings, incident updates, and proof transcripts indexed?
- How are aliases, typos, synonyms, and product terminology handled?
- What does a low-confidence result mean?
- How is permission filtering applied before display?
- Are no-result and low-confidence queries stored as actionable signals?

### Integrations and sync

- Which system is authoritative for delivery status, incidents, docs, and CRM/account data?
- Is sync one-way, two-way, or import-only per object?
- How are conflicts presented and resolved?
- What is the last successful sync time?
- Can a user trace a value back to its source system?

### History and audit

- Can the product show who changed a state, audience, owner, or public message?
- Are comments and source evidence retained when a record is merged?
- Can published content be corrected without erasing its history?
- Which changes trigger notifications?

## 13. Validation plan before backend integration

The Version C prototype should be tested as a workflow model, not judged only as a visual artifact.

### Representative participants

Recruit at least:

- one non-technical product/client stakeholder;
- one product manager or founder;
- one developer or engineering lead;
- one support/customer-success person;
- one marketing or community person;
- one operations/reliability participant if incident workflows are in scope.

### Core tasks

1. Find why a roadmap item exists.
2. Submit feedback from a customer perspective.
3. Merge two similar requests without losing their sources.
4. Turn signals into a problem and make a decision.
5. Check what is planned without assuming it is committed.
6. Find the latest release and the relevant docs.
7. Report that a doc is wrong or missing an answer.
8. Read a public incident update and find the current status.
9. Find the postmortem follow-up that remains open.
10. Find approved proof for a particular product area and check whether it can be published.

### Measures

- time to first correct destination;
- wrong-route rate;
- number of times users ask what a label means;
- number of times users lose context after opening a relation;
- completion rate for signal → problem → decision;
- ability to explain public versus internal state;
- perceived trust in search results and AI answers;
- ability to identify the next action and owner;
- number of fields users leave blank or misunderstand;
- qualitative answer to: “What does this product help you do?”

### Validation gates

Do not begin backend integration solely because all screens exist. Move forward when:

- users can predict where information lives;
- the core object vocabulary is stable;
- internal links are understood without explanation;
- public/private boundaries are clear;
- the signal → problem → decision loop feels faster than the current workaround;
- users can distinguish evidence, opinion, status, and commitment;
- the team agrees which system owns each future integrated field.

## 14. Metrics for the eventual product loop

The product should measure whether it reduces uncertainty and improves closure.

### Leading indicators

- percentage of incoming signals triaged within an agreed window;
- duplicate/merge rate and retained source evidence;
- percentage of problems with representative evidence;
- percentage of decisions with a stated outcome and owner;
- freshness of roadmap and product truth pages;
- percentage of releases with docs and feedback links;
- low-confidence and no-result search rate;
- docs helpfulness and unresolved content-gap count;
- incident updates published within the organization’s target cadence;
- postmortem and follow-up completion;
- proof approval and reuse rate.

### Outcome indicators

- time from signal to decision;
- time from decision to understandable communication;
- reduction in repeated questions or duplicate requests;
- customer ability to find status without contacting support;
- adoption or retention change tied to a shipped outcome;
- incident recurrence or follow-up completion quality;
- trust in roadmap and status communication.

Avoid treating page views, votes, comments, or total collected feedback as success by themselves. They are activity signals that need context.

## 15. Research limitations and unbiased interpretation

This research has important boundaries:

- Official vendor documentation describes intended workflows and supported capabilities, not universal user satisfaction.
- Product marketing pages naturally emphasize strengths and may omit cost, setup effort, migration, or governance burden.
- No direct interviews, usability tests, customer-support dataset, or Product Client telemetry were available in this pass.
- Public launch and feedback activity is biased toward people who are already motivated to participate.
- The combined product has a real risk of scope expansion. “Cohesive” must not become “every adjacent category in one navigation rail.”
- Some features may be plan-gated, integration-dependent, region-dependent, or changed after this research date. Confirm current commercial and technical details before making procurement or backend decisions.

The right conclusion is not that every observed competitor feature must be built. The conclusion is that Product Client should own the handoffs between categories and keep those handoffs understandable.

## 16. Recommended Version C product principles

1. **One thread, many views.** A product story should remain connected as it changes audience and state.
2. **Problem before solution.** Preserve the original signal and make the underlying need explicit.
3. **Evidence before confidence.** Scores and labels should be explainable.
4. **Public is a projection, not a second database.** Internal and external views share history but not necessarily fields.
5. **Every state has a definition.** “Planned,” “monitoring,” “published,” and “in review” must mean something.
6. **Search is part of product quality.** Failed discovery becomes a signal.
7. **AI drafts; humans publish.** Sources, freshness, and scope are always visible.
8. **Closure is a first-class action.** Every request, incident, doc gap, and proof asset needs a next state.
9. **Progressive disclosure over configuration overload.** Show the minimum needed now and reveal depth when requested.
10. **Enterprise trust is visible in the interface.** Ownership, visibility, history, sync status, and source must be easy to inspect.
11. **Unbloat through relationships.** Keep the primary navigation small; let linked context do the work.
12. **Prototype the language before the database.** If users do not understand the object, a perfect schema will not rescue the workflow.

## 17. Final recommendation

Version C should begin with a polished **Decision Thread** prototype:

```text
Search or capture a signal
        ↓
Triage and merge
        ↓
Frame the problem
        ↓
Review evidence and options
        ↓
Record a decision
        ↓
Show roadmap and delivery context
        ↓
Preview release/docs/public update
        ↓
Close the loop and learn
```

This should be surrounded by a Product Truth page and a relationship-aware global search. Those three surfaces will test the core hypothesis more effectively than building every competitor category independently.

The future is bright if Product Client is disciplined about what it owns: not launch virality, not issue tracking, not documentation hosting, not observability, and not testimonial collection in isolation. It owns the **shared product context** that helps a team understand what users need, decide what matters, deliver it, communicate it clearly, and learn from what happens next.

## Sources

### Launch and discovery

- [Product Hunt launch definitions](https://www.producthunt.com/launch/definitions)
- [Product Hunt launch guide](https://www.producthunt.com/launch)
- [Product Hunt launch-day duties](https://www.producthunt.com/launch/launch-day-duties)
- [Product Hunt launch-day questions](https://www.producthunt.com/launch/launch-day-questions)

### Product management, feedback, and delivery

- [Linear customer requests](https://linear.app/docs/customer-requests)
- [Linear initiative and project updates](https://linear.app/docs/initiative-and-project-updates)
- [Linear releases](https://linear.app/docs/releases)
- [Linear product features](https://linear.app/features)
- [Productboard: What is Productboard?](https://support.productboard.com/hc/en-us/articles/360058147693-What-is-Productboard)
- [Productboard product management tools](https://www.productboard.com/product-management-tools/)
- [Productboard customer insights and feature ideas](https://support.productboard.com/hc/en-us/articles/10071375851155-Support-your-feature-ideas-with-customer-insights)
- [Productboard prioritization](https://www.productboard.com/prioritize-features/)
- [Canny features](https://canny.io/features)
- [Canny 101](https://help.canny.io/en/articles/3816826-canny-101)
- [Aha! product management platform](https://www.aha.io/)
- [Aha! framework for product development](https://www.aha.io/roadmapping/guide/the-aha-framework/the-aha-framework-for-product-development)
- [Aha! feature scorecards](https://support.aha.io/aha-roadmaps/support-articles/features/feature-scores~7444651223459792299?mobile_site=true)
- [Jira Product Discovery features](https://www.atlassian.com/software/jira/product-discovery/features)
- [What is Jira Product Discovery?](https://support.atlassian.com/jira-product-discovery/docs/what-is-jira-product-discovery/)
- [Jira Product Discovery views](https://www.atlassian.com/software/jira/product-discovery/guides/views/overview)
- [Jira Product Discovery ideas](https://www.atlassian.com/software/jira/product-discovery/guides/ideas/overview)
- [Atlassian continuous product discovery](https://www.atlassian.com/agile/product-management/discovery)

### Docs and search

- [Mintlify Assistant](https://mintlify.com/docs/guides/assistant)
- [Mintlify Analytics](https://mintlify.com/docs/guides/analytics)
- [Mintlify feedback](https://www.mintlify.com/docs/optimize/feedback)
- [Mintlify feedback API](https://www.mintlify.com/docs/api/analytics/feedback)

### Customer proof and Wall of Love

- [Senja testimonial collection](https://senja.io/testimonial-software/collect)
- [Senja widgets and Walls of Love help center](https://support.senja.io/widgets-6qt8l)
- [Senja approval and import troubleshooting](https://support.senja.io/troubleshooting-testimonial-import-errors-25us1)

### Incidents, status communication, and post-incident learning

- [incident.io postmortems](https://docs.incident.io/post-incident/postmortems-overview)
- [incident.io postmortem management](https://docs.incident.io/post-incident/postmortem-management)
- [incident.io follow-ups](https://docs.incident.io/post-incident/follow-ups)
- [Atlassian Statuspage](https://www.atlassian.com/software/statuspage)
- [What is Statuspage?](https://support.atlassian.com/statuspage/docs/what-is-statuspage/)
- [Statuspage incident communication tips](https://support.atlassian.com/statuspage/docs/incident-communication-tips/)
- [Create and manage Statuspage incidents](https://support.atlassian.com/statuspage/docs/create-manage-and-communicate-incidents/)
