---
name: estimation
description: Use whenever building, modifying, or designing the Estimation sub-application — BOM tables, room builder, revision logic, pricing snapshots, proposal generation, scope writing, engineering notes and submittals, version compare, or Library-to-BOM workflows. Also use for any feature that produces a customer-facing proposal document or a downstream purchasing BOM release.
---

# Estimation sub-application

A major sub-application within each Project Card. Table-oriented, Library-driven, revision-controlled. Writes directly into the Project Card. Consumes the Library. Passes outputs downstream into engineering, purchasing, handoff, and billing. See `SPEC.md` §12.1 for the full spec.

## Core rules

- Estimation is not an isolated tool. It writes into the Project Card and reads from the Library.
- Equipment selection pulls from the Library. Free-typing is an escape hatch, not a default.
- Issued estimates, proposals, and BOM revisions are snapshots. See `trusted-core` skill.
- Money math goes through `lib/money/`. No in-component calculations.

## Internal modules

- Estimate Setup
- Room Builder
- BOM Table
- Pricing and Margin
- Scope Writer
- Proposal Generator
- Engineering Notes and Submittals
- Version Compare
- Product Lookup and Library Sync
- AI Copilot Panel

## Hierarchy

| Level | Purpose |
|-------|---------|
| Project | Top-level estimate container inside the Project Card |
| Area / Floor / Zone | Optional grouping layer |
| Room | Primary estimating unit |
| System / Package | Standardized design package tied to Library logic |
| BOM line items | Equipment, accessories, infrastructure, labor |
| Output artifacts | Proposal, room summary, engineering notes |

## BOM table columns

Line number · Parent level or room · Item type · Library item ID · Manufacturer · Model · Description · Qty · UoM · Unit cost · Unit sell · Extended cost · Extended sell · Margin · Vendor · Lead time · Included/optional/alternate status · Engineering note · Procurement note · Install note · Revision status.

Margin is computed, not stored as an editable field. It comes from `lib/money/`.

## Core workflow

1. Create or open a Project Card-linked estimate.
2. Build project hierarchy: areas, floors, rooms.
3. Apply room standards and package logic from the Library.
4. Generate BOM line items from selected standards and templates.
5. Apply labor, complexity, infrastructure, and site-condition logic.
6. Use AI assistance to detect missing scope, draft language, suggest structures (see "AI behaviors" below).
7. Generate proposal output and engineering / submittal notes.
8. Preserve issued revision snapshots; compare later revisions against them via Version Compare.

## Revision model

- Estimate revision number, proposal revision number, BOM revision number are tracked separately.
- An estimate may go through many draft iterations before a proposal is issued.
- Issuing a proposal or BOM revision creates a snapshot (see `trusted-core`).
- Pricing snapshot at issue date is stored with the revision — it is the source of truth for that issued artifact forever.
- Change summary between revisions is computed and stored at issue time.
- Current working vs. issued state is always distinguishable in the UI.
- When Library pricing changes after a proposal is issued, the next draft revision flags affected lines. It does not retroactively edit the issued revision.

## Proposal output rules

Generated proposals draw only from data the customer should see.

- Include: scope language, room structure, included/optional/alternate line descriptions, customer-facing product descriptions from the Library, extended sell prices where the proposal model exposes pricing.
- Exclude: cost, margin, vendor pricing, internal notes, labor-rate specifics beyond total labor hours/sell, engineering-internal annotations.
- Proposal generation runs through the same field-level governance rules as the Customer section (see `governance` skill and `customer-comms` skill).

## Engineering notes and submittals

Engineering / submittal output uses the engineering-facing description from each Library Item, plus project-specific overrides when logged. Intended audience: GCs, consultants, customers' technical teams.

## AI-assisted behaviors

AI accelerates estimate creation but stays subordinate to structured data. It does not invent scope, pricing, or product selections autonomously.

Allowed:
- Convert rough scope notes into project and room structure (user accepts the structure before it's applied).
- Suggest room templates from known project types.
- Recommend Library items based on standards and room logic.
- Detect missing infrastructure or likely scope gaps.
- Draft proposal scope language (user edits and accepts).
- Draft engineering and submittal notes.
- Flag estimate inconsistencies and incomplete selections.
- Summarize estimate revisions.

Not allowed:
- Writing directly to issued snapshots.
- Changing prices without a user-accepted source (e.g., a Library update that was reviewed).
- Generating Library items that don't exist — AI can suggest "you probably need a display here"; it cannot invent a model number.

## Product lookup and Library sync

- External product lookups produce proposals for Library updates, not direct writes.
- Each lookup result carries a reference link and `last-verified` timestamp.
- See `library` skill for the acceptance flow.

## Interconnections

Estimation connects to:

- Lead and sales records (scope origin, customer context).
- Project Card (structure, history, current phase).
- Library (products, standards, pricing).
- Engineering records (technical notes, submittals).
- Purchasing (approved BOM release → PO).
- Documents and drawings (revision linkage).
- Invoices and change workflows (downstream financial control).
- Embedded digital assistant (search, validation, drafting).

## What not to build

- An estimate that lives outside a Project Card.
- BOM rows that carry their own pricing independent of Library references (except on issued snapshots, which capture Library pricing at issue time).
- Silent proposal regeneration from updated data — issued proposals are snapshots.
- A Version Compare that reads from current drafts — it reads from stored snapshots.
- Margin as a directly editable field. Margin is derived.
