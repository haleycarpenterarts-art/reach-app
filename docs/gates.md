# Gates — Stage transition requirements

Draft 2026-04-18. Feeds the gate-enforcement engine referenced in SPEC §9 and the `gates` skill per CLAUDE.md.

## Status — this file is a seed, not the runtime source of truth

Runtime gate configuration lives in the `gate_definitions` Postgres table and is edited via the admin UI at `/admin/gates` (Owner + Operations Admin). The gates below are the **initial-deploy seed and reference documentation**. Changes go through the admin UI after initial deploy; this file is updated only when the seed pattern itself changes (e.g., a new gate class shipped).

See DECISIONS.md 2026-04-18 — Business-rule thresholds. Gate approval thresholds reference the values configured in `business_thresholds`; if an approval threshold changes, gates using it update automatically.

## Gate definition shape

Every gate specifies:
- **From → To** — entry stage and target stage
- **Required fields** — data that must be present on the Project Card or sub-record
- **Required files** — artifacts that must be attached
- **Required approvals** — roles that must sign off (per role matrix + thresholds)
- **Blocking exceptions** — conditions that force Hold or Rework regardless of other criteria
- **Decision outcomes** — Go / Hold / Rework / Reject (and what each triggers)
- **Automatic triggers** — downstream actions fired on outcome (tasks, notifications, workflow enables)

## Hardcoded invariants (not admin-editable)

These are structural — built into the gate engine, not configured:

1. **Hard billing gate (SPEC §9):** no PO may be created until Gate 6 (Deposit Invoice Sent) has passed. No admin config can bypass this.
2. **Audit emission on every gate action** — each transition, failure, hold, rework, and override emits an audit event. Cannot be disabled.
3. **Deny-by-default:** if a gate definition is missing or malformed, the transition fails closed.
4. **Snapshot on issue:** Gates 4 (Proposal Issue) and 7 (Purchasing Release) freeze Library pricing and BOM state at the moment of issue. Snapshot creation is not optional.
5. **Step-up auth required** to override a gate failure (force-pass with Exec rationale). Each override is audit-logged and surfaces on reports.

---

## Gate 1 — Lead qualification

**From → To:** Lead (New) → Qualified (becomes Project Card scaffold)

| Dimension | Requirement |
|---|---|
| Required fields | Customer company (linked to master data), primary contact, lead source, priority bucket, owner, next action date, brief scope note |
| Required files | None |
| Required approvals | None (PM or Sales/Account can qualify) |
| Blocking exceptions | Customer company not in master data — must create the Company record first |
| Outcomes | **Qualify** → spawn Project Card scaffold, copy lead data; **Nurture** → keep as lead, set follow-up; **Archive/Disqualify** → close lead, capture reason |
| Triggers on Go | Create Project Card, assign owner, create "discovery meeting" task with due date |

---

## Gate 2 — Discovery complete

**From → To:** Qualified → Ready for Estimate

| Dimension | Requirement |
|---|---|
| Required fields | Site/location linked, room list (preliminary acceptable), budget expectation captured, system direction (standard family), handoff notes to estimating |
| Required files | Discovery meeting record; any customer-provided RFPs, RFIs, markups, architect drawings |
| Required approvals | PM or Sales/Account sign-off that scope is clean for estimating |
| Blocking exceptions | No site linked; empty room list; no budget range; no system direction flagged |
| Outcomes | **Go** → estimating enabled; **Hold** → awaiting customer info (captures what's missing); **Rework** → scope needs re-definition before estimating is viable |
| Triggers on Go | Notify Estimator(s), surface handoff checklist, create "scope-confirm" task |

---

## Gate 3 — Estimate ready

**From → To:** Estimating (Draft) → Ready for Proposal Issue

| Dimension | Requirement |
|---|---|
| Required fields | Full BOM with every line linked to a Library item (no free-typed SKUs); labor model applied per room; revision number set; all rooms have a system package assigned; project gross margin calculated |
| Required files | Engineering/submittal notes if design engagement was triggered; any client-specific scope annexes |
| Required approvals | Estimator sign-off on own work; **if project GM < 20% floor OR < target margin**, PM + Exec approval required with written rationale |
| Blocking exceptions | Any BOM line without Library link; any room without a system package; margin below floor without exception approval; unresolved AI-extracted suggestions still in "proposed" state on critical fields |
| Outcomes | **Go** → Proposal Issue gate enabled; **Hold** → missing info; **Rework** → scope or pricing needs revision |
| Triggers on Go | Enable Proposal Generator; pre-populate scope-writer drafts from BOM |

---

## Gate 4 — Proposal issue

**From → To:** Estimate Ready → Proposal Issued (snapshot frozen)

| Dimension | Requirement |
|---|---|
| Required fields | Proposal revision number; customer primary contact and delivery method (email/portal); send date; payment terms referenced; deposit policy selected per Gate 6 |
| Required files | Generated proposal PDF or DOC; scope language finalized; Ts&Cs attached |
| Required approvals | PM approval for any proposal at or above margin floor; Exec approval for any proposal below floor (from `business_thresholds`) |
| Blocking exceptions | Underlying BOM revision not approved; missing scope language; no customer delivery destination; margin below floor without Exec sign-off |
| Outcomes | **Go** → proposal issued, **snapshot frozen at this moment** (Library pricing at issue time is locked to this proposal revision); **Hold**; **Rework** |
| Triggers on Go | Snapshot freeze; follow-up tasks created (3-day, 7-day, 14-day touches); proposal logged in Customer section with version number; customer touchpoint "proposal sent" recorded |

---

## Gate 5 — Award / contract

**From → To:** Proposal Issued → Awarded

| Dimension | Requirement |
|---|---|
| Required fields | Award date; award method (signed proposal / customer contract / customer PO); customer signer name; linked contract/PO document reference |
| Required files | Signed proposal OR customer contract OR customer PO (at least one — the commercial commitment artifact) |
| Required approvals | PM records the award; Finance review for billing setup; Exec notification only (no gate approval) |
| Blocking exceptions | No signed commercial document attached; proposal has been superseded by unapproved revision since issue |
| Outcomes | **Go** → project becomes Awarded; **Reject** (Lost) → capture loss reason, archive |
| Triggers on Go | Create PM kickoff checklist (SPEC §7.5 handoff items); notify Finance; enable Deposit Invoice workflow; create customer onboarding update task |

---

## Gate 6 — Deposit invoice sent

**From → To:** Awarded → Deposit Sent (satisfies hard billing gate per SPEC §9)

| Dimension | Requirement |
|---|---|
| Required fields | Deposit amount calculated per configured deposit policy (see `business_thresholds`); invoice number; customer billing contact; payment terms; due date |
| Required files | Deposit invoice PDF generated by the system |
| Required approvals | Finance issues (PM may draft); if deposit amount deviates from policy, Exec approval required with rationale |
| Blocking exceptions | Gate 5 not passed; deposit amount below policy without Exec override; no billing contact on Customer record |
| Outcomes | **Go** → Purchasing Release gate becomes available; **Hold** → missing billing info |
| Triggers on Go | Enable Purchasing Release workflow; create "deposit received" follow-up task with aging on AR; send deposit-and-project-start customer update; **this is the unlock for PO creation (hardcoded invariant)** |

---

## Gate 7 — Purchasing release

**From → To:** Deposit Sent → Purchasing Release Active

| Dimension | Requirement |
|---|---|
| Required fields | BOM revision confirmed as approved (snapshot of Proposal Issue plus any approved post-award change orders); vendor selections complete for all equipment lines; lead times recorded; delivery schedule aligned with project timeline |
| Required files | Approved BOM revision export |
| Required approvals | PM approval for standard release; Exec approval if aggregate PO value on this release >$50K; individual PO approvals still governed by PO auto-routing rules |
| Blocking exceptions | Hard rule — **Gate 6 not passed** (deposit invoice not sent); BOM revision still in draft; any vendor missing from selected lines |
| Outcomes | **Go** → PO creation enabled against this approved BOM revision; **Hold** |
| Triggers on Go | Enable PO creation UI for the specified BOM revision; notify Warehouse/Purchasing; create substitution-window task (flag any Library price changes that occurred since proposal issue) |

---

## Gate 8 — Install readiness

**From → To:** Purchasing Active → Install Ready

| Dimension | Requirement |
|---|---|
| Required fields | All critical-path equipment received (or ETA within install window); site readiness confirmed (access, power, infrastructure); tech assignments made; pre-wire complete per room; rack staging complete |
| Required files | Receiving logs; site readiness checklist; rack staging checklist; pre-wire photo record |
| Required approvals | PM + Technician Lead sign-off |
| Blocking exceptions | Critical equipment missing without acceptable ETA; site not ready; unresolved high-priority punch items from pre-wire |
| Outcomes | **Go** → technician scheduling and field task packages release; **Hold** (specify missing dependency); **Rework** (pre-wire or staging failed review) |
| Triggers on Go | Release technician schedule; issue field task packages (role-tailored field views per SPEC §8); send pre-install customer update; create commissioning prerequisites task |

---

## Gate 9 — Commissioning readiness

**From → To:** Install Ready → Commissioning Ready

| Dimension | Requirement |
|---|---|
| Required fields | Installation task list complete; finish checklist complete per room; punch list populated (even if empty); programming/configuration log populated; DSP and control records started |
| Required files | Installation photo record; punch list; configuration/programming archive (current version) |
| Required approvals | PM + Technician Lead sign-off |
| Blocking exceptions | Install tasks incomplete; open critical punch items; missing programming archive |
| Outcomes | **Go** → commissioning checklist enabled; **Hold** |
| Triggers on Go | Enable commissioning checklist by system type; notify Programmer/Systems Engineer; create test-log scaffolds |

---

## Gate 10 — Substantial completion

**From → To:** Commissioning Ready → Substantial Complete

| Dimension | Requirement |
|---|---|
| Required fields | All commissioning tests passed; deficiencies logged and categorized (critical vs. minor); client-ready status confirmed; training scheduled |
| Required files | Test result logs; deficiency list; programming/version archive (final pre-handoff version) |
| Required approvals | PM + Exec (customer-facing milestone); Finance if this gate triggers a milestone-billing event |
| Blocking exceptions | Failed commissioning tests; critical deficiencies still open |
| Outcomes | **Go** → Substantial Complete (training + closeout enabled; billing milestone may fire); **Hold** |
| Triggers on Go | Trigger training workflow; enable final-billing workflow (if milestone-staged deposit policy, fire next invoice); send commissioning/training coordination customer update |

---

## Gate 11 — Closeout

**From → To:** Substantial Complete → Closed

| Dimension | Requirement |
|---|---|
| Required fields | Punch list fully resolved; as-built/O&M package assembled; final invoice sent and posted; client signoff recorded; all change-order billing reconciled |
| Required files | As-builts; O&M manuals; final invoice; client signoff document |
| Required approvals | PM + Finance; Exec for customer-facing closeout communication |
| Blocking exceptions | Open invoices on the project; unresolved punch items; missing as-built drawings; missing O&M documentation |
| Outcomes | **Go** → Closed (warranty handoff enabled; project working state archived); **Hold** |
| Triggers on Go | Create warranty/service record; send closeout customer update; archive project working state (Project Card becomes read-only for most roles; Finance retains E on billing reconciliation); schedule 30-day follow-up |

---

## Gate 12 — Warranty / service handoff

**From → To:** Closed → Warranty Active

| Dimension | Requirement |
|---|---|
| Required fields | Warranty start date; warranty term; support contract terms (if any); service contact list; handoff notes to Service/Support |
| Required files | Warranty terms document; support contract if applicable |
| Required approvals | Service/Support role receives; PM signs off on handoff completeness |
| Blocking exceptions | Missing warranty terms; missing support contact information |
| Outcomes | **Go** → Warranty Active; **Hold** |
| Triggers on Go | Notify Service/Support role; schedule 30-day customer follow-up; enable service-ticket workflow for this project; archive active project workspace |

---

## Gate failure handling

On failure (any blocking exception or rejected approval):
- System displays a readable list of missing fields, files, records, or approvals (SPEC §9).
- User can move the item into **Hold** or **Rework** with a visible reason captured.
- Never silently block.
- All hold/rework transitions are audit-logged with user, reason, and timestamp.

## Gate override (Exec force-pass)

An Executive may override a gate failure with:
- Written rationale (mandatory).
- Step-up auth at the moment of override.
- Elevated audit event marked as an override.
- Override is visible on project health reports until the underlying deficiency is resolved.

Overrides cannot bypass **hardcoded invariants** (no PO before deposit sent; no audit disable; no snapshot skip).

## Open items this file depends on

- **Engineering trigger logic** (DECISIONS open item, SPEC §7.4) — affects Gate 3 requirement "engineering/submittal notes if design engagement triggered." Until defined, Estimator decides if engineering is needed per project.
- **Room SKU structure** (SPEC §18 deferred) — will affect Gates 3 and 4 around BOM generation from room templates.
- **Service/warranty scope finalization** (SPEC open, v1.5 candidate) — Gate 12 may expand when service module is fleshed out.
