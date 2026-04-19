---
name: customer-comms
description: Use whenever building the Customer section of a Project Card, customer touchpoint schedules, customer-facing update generation, PDF/DOC export of customer updates, or any feature that produces a document or message intended for the customer. Also use when implementing governance rules for who can issue customer communications and what fields those communications can include.
---

# Customer communication and the Customer section

The Customer section of the Project Card is the controlled home for customer-facing progress communication throughout the project lifecycle. See `SPEC.md` §11 for the full spec.

## Core rules

- Customer-facing outputs draw only from approved/visible fields. Never include margin, internal notes, vendor pricing, or unresolved internal commentary.
- Not every user can issue customer-facing updates. Issuance is a permissioned action (see `governance` skill).
- Every issued customer update is audit-logged: who issued, when, to whom, which template, which source data.

## Customer section contents

Each Project Card's Customer section includes:

- Primary customer contacts and communication preferences.
- Customer touchpoint schedule.
- History of customer updates sent (with links to the issued artifacts).
- Selected update type templates.
- Open customer-facing risks or notices.
- Upcoming milestones relevant to the customer.
- Training and handoff communication records.

## Touchpoints

Standardized, phase-triggered, not ad hoc. The system suggests touchpoints at specific lifecycle events:

- Award / onboarding update.
- Deposit and project-start confirmation.
- Pre-install planning update.
- Active installation progress update.
- Commissioning / training coordination update.
- Closeout and handoff update.
- 30-day follow-up or support check-in.

A touchpoint is a prompt to issue an update; it does not send anything automatically unless explicitly configured.

## Generated customer updates

Produced as PDF or DOC using current Project Card data plus curated input from Account Manager, PM, and Field Team.

### Update types

- Executive summary
- Weekly project update
- Milestone update
- Installation progress update
- Issue / delay notice
- Training and handoff summary
- Closeout summary

### Content

- Project name and summary.
- Current stage or milestone.
- What has been completed.
- What is happening next.
- Notable schedule items.
- Open customer-relevant risks, blockers, or decisions needed.
- Curated notes from AM, PM, and Field Team (selected per update for customer visibility).

### Never included

- Margin.
- Cost or vendor pricing.
- Internal notes.
- Unresolved internal commentary.
- Approval rationale.
- Labor-rate specifics.

The generator runs through the same field-level governance checks as any other customer-facing output (see `governance` skill).

## Note-curation pattern

Internal notes are not automatically included in customer updates. A user with issuance rights explicitly selects which notes are eligible for customer visibility. Each note carries a `customer-visible` flag set at curation time, not at note creation.

## Issuance flow

1. User opens Customer section, chooses update type.
2. System populates the draft from current Project Card data, filtered by customer-visible rules.
3. User selects which curated notes and open items to include.
4. Draft preview renders as it will be delivered.
5. Governance check: is this user permitted to issue this update type? (Finance may need to approve anything touching billing milestones — see `DECISIONS.md`.)
6. User issues. System generates the final artifact, stores it, logs the audit event, records it in the update history.

## Issued artifacts

- Are snapshots. Once issued, they do not change.
- Store the rendered PDF/DOC *and* the source data that produced it (for later debugging and regeneration if needed).
- Carry a unique reference number the customer can cite.

## Templates

- Update templates are versioned. An issued artifact records which template version was used.
- Template edits produce a new version; they do not mutate existing versions.
- Templates are governed content — not every user can edit them.

## What not to build

- A customer-update generator that pulls every note it can find. Notes must be explicitly marked customer-visible.
- Silent inclusion of any sensitive field (cost, margin, vendor pricing) anywhere in customer-facing output, even in attachments.
- An auto-send flow with no human review. Touchpoints prompt; they don't send.
- Customer updates that exist outside a Project Card.
- A "just regenerate the last update" button that mutates an issued artifact. Regeneration always produces a new versioned artifact.
