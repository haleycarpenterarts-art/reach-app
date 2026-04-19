---
name: ingest
description: Use whenever implementing AI-assisted data extraction from emails, PDFs, Word docs, images, spreadsheets, meeting notes, or transcripts. Also use when building task, decision, or change suggestion flows from unstructured input, meeting-driven accountability loops, the "this suggestion is wrong" feedback path, or ingest-first project setup.
---

# Low-input, high-inference data capture (Ingest)

**Capture once, infer the rest.** Users capture information once — notes, emails, meeting transcripts, uploads, quick text. The system infers structured records (tasks, decisions, changes, follow-ups) with minimal additional input. See `SPEC.md` §13 for the full spec.

## Why this matters for adoption

If users are required to manually complete detailed forms for every action, tasks and structured records will not be used consistently in day-to-day operations. The whole system depends on low-friction capture.

## Core rule

**AI-extracted values remain suggestions until a user accepts them.** Suggestions are editable, not locked. Accepted records go into the real system. Un-accepted suggestions do not enter reports, rollups, approvals, or customer-facing outputs.

## Entry points for extraction

- Meeting records (agenda, notes, transcripts).
- Project notes inside Project Cards.
- Pasted email threads (customer / GC communications).
- Uploaded documents (RFPs, RFIs, punch lists, marked-up PDFs, Word, spreadsheets, images).
- Field reports and daily logs.
- Quick-add text entries (one-line notes).

## What to extract

For each candidate item, the extractor produces one or more of:

- Action items (tasks)
- Decisions
- Change candidates
- Follow-up events

## Inferred task metadata

For each candidate task, infer as much as possible rather than requiring manual entry:

- Task statement (from the sentence or bullet).
- Suggested owner (from role context, speaker, addressee).
- Suggested due date (from phrases: "by Friday", "before rough-in", "next week").
- Task type (design, estimate, coordinate, order, install, review — from verbs and content).
- Billable vs. non-billable likelihood (from language and scope context).
- Related project (current Project Card by default).
- Related room or area (from room names or numbers in the text).
- Related BOM or Library item (from product names or model numbers).
- Priority (from modifiers: "urgent", "blocker", "ASAP").

Surface inferences with simple rationale where feasible: *"Assigned to PM because this is a schedule coordination item."*

## Defaults

When a field can't be inferred, use project / role context:

- Owner: current user, or PM for PM-type tasks, or design engineer for engineering tasks.
- Project: current Project Card.
- Room: last referenced room in the session if none is explicitly mentioned.
- Billable: non-billable unless language clearly indicates out-of-agreed-scope design/engineering/rework.
- Due date: offset from current date or next relevant milestone.
- Task type: from verbs and project phase.

All defaults are visible and easily overridable in the review panel.

## Review panel pattern

- One-click acceptance per suggested item.
- Quick inline edit for any inferred field.
- "Reject this suggestion" with optional reason (feeds extraction quality improvement).
- Batch accept / reject for high-confidence runs.

## Meeting-driven accountability loop

When a new meeting is created for a project:

- Surface open tasks from previous related meetings.
- Highlight overdue items associated with the same project or stakeholder group.
- Extract new actions, decisions, change candidates from the latest notes or transcript.
- Link each extracted item back to its originating meeting for traceability.

This closes the loop between discussion and delivery. Commitments made in meetings become trackable work items.

## Ingest-first project setup

Project setup supports uploading source documentation (emails, PDFs, Word, images, spreadsheets) at the start of the workflow. Ingest:

- Classifies the document type.
- Extracts relevant data.
- Attaches source artifacts to the Project Card.
- Proposes structured outputs for review: contacts, addresses, room references, BOM clues, milestone dates, tasks, decisions, risk items.

This reduces manual project setup effort and makes source documentation useful operational data from day one.

## Guardrails

- AI-generated metadata is editable suggestion, not locked field.
- Users can mark specific notes or meetings as `no extraction` when they are purely informational.
- "This suggestion is wrong" action is available on every suggested item.
- Provide simple rationale for suggestions where feasible.
- Extraction never writes directly into trusted-core paths (money, approvals, issued artifacts, customer-facing outputs). See `trusted-core` skill.
- Extraction emits an audit event only on *acceptance*, not on generation. Generation is cheap; acceptance is the event that matters.

## Source traceability

Every record created from an ingest suggestion carries a link to:

- The source artifact (meeting record, uploaded document, email, note).
- The extraction run (timestamp, model, confidence if available).
- The accepting user.

Traceability matters for later audit and for improving the extraction pipeline.

## What not to build

- An ingest pipeline that silently creates real records without user acceptance.
- A "trust this extractor" mode that skips review for repeat patterns. Every accepted record is explicitly accepted.
- An ingest queue with no visibility into what's pending review — users need a "review queue" surface.
- Extraction that overwrites existing records. Ingest proposes new records or suggests edits to existing ones; the user merges.
- A meeting-to-task flow that loses the meeting linkage.
