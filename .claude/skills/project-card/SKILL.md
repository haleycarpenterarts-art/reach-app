---
name: project-card
description: Use whenever building, modifying, or designing Project Card UI, sections, role-specific views, the Project Card data model, or its relationships to other records. Also use when implementing any feature that attaches notes, files, decisions, tasks, changes, POs, invoices, drawings, or equipment selections to a Project Card.
---

# Project Card

The Project Card is the operational center of the system. Not a summary page — the living environment where projects are created, updated, executed, changed, and closed out. See `SPEC.md` §5 for the full functional spec.

## Core rule

Every billable action and every execution record attaches to a Project Card. If a feature produces a note, decision, change, task, document, drawing, PO, invoice, or equipment selection that isn't attached to a Project Card, something is wrong.

## Required sections (all cards, all roles)

Data model must support all of these, even if a given role doesn't render them:

- Project summary, scope, current phase
- Linked companies and contacts with role labels
- Linked site/location records
- Lead and proposal origin
- System direction and room standards in use
- BOM and equipment selections (pulled from Library, not duplicated)
- Notes and activity timeline
- Decisions and approvals
- Changes and change-order status
- Drawings and project documents
- Purchasing status and linked POs
- Invoice and billing status
- Milestones, schedule, responsibility ownership
- Margin, cost, financial summary
- Training, closeout, support records
- Assistant / copilot panel
- Customer section (see `customer-comms` skill)

## Relationships

These relationships are many-to-many and resolved through join tables or explicit association records:

- Project ↔ Company (each Company can appear on many Projects with different roles — customer, GC, broker, architect, consultant, referral).
- Project ↔ Contact (each Contact can have different project roles on different jobs).
- Project ↔ Site/Location (a project may span multiple sites).
- Project → Library Item references (via BOM / equipment selection; Library Items remain master records).
- Project ↔ Vendor (through equipment selection, purchasing, or support).

Do not model these as hard foreign keys from Company → Project or Contact → Project. The relationships carry role context, so they need their own association records.

## Role-tailored views (render differently, not hide fields)

Different roles get different *layouts* of the same card. Do not render a full card and grey out sections — render a different layout. See `governance` skill for the full role catalog.

Reference layouts from `SPEC.md` §8:

- **Executive:** portfolio metrics, risk, margin, approvals, project health.
- **PM:** schedule, tasks, labor, changes, purchasing, field status, required approvals.
- **Design / Estimation:** room structure, BOM, Library links, scope, revisions, drawing outputs.
- **Finance:** invoices, deposits, billing milestones, collections, cost controls.
- **Technician:** today's tasks, site access, contacts, room notes, simplified drawings, pull lists, time entry, issue logging, photos.

## Technician view (mobile-first)

- Fast loading on mobile networks.
- Large touch targets.
- Limited navigation — task-centric, not record-browse.
- Answers *"what do I need to do now?"* as the primary screen.

**Always shown:** today's assigned tasks, site access info, onsite contacts, room install notes, simplified drawings, materials for assigned work, punch/issue lists, time entry, progress updates, photo/markup upload.

**Never shown on the default Technician view:** proposal history, cost, margin, vendor pricing, invoice status (except field-relevant hold notices), internal management and finance notes.

## Note promotion

Notes are informational by default. A note can be *promoted* into a structured record:

- Note → Task (inherits project, owner, due date guesses)
- Note → Decision Record (adds approver, impact flags)
- Note → Change Record (adds cost/schedule impact analysis and routing)
- Note → Issue
- Note → Follow-up

Promotion preserves the link back to the originating note for traceability. Once promoted, the note is not duplicated — it is marked as the source of the promoted record.

## Governing rules

- Every project-affecting note must be *capable* of becoming a structured record, but is not required to.
- Every major decision is timestamped and linked to the approving person or party.
- Every official project artifact carries version and status history.
- All reporting rolls up from linked records rather than manual summaries.
- Status on the Project Card uses the universal status model: `Draft / Ready / Approved / In progress / On hold / Complete`.

## What not to build

- A "Project" table that owns its own Companies or Contacts inline.
- Duplicated BOM rows on the card itself — BOM lives in the Estimation sub-app; the card *references* the current BOM revision.
- Role-specific cards that are actually different records. It's one record, many layouts.
