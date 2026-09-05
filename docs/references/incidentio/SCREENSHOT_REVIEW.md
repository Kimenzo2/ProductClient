# Incident.io screenshot review

Reviewed the complete local reference sequence `Screenshot (1136).png` through
`Screenshot (1218).png` on 2026-09-04. All 83 files are present and were
visually inspected in sequence, with the dense modal and status-page screens
also inspected at full size.

This is a reference review only. It does not represent a decision to copy the
Incident.io UI or product naming into ProductClient.

## What the sequence contains

### 1. Workspace and response entry points

- Workspace home with recently visited status pages, an active-incident filter,
  empty-state guidance, and a prominent `Declare incident` action.
- My tasks with completed-task toggle and filters.
- On-call area: alerts, alert routing, escalations, escalation paths, schedules,
  maintenance, and pay calculator.
- Response area: incidents, post-incident flow, follow-ups, and post-mortems.
- Status pages, Nexus/catalog, and Insights.

### 2. Incident declaration and response lifecycle

The declaration flow is a large, scrollable form with three modes:

- **Active incident:** incident name, severity, summary rich text, incident
  lead, optional Slack channel, and declaration.
- **Retrospective incident:** historical/closed incident warning, incident name,
  summary, severity, lead/channel, an opt-in to announce it, an option to enter
  a post-incident flow, and a follow-up timestamp step.
- **Test incident:** explicitly isolated from incident lists, insights,
  announcement rules, and workflows, while warning that live escalation can
  still page people.

The incident publishing flow is a separate two-step modal: incident info first,
then review and publish. It captures name, lifecycle status (Investigating,
Identified, Monitoring, Resolved), a public message, and impact per affected
component.

### 3. Empty-state behavior

Empty states are page-level onboarding surfaces, not just blank lists. They use
an illustration or muted product diagram, a short explanation, and a next-step
action. The actions vary by capability: create, import, configure, start a
tutorial, connect an integration, or learn more.

Examples include no incidents, no tasks, no escalations, no escalation paths,
no schedules, no maintenance windows, no pay configurations, no follow-ups, no
post-mortems, no policies, no secrets, no decision flows, and no unusual status
page traffic.

### 4. Public status-page model

The status-page area separates three audiences:

- public status pages;
- customer status pages for a dedicated customer view;
- internal status pages for authenticated organization members.

A status page has an overview and settings surface. Its overview separates
`Happening now`, `Past events`, and `Maintenance`, shows incidents in the main
content area, and keeps a component list visible alongside it.

### 5. Status-page configuration model

The captured configuration exposes the editable tenant surface we need to
model rather than hard-code:

- **Basic settings:** page title, public URL slug, language, and search-engine
  indexing.
- **Branding and theming:** dark/light presentation, organization logo, and
  favicon.
- **Components:** components and groups, ordering, visibility/actions, and
  historical-data presentation: coloured bars plus uptime percentage, coloured
  bars only, or nothing.
- **Custom domain:** domain entry, DNS/TXT verification, TLS certificate, and
  go-live progression.
- **Customization:** calendar/list date view, history window, page header and
  footer rich text, support URL and label, privacy/terms links, additional
  footer links, and analytics tag.
- **Page views:** unusual-traffic alerts.
- **Subscriptions:** enable/disable subscriptions, reply-to address,
  subscriber search/filtering, and auto-subscribe rules.
- **Templates:** message-template versus predefined-update mode, incident
  templates by lifecycle status, and maintenance templates by maintenance
  status.
- **Widget API:** enable/disable an unauthenticated summary endpoint returning
  current status and ongoing incidents as JSON.

The component editor preview is especially relevant to ProductClient: it shows
component identity, uptime bars, uptime percentage, grouped components, and a
choice about whether historical data is visible.

### 6. Configuration and automation surfaces

The settings sequence covers alert attributes and priorities, incident
templates, alert Slack messages, call routes, heartbeats, notifications,
announcements, calls, custom fields, decision flows, incident lifecycles,
roles, severities, AI-powered suggestions, incident types, and debriefs.

It also covers follow-up templates, post-incident flow steps, post-mortem
templates, API keys, incident tickets, secrets, webhooks, AI governance,
organization identity, permissions, security, teams, and users.

## Interaction patterns worth carrying forward

1. Keep public status communication separate from internal operational tooling.
2. Make an empty state explain what the feature is for and give one clear next
   action.
3. Use progressive disclosure: overview first, configuration second, and deep
   workflows in focused modals or dedicated routes.
4. Treat incident status, affected services/components, updates, timestamps,
   and subscribers as one connected data model.
5. Preserve rich text where the content becomes customer-facing, especially
   incident updates, page header/footer, and lifecycle templates.
6. Keep test, retrospective, and live incidents visibly distinct so the user
   understands publication and automation consequences.
7. Status-page components need editable identity, ordering, grouping, historical
   visibility, and uptime presentation—not just a label above a graph.

## Scope note

Most screenshots are from the Incident.io internal application. One captured
screen (`Screenshot (1139).png`) is a ProductClient workspace/roadmap view,
which I treated as a ProductClient visual/context reference rather than part of
Incident.io's response model.

