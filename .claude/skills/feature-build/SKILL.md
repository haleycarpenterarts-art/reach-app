---
name: feature-build
description: Runs a change through the pipeline — adjudicate against the principles, schema, implement, verify — with a stop at each stage. Use for any work that touches structure, data, or behaviour.
model: sonnet
---

# Feature build

The pipeline exists so no change reaches the repository without being placed
against `docs/principles.md` first. Building and then adjudicating is how core
violations get merged, and the cost is not the code — it is that everything
built on top inherits the breach.

## The pipeline

**1. State the goal in one sentence.**
What the system must do, not what was asked for. If that sentence cannot be
written clearly, this is a scoping problem and the pipeline does not start.

**2. `principle-check`.**
Returns a layer and a verdict:

| Verdict | Action |
|---|---|
| `TENANT` | Build as configuration — the `business_thresholds` pattern, admin-editable. Skip to step 4. |
| `TRADE` | Build in the AV layer. Continue. |
| `CORE VIOLATION` | Stop. Report the principle and the underlying need. Do not proceed to an alternative without Haley. |
| `AMENDMENT CASE` | Stop. Amendments are written by Haley, dated in `DECISIONS.md`, before the build. |

**3. Load the domain skill for the area.**
`trusted-core`, `project-card`, `library`, `governance`, `gates`, `estimation`,
`schematic`, `ingest`, `customer-comms`, `production-ops`. The domain skill
carries subject matter; this skill carries process. Both apply.

**4. Schema, if the data model changes.**
Every table carries tenant scope and ships with its RLS policy — see
`DECISIONS.md`, 2026-08-22. A migration without a policy does not pass this
stage. Only `db/` imports `@prisma/client`.

**5. Implement.**
Only what the verdict scoped. Layer separation holds: `app/` and `components/`
never touch the ORM, `services/` never imports Next.js. Stop on any judgement
call rather than guessing.

**6. `verifier`.**
Blind — given the criterion, not the implementation. Verified against the
running system, not against the code intended to produce the behaviour. Reading
an RLS policy is not verifying tenant isolation; querying as the other tenant is.

**7. Typecheck, lint, test.**
Before claiming completion. CI runs all three; failing locally and hoping is not
a workflow.

**8. Report.**
What changed, what it now enforces, what was assumed, what was left out. Brief.

## Rules

- **Never skip step 2**, including for changes that look obviously fine. That is
  the category that produces the expensive ones.
- **Never let one agent hold two roles.** A verifier that implemented has a stake
  in passing. An implementer that adjudicated has already decided.
- **A stop is a result.** Halting at step 2 with a named principle is a complete
  output, not a failure to deliver.
- **Confidence zones still apply.** Trusted core changes need full testing and
  review regardless of what the pipeline returned.
- **Nothing merges without Haley's review.**
