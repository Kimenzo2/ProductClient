# Product Client — Version C.1 first-screen research

**Status:** Decision draft for the next frontend prototype pass  
**Research date:** 2026-08-30  
**Scope:** The first authenticated screen after onboarding  
**Backend:** Not being implemented in this pass  
**Live browser testing:** Not used

## The decision in one sentence

Version C.1 should open with a quiet, role-aware **work launcher**: one greeting, one dominant search/task input, a few explicit starting actions, and a very small list of work that actually needs the person. It should feel as calm as an AI app without becoming a chatbot or a dashboard full of numbers.

## Why the current workspace overview is not the right first screen

The current `/workspace` prototype is a useful overview page, but it asks a new user to understand too much before doing anything:

- Four metric cards ask the user to interpret counts before they know what the counts mean or whether they matter.
- A featured product decision assumes the user is already thinking like a product manager.
- The work queue, activity feed, products list, and roadmap all compete for first attention.
- “Roadmap health” and similar summary values look authoritative, even when the user cannot see the reasoning behind them.
- The sidebar exposes the full product taxonomy before the user has completed a single task.
- Prototype badges and activity can make an empty workspace look populated. That is visually lively but dishonest about what the new user can actually do.

The issue is not that these sections are bad. They are bad **as the first answer** to a person who has just entered. They belong in deeper views or appear later when there is enough real work to justify them.

The first page has one job:

> Help this person understand where to start and complete one useful product-work action without learning the whole application.

## What the research actually supports

The research separates three things:

1. **Observed capability:** what a product’s own documentation says its home or core workflow supports.
2. **Design inference:** a pattern that appears across several products.
3. **Product hypothesis:** an assumption about Product Client that still needs user testing.

Vendor descriptions are evidence of intentional product direction. They are not proof that every feature is easy to use or that Product Client needs to copy it.

### AI products: the useful pattern is a focused starting action

| Product | Observed pattern | What Product Client can learn | What Product Client should not copy blindly |
| --- | --- | --- | --- |
| ChatGPT | The home experience makes starting a new prompt the obvious action. Projects group chats, files, and instructions around a continuing piece of work. | Put one clear starting action in the center. Keep context and history available without putting every detail in the center. | A conversation is not automatically a product record. A chat that cannot produce a linked problem, decision, or update is not a sufficient workflow. |
| Claude | Projects are self-contained workspaces with chat history, a knowledge base, and project instructions. | A person needs a recognizable place where context persists. | “Project” is overloaded. Product Client should use names that match the actual work: workspace, product, feedback, problem, decision, and update. |
| Perplexity | A home query starts a thread; Spaces organize threads, files, links, and search sources around a topic. | A single input can reduce blank-state anxiety when it has a clear destination and preserves context. | A free-form thread can hide the source of a decision. Product Client must show where information came from and what record was created. |
| Cursor | The agent starts from a plain-language task and can search the codebase, use tools, edit files, and show checkpoints. | Developers value a task-first entry point that can reach the right context quickly. | Do not promise agent behavior before Product Client has a reliable action model, permissions, source links, and review states. |

OpenAI describes ChatGPT’s home as a place to enter a prompt and start a new chat, while its Projects guidance groups chats, files, and instructions around a continuing effort. Anthropic describes Claude Projects similarly as self-contained workspaces with chat history and knowledge. Perplexity describes a Space as a topic-based place for threads and sources. Cursor’s Agent documentation describes a plain-language task connected to codebase search and tools. These are all official product descriptions, so they are strong evidence for the interaction pattern, not independent evidence of user success.

Sources: [ChatGPT home](https://help.openai.com/en/articles/9125172-the-chatgpt-home-page), [ChatGPT Projects](https://help.openai.com/en/articles/10169521), [Claude Projects](https://support.claude.com/en/articles/9517075-what-are-projects), [Perplexity Spaces](https://hub-prod.perplexity.ai/hub/faq/what-are-spaces), and [Cursor Agent overview](https://cursor.com/docs/agent/overview).

### Product-work tools: the useful pattern is relevant work, not a metric wall

| Product | Observed pattern | What Product Client can learn | Risk to avoid |
| --- | --- | --- | --- |
| Linear | “My Issues” is a curated view of assigned, created, subscribed, and recently active issues. Its focus order changes based on what applies. Inbox is for updates that need attention. | The first useful content should be personal and actionable. Empty sections should not be forced into the interface. | Do not import issue, cycle, SLA, or triage language into the non-technical first screen. |
| Jira Product Discovery | Ideas can collect insights, be prioritized, shown in audience-specific views, and connected to delivery. | The same underlying work needs different views for builders, product people, and stakeholders. | A flexible field system and many views can become a configuration project before value appears. |
| Canny | Feedback, prioritization, roadmaps, status updates, and changelog are presented as a feedback loop. | A request earns trust when its state and next communication are visible. | A public “planned” status can sound like a promise. Product Client needs clear commitment language. |
| Mintlify | Search and docs analytics expose popular pages, feedback, top searches, and low-confidence searches. | Finding an answer is a first-class product task. Failed searches are evidence of a gap. | Do not make analytics a first-screen decoration. Use it to improve the experience behind search. |
| incident.io | Incidents contain live context, timelines, postmortems, and follow-up actions; those are related but distinct jobs. | A person needs the next action and relevant context, not every record in the system at once. | Internal incident detail and public communication should not share one undifferentiated screen. |

Linear’s documentation is especially relevant to the first-screen decision: its curated “My Issues” view shows personal work in a focus order, and its Inbox collects updates that need attention. Jira Product Discovery emphasizes capturing ideas and insights, tailoring views for stakeholders, and connecting discovery to delivery. Canny describes the feedback loop as collection, prioritization, roadmap, and communication. Mintlify treats searches and low-confidence results as signals for improving documentation. incident.io separates incident response, postmortems, and follow-up work.

Sources: [Linear My Issues](https://linear.app/docs/my-issues), [Linear Inbox](https://linear.app/docs/inbox), [Jira Product Discovery features](https://www.atlassian.com/software/jira/product-discovery/features), [Canny features](https://canny.io/features), [Mintlify analytics](https://mintlify.com/docs/guides/analytics), and [incident.io postmortems](https://docs.incident.io/post-incident/postmortems-overview).

## The product problem C.1 must solve

### Shared problem

After signing up, a person has an account but no mental model of the workspace. A dense dashboard makes them browse, decode labels, or wait for someone else to tell them what to do. A blank page gives them no confidence that the product is useful. C.1 must create a small bridge between **identity** and **useful work**.

### Developer / builder problem

> When I open Product Client, I need to find the product context behind the work I am building, see what is blocked or changing, and take the next action without translating a product request across several tools.

The developer does not primarily need a list of company metrics. They need:

- the problem or customer need behind the work;
- the product or area affected;
- links to relevant feedback, decisions, docs, releases, and incidents;
- the current state and what is expected next;
- a quick way to flag missing context or update the work.

**First-screen success:** a developer can find the context behind a piece of work, or start a well-defined product problem, within two interactions.

### Product manager / support / team-lead problem

> When I open Product Client, I need to know what needs a reply, decision, or update, then move it forward without learning engineering language or searching several systems.

The non-technical user does not primarily need issue identifiers, repository language, or delivery detail. They need:

- incoming feedback that has not been reviewed;
- decisions waiting for context or a response;
- recent changes they may need to explain;
- a simple way to add feedback, find an answer, or share an update;
- confidence that an external status is current and not an accidental promise.

**First-screen success:** a non-technical user can identify one useful next action and complete it without opening the sidebar to learn what every section means.

### Why “normal user” should not be a product label

“Normal user” is useful shorthand while discussing the prototype, but it should not appear in the product model or UI. Product Client already has meaningful differences between product managers, developers, support people, and team leads. C.1 can use two first-screen modes while retaining the selected role:

- **Build view:** Developer / Builder
- **Coordinate view:** Product manager, Customer support, Team lead

Later, support and team-lead views can diverge when evidence proves they need different work queues. They do not need separate products on day one.

The current onboarding label “Builder” is also ambiguous for a non-technical reader. The next prototype should test changing it to **Developer** with the description “Builds and ships product work,” while keeping “Builder” as an optional internal term only if users actually use it.

## The C.1 first-screen proposal

### The shared shape

```text
quiet workspace shell

                 Good morning, Amina
              What would you like to move forward?

       [ Search your workspace or start a task              ]

       [ Add feedback ] [ Find an update ] [ Find help ]

                         For you
               one to three relevant work items
```

The exact greeting can change with time of day, but it must not carry the product’s value proposition. The greeting is orientation. The input is the first action. The “For you” list is evidence that the workspace remembers work; it is not a second dashboard.

### The input is not a fake AI assistant

The input should be called a **workspace search and task launcher** in the prototype. Its first behaviors should be explicit:

- Search existing feedback, problems, decisions, updates, docs, products, and incidents.
- Open a known creation flow when the user chooses a starter action.
- Preserve the selected product and source record when the user starts from an existing item.
- Say clearly when no result was found and offer the next useful action.

The placeholder may be human and natural—“Search your workspace or start a task”—but the UI must not imply that an AI has understood or completed a request when it has not. Later, an assistant can interpret “show me requests about file uploads” or “draft a customer update for this release,” but it must show sources, proposed changes, and approval before changing or publishing records.

### Build view: Developer / Builder

**Greeting:** “Good morning, [name]”  
**Heading:** “What are you trying to ship?”  
**Input:** “Find the context behind a task or start a new one”

Starter actions should be limited to the work a developer can reasonably begin from this product:

- Find related feedback
- Check a release
- Check service problems
- Read product docs

The first content block is **Your work**, not “Roadmap health.” It shows at most three records, ordered by relevance:

1. Work assigned to the developer or explicitly shared with them.
2. Work blocked by missing decision, feedback, documentation, or incident follow-up.
3. Recently changed work connected to their current product area.

Each row must answer: **what is it, where does it belong, what changed, and what can I do next?** A row such as “File uploads — waiting for decision — Product A — Review context” is useful. A row such as “12 active choices” is not.

### Coordinate view: Product manager / Support / Team lead

**Greeting:** “Good morning, [name]”  
**Heading:** “What needs your attention?”  
**Input:** “Find feedback, an update, a help page, or a product”

Starter actions should be plain and outcome-oriented:

- Add feedback
- Review incoming feedback
- Find an answer
- Share an update

The first content block is **For you**, with no more than three items:

- Needs a reply
- Needs a decision
- Recently changed

The word “For you” is intentionally less technical than “My Issues,” “Triage,” or “Work queue.” The underlying data can still use those concepts later. The first screen should use the language a person would use when asking a teammate for help.

### New workspace state

Do not populate the first screen with invented activity, fake counts, or a large empty dashboard. The new-workspace screen should show:

```text
                 Good morning, [name]
             Let’s get your product work started.

       [ Search your workspace or start a task              ]

             Start with one of these:
       [ Add feedback ] [ Add a product ] [ Find help ]

       Your workspace is ready. Nothing needs your attention yet.
```

The final sentence is honest and useful. It distinguishes “there is no work yet” from “the system failed to load.” The page should not show “Roadmap health: On track” when no roadmap exists.

## What stays out of the C.1 first screen

These may remain elsewhere in the application, but they should not compete with the first action:

- metric cards and health summaries;
- a featured decision chosen by the system;
- a full activity feed;
- a product directory;
- a roadmap preview;
- incident severity dashboards;
- testimonial galleries;
- a long list of suggested prompts;
- AI-generated answers without citations or approval;
- a giant “create anything” menu with no clear destination.

This is not a claim that those features are unimportant. It is a claim about sequencing. The first screen should earn the right to show complexity by helping the person complete a real task.

## Stress test: the screen must survive four real starting conditions

Role-aware copy is not enough. The screen also has to respond to the amount and type of work available.

| Starting condition | What goes wrong with a generic dashboard | Required first-screen behavior |
| --- | --- | --- |
| New product manager with no records | Every metric is zero or every card is a fabricated example. The person cannot tell whether the product is ready. | Show one clear next action: add feedback, add a product, or find help. Explain that the workspace is ready and empty, not broken. |
| Developer with no assigned work | “Your work” is an empty list and the person assumes Product Client has nothing useful for them. | Offer “Find related feedback,” “Check a release,” and “Read product docs.” Explain that work appears when it is assigned or shared. |
| Support user with incoming requests | A roadmap or featured decision distracts from the unanswered customer question. | Put requests that need a reply first. Make “Find an answer” and “Add feedback” immediate actions. |
| Team lead with many products | A long list of products creates scanning work without showing what changed or what is at risk. | Show at most three changes or decisions that need awareness, with a clear link to the full view. |

This stress test changes the design in one important way: **an empty or irrelevant block must disappear rather than remain as a large placeholder.** The screen should be allowed to become smaller when there is less work to show.

## A concrete issue found in the current prototype

The current workspace header search loads private records through `workspace-search.ts`, but the standalone `/search` route renders `publicSearchRecords`. If the new central launcher simply links to `/search?q=...`, a signed-in person could type an internal problem or decision and receive only public results.

That is not a cosmetic issue. It would make the first-screen promise false.

Before C.1 implementation, choose one of these two coherent solutions:

1. Make the workspace launcher a shared search palette that searches workspace records in place, then opens the selected record.
2. Add a workspace search route, such as `/workspace/search`, whose data source is explicitly private and whose public `/search` route remains public.

Do not make `/search` silently switch sources based on a client-side guess. The route surface should make the visibility boundary obvious in code and in the user’s mental model.

## Exact C.1 copy to test

The following copy is intentionally plain. It is a testable starting point, not marketing copy.

| Surface | Build view | Coordinate view |
| --- | --- | --- |
| Greeting | `Good morning, [name]` | `Good morning, [name]` |
| Main heading | `What are you trying to ship?` | `What needs your attention?` |
| Input label | `Search or start a task` | `Search or start a task` |
| Input hint | `Find the context behind a task or start a new one` | `Find feedback, an update, a help page, or a product` |
| First action | `Find related feedback` | `Add feedback` |
| Second action | `Check a release` | `Review incoming feedback` |
| Third action | `Check service problems` | `Find an answer` |
| Fourth action | `Read product docs` | `Share an update` |
| Relevant list | `Your work` | `For you` |
| No relevant work | `Work assigned or shared with you will appear here.` | `Nothing needs your attention yet.` |

“Search or start a task” is deliberately less magical than “Ask Product Client anything.” It tells the truth about the current prototype and leaves room for a future assistant without creating a false expectation today.

## How the first screen sells the product without becoming marketing

The first screen still has to answer, “Why should I use this instead of opening my other tools?” A banner saying that Product Client is a complete product operating system would be a claim. The interface should demonstrate the claim through a useful action.

The proof should be visible in the small amount of work shown:

- A developer sees a work item with the customer need, decision state, and related documentation in the same row.
- A support person sees an incoming request with a direct path to the answer or the update that closed the loop.
- A product manager sees that a request can become a problem, a decision, and a customer-readable update without re-entering the context.
- A team lead sees a meaningful change or risk rather than a total count that needs interpretation.

That is the product’s sales argument: **less translation between what people said, what the team decided, what was built, and what was communicated.** It is concrete enough to verify and does not require a slogan.

The supporting line under each role-aware heading should therefore carry the job, not a promise:

| Mode | Heading | Supporting line |
| --- | --- | --- |
| Build | `What are you trying to ship?` | `Find the customer need, decision, and docs behind your work.` |
| Coordinate | `What needs your attention?` | `See what needs a reply, decision, or update.` |

If there is no real work yet, the screen must not manufacture this proof. It should explain how the chain will become useful after the first feedback or product is added.

## Lock criteria for the prototype

Version C.1 is ready to lock only when the implementation meets all of these conditions:

- One primary action is visually dominant.
- A new user can identify where to start without reading the sidebar.
- The first screen shows no more than three relevant work items.
- Empty, irrelevant, and loading states are different states with different language.
- The selected onboarding role deterministically selects Build or Coordinate view.
- “Builder” is either renamed to “Developer” or explicitly explained in plain language.
- The central input has a real, visible search/action behavior; it is not decorative.
- Private workspace search cannot fall through to public search.
- Every starter action opens an existing, understandable route.
- A work row explains the item, its current state, and the next action.
- Metrics, activity, product directory, roadmap, and incident dashboards remain secondary.
- No AI-generated answer is shown without a source, a proposed action, and human approval.

These criteria protect the product from looking finished while leaving the core workflow unclear.

## Frontend information architecture for C.1

The existing prototype already contains most of the destinations needed for the first vertical slice:

```text
Home / workspace
    ├─ Workspace search
    ├─ Feedback / Inbox
    │    └─ Feedback detail
    ├─ Problem
    │    └─ Decision
    ├─ Release / Product update
    └─ Help docs / Service problem
```

The first screen should link into this structure rather than create a parallel “AI home” information architecture. The route and record relationship should remain understandable if the user never touches the central input.

### Proposed first-screen components

| Component | Job | Rule for inclusion |
| --- | --- | --- |
| Greeting | Orient the person and make the screen feel personal | One line; no marketing claim |
| Role-aware heading | Tell the person what kind of work they can start | Must describe a real task, not a vague promise |
| Workspace launcher | Search or start a known workflow | One dominant control; no fake AI behavior |
| Starter actions | Remove blank-state hesitation | Three or four actions maximum; every action has a real route |
| For-you list | Surface relevant work without creating a dashboard | Three items maximum; hide the block if there is nothing relevant, or show a clear first-use state |
| Context row | Explain why an item is shown | Object type, product, current state, last change, next action |
| Sidebar | Provide navigation for people who already know where to go | Quiet visual weight; it must not compete with the center |

## Data and backend constraints to record now

Although backend work is intentionally later, the frontend should not design against an impossible contract. C.1 needs these future concepts:

- `profile.role` for the user’s selected working role;
- `workspace_id` for the active workspace;
- a clear membership relationship rather than trusting user metadata for permissions;
- a searchable record identity containing type, title, product, state, and updated time;
- assignments, watchers, or explicit relevance signals for “For you”;
- relations between feedback, problems, decisions, releases, docs, and incidents;
- an honest first-use state when a workspace has no records;
- source and approval fields before anything is published publicly.

The existing onboarding draft writes profile details to Supabase user metadata in the prototype. That is acceptable as a temporary profile handoff, but it must not become the authorization model. Workspace membership and permissions belong in protected server-side data when backend integration begins.

## Validation plan before locking the screen

This proposal should be tested before implementing a large dashboard replacement.

### Five-second test

Show the screen without explanation. Ask:

- Where are you?
- What would you click first?
- What do you think the large input does?

Pass condition: the person identifies the workspace and the primary task without reading the sidebar.

### Thirty-second task test

For a developer:

1. Find the customer context behind “file uploads.”
2. Find what is blocking the related release.

For a non-technical user:

1. Add a request about confusing exports.
2. Find whether an update has already been shared.

Pass condition: the task begins from the first screen and the person can follow the link chain without copying context.

### Language test

Replace technical labels with plain alternatives and ask users to explain them:

| Prototype term | Testable plain alternative |
| --- | --- |
| Triage | Needs review |
| Issue | Product work or task, depending on context |
| Insight | Customer evidence |
| Roadmap health | What is on track / what is blocked, only when evidence exists |
| Normal user | Do not show this term; use the person’s role or audience |
| Builder | Developer, if that is what the role means |

The goal is not to remove every precise word. It is to avoid making the user learn the internal database model before they can act.

## Recommendation

Lock Version C.1 around a **role-aware first workspace screen**, not the current metrics dashboard and not a chatbot clone.

Build the frontend in this order:

1. Replace the current `/workspace` hero with the shared greeting, role-aware heading, and workspace launcher.
2. Add the Build view and Coordinate view as two compositions of the same components.
3. Populate the new state honestly with starter actions and no fake activity.
4. Add a small “For you” list using the existing frontend fixture records.
5. Make each row lead into the linked workflow: feedback → problem → decision → update/docs.
6. Move metrics, activity, products, and roadmap previews back into their dedicated routes.
7. Test the wording and first action with technical and non-technical readers before extracting the backend contract.

The product’s promise is not that it contains every product-management feature. The promise is that a person can move from **what someone said** to **what the team will do** and finally to **what people can understand**. The first screen should make the next step in that chain obvious for the person standing in front of it.
