# Post-incident flow research

Audience: ProductClient internal dashboard design and implementation
Date: 2026-09-04
Scope: Define the boundary between Post-incident Flow, Follow-ups, Post-mortems, and the separately hosted Status Page.

## Direct answer

Post-incident Flow is an incident-specific completion phase between service recovery and closure. It coordinates a small, ordered set of review tasks. It is not a second cross-incident task queue, a post-mortem editor, or a Status Page editing surface.

## Evidence and decisions

- [Incident.io: Post-incident Flow](https://docs.incident.io/post-incident/post-incident-flow) defines post-incident work as tasks completed after resolution and before closure. Its examples include reviewing the incident timeline, scheduling a debrief, reviewing follow-ups, and assigning incident roles. Tasks may be completed, skipped, or assigned, and completion advances the incident through its post-incident phase.
- [Incident.io: Follow-ups](https://docs.incident.io/post-incident/follow-ups) defines follow-ups as work that remains after an incident and provides a separate cross-incident tracking page for status, reminders, bulk editing, ownership, labels, and issue-tracker links.
- [Incident.io: Incident Lifecycle](https://docs.incident.io/incidents/lifecycle) separates active response from the post-incident phase. The flow is entered after immediate impact is over and can be applied selectively by incident type.
- [Incident.io: Post-mortem templates](https://docs.incident.io/post-incident/postmortem-templates) treats the post-mortem as a document with summary, timeline, follow-ups, key information, and custom learning sections. It is a later writing and learning surface, not the flow coordinator.
- [Better Stack: Working with incidents](https://betterstack.com/docs/uptime/working-with-incidents/) keeps the incident record central from detection through resolution and post-mortem, with collaboration and post-mortem work attached to the incident.
- [Better Stack: Status page updates](https://betterstack.com/docs/uptime/creating-status-report-and-status-update/) treats public communication as a separate status-report/update workflow. ProductClient should link to the hosted Status Page rather than embed its editor here.
- [Google SRE: Postmortem culture](https://sre.google/workbook/postmortem-culture/) emphasizes concrete, measurable, owned action items and blameless language. The flow should expose ownership and completion without assigning blame; durable action-item tracking belongs with Follow-ups or the future Post-mortem surface.

## ProductClient implementation boundary

The Post-incident Flow route therefore uses one selected incident, two phases (`Documenting` and `Reviewing`), and a compact task checklist. It allows task completion, skip/reopen, owner and due-date edits, and links to the incident, Follow-ups, and hosted Status Page. It does not create or edit follow-ups, write post-mortems, or edit public customer content.
