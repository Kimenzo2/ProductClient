# Version C implementation decisions

This note keeps the research from turning into a feature checklist. A research finding is useful only when it solves a real user problem in the prototype.

## What stays

| Idea | Why it earns a place | How it appears | What would prove it works |
| --- | --- | --- | --- |
| Problem record | Feedback such as "add X" does not explain who is affected, what people do today, or what happens if nothing changes. | A problem is created from feedback and opened from the feedback detail. It is not required for every message. | A user can explain the need without repeating the original request, then compare more than one possible fix. |
| Decision options | A status alone cannot explain a choice. A small list of options makes trade-offs visible. | Two or three options live inside a decision detail page. No large scoring form. | A teammate can say why one option was chosen and what was given up. |
| Related records | The product promise is less copying between feedback, decisions, updates, help, and incidents. | Relation links show the record type, state, and reason for the link. | A user can open a related record, understand it, and return without losing context. |
| Unanswered searches | A failed search is evidence that people need an answer. | Search gaps appear in Help docs and Analytics, not as a new top-level product. | A missing answer can become a help-page task without leaving the product loop. |
| Incident follow-ups | "Fixed" is not the end if nobody records what to change or explain. | Follow-ups stay on the service-problem page with an owner, due date, and state. | A resolved problem still has a visible path to a customer update, help-page fix, or product work. |
| Proof permissions | A quote is not safe to publish just because it is positive. | Internal customer-story cards show consent and allowed uses. | A teammate can tell where a quote may be used before previewing it publicly. |

## What is deliberately not being added

- A giant scorecard or a precise-looking priority number. It would create false certainty before users agree on the questions that matter.
- A separate social feed. Launch discussion belongs on a product or update page; another feed would compete with the work queue.
- A complete issue tracker. Delivery details can link in later; Product Client should first prove that context survives the handoff.
- AI answers that hide their source or publish themselves. Drafting may help later, but a human must see the source and approve the wording.
- Thirty required fields. Capture should stay quick, with detail added when it becomes useful.
- A new screen for every object. Problems, search gaps, and follow-ups should be reached from the record where they make sense.

## The test for every future feature

Before adding a screen, field, badge, or button, answer these questions:

1. What would a customer, product manager, developer, support person, or marketer do better with it?
2. What is the smallest version that tests that improvement?
3. Can the current page or a related record do the job already?
4. What language would a non-technical person use to describe it?
5. What evidence would make us remove it?

If the answer is only "a competitor has it" or "an enterprise product usually needs it," it stays out of Version C until a user task supports it.

## Current implementation boundary

Version C should prove one short path first:

```text
Customer message
    -> clear problem
    -> product choice
    -> related update or help page
    -> customer-readable explanation
```

The interface can show deeper context for people who need it. It should not make everyone learn the deeper model before they can submit feedback or understand an update.

## Corrections made after reviewing the prototype

- Problems remain a useful internal record, but they are not in the primary navigation. Most people should start with Feedback; they only open a problem note when the need needs to be clarified.
- The problem form asks for only a short name, the need, who is affected, and the current workaround. It does not ask for a score, label tree, or delivery fields.
- A decision no longer shows a generic saved question on every page. A repeated prompt is not useful evidence and did not lead to a real next step.
- An incident update now lives on the incident page. The old link to Studio suggested that a separate writing screen could update the incident, but it could not.
- Help docs show the unanswered search examples that justify new content. The count is calculated from the examples instead of being a hard-coded success-looking number.
- Customer stories show permission and allowed uses. A quote that still needs permission cannot be approved in the prototype.

These changes are intentional reductions. A button, card, or navigation item stays only when its action is clear, its destination works, and a user can explain why it exists in one sentence.

## Empty-state layout rules

Empty states now use one shared `StatePanel` with two sizes:

- `section` is used inside a list, grid, tab, or feed. It fills the available content width, so a grid does not leave the message stranded in one column.
- `page` is used when the requested record does not exist or an action has finished. It has a narrower reading width and a stable vertical center inside the page content.

The message also changes by situation:

- A filter result says what to try next, such as “Try a different search or category.”
- A first-use state explains what will appear and gives one starting action.
- A completed action shows what was just done and does not pretend that prototype data has been saved.
- A missing record explains what is missing and takes the person back to a useful place.

This avoids centering a paragraph inside an arbitrary card and avoids using success, no results, and missing records as if they were the same state.
