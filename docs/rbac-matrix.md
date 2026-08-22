# RBAC Matrix — Role-to-permission mapping

Draft 2026-04-17. Reviewed and updated per CLAUDE.md §Skills → `governance`.

## Status — this file is a seed, not the runtime source of truth

Runtime permission grants live in the `permission_grants` Postgres table and are edited via the admin UI at `/admin/roles` (Executive + Operations Admin only). The tables below are the **initial-deploy seed** and **reference documentation**. Changes to the running system go through the admin UI, not by editing this file. This file is updated only when the seed pattern itself changes (e.g., new role added, new module shipped).

See DECISIONS.md 2026-04-17 — RBAC admin-editable matrix architecture.

**Roles are tenant-scoped.** Per DECISIONS.md 2026-08-22 — *Tenancy and identity* — role is carried on a per-tenant `Membership`, and the role set itself is a tenant-scoped table seeded from this file. It is no longer a Postgres enum. The twelve codes below are the **AV trade layer's seeded defaults**; a tenant may rename or add roles without a migration. See `docs/tenancy-model.md`.

## What is admin-editable vs hardcoded

**Admin-editable via matrix UI (Owner sovereignty):**
- Every cell in every grant table below (V/C/E/A/X/S per role × action × resource).
- Field-level visibility for all sensitive fields.
- Per-role assignment state scope overrides.
- Approval threshold values (once set — see DECISIONS open items under Business-rule thresholds).

**Hardcoded structural invariants (never admin-editable):**
1. Audit logging always on (CLAUDE.md rule 8).
2. Segregation of duties enforced at runtime — same user cannot approve a PO and the matching vendor payment, regardless of grants (SPEC §8).
3. Deny-by-default (CLAUDE.md rule 4).
4. AI suggestions cannot become authoritative without explicit user acceptance (CLAUDE.md rule 9).
5. Last Executive cannot demote self; last platform admin cannot revoke own admin.
6. Hard billing gate: no equipment orders until deposit invoice sent (SPEC §9).

## Step-up authentication for sensitive changes

The following trigger re-authentication (password + MFA challenge) and emit an elevated audit event:
- Weakening a sensitive-field restriction (making a previously-hidden field visible to a new role).
- Raising approval authority above threshold values.
- Rolling back to a previous matrix version.
- Changing MFA policy.
- Granting platform admin rights to a user.

## Default business principles shaping the seed

All admin-editable; weakening triggers step-up:

1. **Technicians (TL, TU) see no dollar figures.** Cost, sell, margin, vendor pricing, labor rate, contract totals — all hidden by default. Execution focus, not commercial thinking.
2. **Warehouse (WH) sees PO and proposal data.** Any value that would appear on a purchase order or itemized proposal (unit cost, unit sell, extended cost/sell, vendor pricing, lead times). Needed for receiving and invoice matching. Does not see margin or internal commercial notes.
3. **Executive + Finance** see all financial data.
4. **Compensation / commission data** restricted to Executive + Finance.

---

This matrix enumerates the default grants referenced in SPEC §8. It is the seeded source of truth for what each base role can do per module, modified by project assignment state (see DECISIONS.md 2026-04-17 — Project assignment state semantics).

## Rules of interpretation

1. **Role sets the ceiling.** A role's permissions are the maximum available; project assignment state cannot elevate them.
2. **Assignment state sets the floor-and-scope.** A user only sees projects they are assigned to (unless role is platform-scoped, e.g., Executive portfolio view).
3. **Field-level restrictions apply regardless of record-level access.** A role with access to a Project Card still may not see cost/margin/etc. (see SPEC §8 sensitive fields + DECISIONS 2026-04-17 additions).
4. **Segregation of duties is enforced in approval paths.** The same user cannot initiate + approve the same commercial action (see SPEC §8).
5. **Deny-by-default.** Anything not explicitly granted is denied (CLAUDE.md rule 4).

## Legend

| Symbol | Meaning |
|---|---|
| V | View |
| C | Create |
| E | Edit |
| A | Approve |
| X | Archive / supersede / void |
| S | Share / export (download, send to external party) |
| O | Admin override (platform-level, audit-logged) |
| — | No access |
| ● | Restricted by sensitive-field rules (see §Sensitive fields) |
| ◆ | Scoped by project assignment state |
| ▲ | Subject to approval matrix / threshold (see DECISIONS open items) |

## Role codes

| Code | Role |
|---|---|
| EO | Executive / Owner |
| OA | Operations Admin |
| PM | Project Manager |
| DE | Design Engineer |
| ES | Estimator |
| PR | Programmer / Systems Engineer |
| WH | Warehouse / Inventory |
| TL | Technician — Field Lead |
| TU | Technician — Field User |
| FB | Finance / Billing |
| SA | Sales / Account |
| SS | Service / Support |

---

## 1. Platform admin

System settings, user + role management, audit log access, MFA resets, secret/integration configuration.

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Manage users (invite, deactivate, reset MFA) | V C E | V C E | — | — | — | — | — | — | — | — | — | — |
| Manage roles / permission grants | V E | V E | — | — | — | — | — | — | — | — | — | — |
| System settings (integrations, templates, defaults) | V E | V E | — | — | — | — | — | — | — | — | — | — |
| View platform audit log | V S | V S | — | — | — | — | — | — | — | — | — | — |
| Admin override (any record, audit-logged) | O | O | — | — | — | — | — | — | — | — | — | — |

## 1a. Trade layer access

Which trade layers a role may enter — `av.`, `elec.`, and so on. Per DECISIONS.md
2026-08-22 — *Trade layers* — this is an ordinary permission in this matrix, not a
separate entitlement subsystem.

**The check is nested and both halves must pass:**

1. The **tenant's enabled-trades list**, set at provisioning. A tenant that does not
   have a trade has no rows, screens or vocabulary for it, for anyone, regardless of
   grants below.
2. The **role grant** in this table. The admin UI at `/admin/roles` only offers
   trades the tenant actually has, so a grant can never be issued for a trade the
   tenant lacks.

Failing either is a plain deny-by-default authorization failure — same path and same
`AUTHZ_DENIED` audit event as any other. The subdomain selects which trade layer is
active; it never selects the tenant and never scopes data.

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Enter a trade layer the tenant has enabled | V | V | V | V | V | V | V | V | V | V | V | V |
| Manage the tenant's enabled-trades list | — | — | — | — | — | — | — | — | — | — | — | — |

**Seed default is access to every trade the tenant has enabled**, for every role.
Reach AV ships single-trade, so a restrictive default would be friction with no
benefit on day one. A multi-trade tenant that wants its security technicians out of
the AV layer restricts it in the admin UI — and because that is *weakening* a
restriction in reverse, the reverse operation (re-granting) is the one that triggers
step-up auth, consistent with every other cell in this matrix.

**Managing the enabled-trades list is nobody's grant in v1.** It is provisioning-time
state set outside the tenant, not a tenant-editable setting. There is no billing
subsystem in v1, and this row is the seam entitlement will attach to when there is.

## 2. Library (master data)

Products, SKUs, pricing, room-type templates, standards, approved alternates, vendor links.

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Browse items (commercial + technical) | V | V | V | V | V | V | V● | V● | V● | V | V● | V● |
| Create / edit item master data | — | V C E | — | V E | V E | V E | — | — | — | — | — | — |
| Set / edit cost, vendor pricing, target sell | V E | V E | — | — | V E ▲ | — | — | — | — | V E ▲ | — | — |
| Define room templates / standard packages | V E | V E | — | V C E | V C E | V E | — | — | — | — | — | — |
| Define system standards (versioned) | V E | V E | — | V C E A | — | V E | — | — | — | — | — | — |
| Approve Library updates (propose-then-accept) | A | A | — | A (technical) | A (commercial ▲) | — | — | — | — | A (pricing ▲) | — | — |
| Archive / retire item | V X | V X | — | — | — | — | — | — | — | — | — | — |
| Export catalog | S | S | — | — | S | — | — | — | — | S | — | — |

Field-level: TL/TU/SA/SS cannot see cost, margin, vendor pricing, or discount terms on Library items — they see customer-facing description, manufacturer, model, dimensions, I/O, install notes.

## 3. Master entities — Companies, Contacts, Sites, Vendors

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Browse directory | V | V | V | V | V | V | V | V◆ | V◆ | V | V | V |
| Create / edit Company or Contact | V C E | V C E | V C E◆ | — | V C E◆ | — | — | — | — | V E | V C E | V C E◆ |
| Create / edit Site | V C E | V C E | V C E◆ | V E◆ | V E◆ | — | — | — | — | — | V C E | V E◆ |
| Create / edit Vendor | V C E | V C E | — | — | V E | — | V C E | — | — | V E | — | — |
| Archive entity | V X | V X | — | — | — | — | — | — | — | — | — | — |
| View contact compensation / commission references | V | — | — | — | — | — | — | — | — | V | — | — |
| Export directory | S | S | — | — | — | — | — | — | — | S | — | — |

Field-level: TL/TU see only site + onsite contacts for their assigned work; they do not see the full company directory.

## 4. Project Card lifecycle

Creating, accessing, editing metadata, archiving a Project Card as a whole.

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Browse portfolio (all projects) | V | V | — | — | — | — | — | — | — | V | — | — |
| View assigned projects | V | V | V◆ | V◆ | V◆ | V◆ | V◆ | V◆ | V◆ | V | V◆ | V◆ |
| Create new Project Card (convert from lead) | V C | V C | V C | — | V C | — | — | — | — | — | V C | — |
| Edit project metadata (scope, phase, owners) | V E | V E | V E◆ | — | V E◆ | — | — | — | — | — | V E◆ | — |
| Assign / reassign project parties | V E | V E | V E◆ | — | — | — | — | — | — | — | — | — |
| Advance gate (request transition) | ▲ | ▲ | ▲◆ | ▲◆ (design) | ▲◆ (estimate) | — | — | — | — | ▲ (billing) | ▲◆ (sales) | — |
| Archive / close project | V X | V X | — | — | — | — | — | — | — | — | — | — |

## 5. Project Card sections — notes, tasks, decisions, changes

Universal task object (CLAUDE.md simplification principles); notes promotable to structured records (SPEC §5).

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View notes / activity timeline | V● | V● | V●◆ | V●◆ | V●◆ | V●◆ | V●◆ | V●◆ | V●◆ | V● | V●◆ | V●◆ |
| Create note | V C | V C | V C◆ | V C◆ | V C◆ | V C◆ | V C◆ | V C◆ | V C◆ | V C | V C◆ | V C◆ |
| Promote note → decision / change / task | V C E | V C E | V C E◆ | V C E◆ (design) | V C E◆ (scope) | V C E◆ | — | V C◆ (field issue only) | — | V C (billing) | V C E◆ | V C E◆ |
| Approve decision / change | A | A | A◆ ▲ | A (design ▲) | — | — | — | — | — | A (commercial ▲) | — | — |
| Create task | V C E | V C E | V C E◆ | V C E◆ | V C E◆ | V C E◆ | V C E◆ | V C E◆ | V C E◆ (own) | V C E | V C E◆ | V C E◆ |
| Archive task / note | V X | V X | V X◆ | V X◆ (own) | V X◆ (own) | V X◆ (own) | V X◆ (own) | — | — | V X (own) | V X◆ (own) | V X◆ (own) |
| View internal management notes | V | V | V◆ | — | — | — | — | — | — | V | — | — |
| View approval rationale | V | V | V◆ | V◆ | V◆ (own domain) | — | — | — | — | V | — | — |

## 6. Estimation (BOM, pricing, proposal, scope writer)

See SPEC §12.1. Revision-controlled; snapshots frozen at issue.

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View BOM (quantities + descriptions) | V | V | V◆ | V◆ | V◆ | V◆ | V◆ | V●◆ | V●◆ | V | V●◆ | — |
| View cost / margin / vendor pricing on BOM | V | V | V◆ | — | V◆ | — | — | — | — | V | — | — |
| Create / edit BOM lines | — | V E | — | V E◆ (technical) | V C E◆ | — | — | — | — | — | — | — |
| Apply labor / markup / margin logic | V E | V E | — | — | V C E◆ | — | — | — | — | V E | — | — |
| Draft proposal scope language | V E | V E | V E◆ | — | V C E◆ | — | — | — | — | — | V E◆ | — |
| Generate proposal PDF/DOC | V C | V C | V C◆ | — | V C◆ | — | — | — | — | — | V C◆ | — |
| Issue / release proposal to customer | A ▲ | A ▲ | A◆ ▲ | — | — | — | — | — | — | — | A◆ ▲ | — |
| Archive / supersede revision | V X | V X | V X◆ | — | V X◆ | — | — | — | — | — | — | — |
| Export BOM / proposal | V S | V S | V S◆ | — | V S◆ | — | — | — | — | V S | V S◆ | — |

Field-level on BOM (seeded defaults):
- **TL/TU:** no dollar figures at all — only customer-facing description, quantities, install notes.
- **SA:** customer-facing description, quantities, install notes, customer-facing sell price (on issued proposals only). No cost, margin, or vendor pricing.
- **WH:** unit cost, unit sell, extended cost/sell, vendor pricing, lead times. No margin.
- **Estimators:** cost + margin for pricing work. Not executive margin-variance flags.

## 7. Schematic / Design drawings

See SPEC §12.2. Project-linked via BOM + Library. Revision-controlled.

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View diagrams (signal flow, rack, submittal, field) | V | V | V◆ | V◆ | V◆ | V◆ | V◆ | V◆ | V◆ (field only) | — | V◆ (submittal only) | V◆ |
| Create / edit diagrams | — | V E | — | V C E◆ | — | V E◆ | — | — | — | — | — | — |
| Generate / apply AI-assisted diagram pass | V E | V E | — | V E◆ | — | V E◆ | — | — | — | — | — | — |
| Accept manual override | V | V | — | V A◆ | — | V A◆ | — | — | — | — | — | — |
| Issue diagram (release to field / customer) | A ▲ | A ▲ | — | A ◆ ▲ | — | — | — | — | — | — | — | — |
| Archive / supersede | V X | V X | — | V X◆ | — | V X◆ | — | — | — | — | — | — |
| Export / share submittal | V S | V S | V S◆ | V S◆ | — | — | — | — | — | — | V S◆ | — |

## 8. Documents & files

Generic project artifacts not covered by Estimation or Schematic (RFPs, contracts, photos, markups, O&M).

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View files | V● | V● | V●◆ | V●◆ | V●◆ | V●◆ | V●◆ | V●◆ | V●◆ | V● | V●◆ | V●◆ |
| Upload file | V C | V C | V C◆ | V C◆ | V C◆ | V C◆ | V C◆ | V C◆ | V C◆ | V C | V C◆ | V C◆ |
| Edit file metadata (classification, visibility) | V E | V E | V E◆ | V E◆ | V E◆ | V E◆ | — | — | — | V E | V E◆ | V E◆ |
| Delete file (archival) | V X | V X | V X◆ | — | — | — | — | — | — | — | — | — |
| Share file externally | V S ▲ | V S ▲ | V S◆ ▲ | — | — | — | — | — | — | V S ▲ | V S◆ ▲ | — |

Field-level: commercial documents (contracts, deposit invoices, vendor POs) hidden from TL/TU/SA/SS/WH unless explicitly shared on the record.

## 9. Purchasing

See SPEC §7.6. Cannot order until deposit invoice sent (hard rule, SPEC §9).

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View purchasing status | V | V | V◆ | — | V◆ | — | V | — | — | V | — | — |
| Create PO (against approved BOM revision) | V C | V C | V C◆ ▲ | — | — | — | V C ▲ | — | — | — | — | — |
| Approve PO (by amount / threshold) | A ▲ | A ▲ | A◆ ▲ | — | — | — | — | — | — | — | — | — |
| Record substitution request | V C | V C | V C◆ | V C◆ | V C◆ | — | V C | — | — | — | — | — |
| Approve substitution | A | A | A◆ | A◆ (technical) | A◆ (commercial) | — | — | — | — | — | — | — |
| Close / cancel PO | V E X | V E X | V E X◆ ▲ | — | — | — | — | — | — | — | — | — |
| Export PO | V S | V S | V S◆ | — | — | — | V S | — | — | V S | — | — |

## 10. Receiving & inventory

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Receive shipment against PO | V C E | V C E | V C E◆ | — | — | — | V C E | V C E◆ | — | — | — | — |
| Log damage / shortage | V C | V C | V C◆ | — | — | — | V C | V C◆ | V C◆ | — | — | — |
| Update inventory location / staging status | V E | V E | V E◆ | — | — | — | V E | V E◆ | — | — | — | — |
| Confirm serial / controlled item | V E | V E | V E◆ | — | — | — | V E | V E◆ | — | — | — | — |
| Escalate exception to PM / purchasing | V C | V C | V C◆ | — | — | — | V C | V C◆ | V C◆ | — | — | — |

## 11. Invoicing & billing

Segregation-of-duties: same user cannot both approve PO and approve related payment (SPEC §8).

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View invoice / billing status | V | V | V◆ | — | V◆ (summary) | — | — | — | — | V | V◆ (summary) | — |
| Create deposit invoice | V C | V C | V C◆ ▲ | — | — | — | — | — | — | V C ▲ | — | — |
| Create milestone / progress invoice | V C | V C | V C◆ ▲ | — | — | — | — | — | — | V C ▲ | — | — |
| Issue invoice to customer | A ▲ | A ▲ | — | — | — | — | — | — | — | A ▲ | — | — |
| View vendor invoice intake | V | V | V◆ | — | — | — | — | — | — | V | — | — |
| Approve vendor invoice for payment | A ▲ | — | — | — | — | — | — | — | — | A ▲ | — | — |
| Reconcile PO ↔ receipt ↔ invoice | V E | V E | — | — | — | — | — | — | — | V E | — | — |
| Record collection / payment received | V E | V E | — | — | — | — | — | — | — | V C E | — | — |
| Export invoice / billing report | V S | V S | V S◆ (own proj) | — | — | — | — | — | — | V S | — | — |

Segregation check: if user approved the PO for a given line, the system blocks that user from approving the matching vendor payment.

## 12. Training & closeout

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Create training session record | V C E | V C E | V C E◆ | — | — | V C E◆ | — | V C E◆ | — | — | V C E◆ | V C E |
| Log attendance | V C E | V C E | V C E◆ | — | — | V C E◆ | — | V C E◆ | V C E◆ | — | V C E◆ | V C E |
| Assemble O&M / as-built package | V C E | V C E | V C E◆ | V C E◆ | — | V C E◆ | — | V C E◆ | — | — | — | V C E |
| Client signoff record | V C E | V C E | V C E◆ | — | — | — | — | — | — | — | V C E◆ | V C E |
| Punch list completion sign-off | A | A | A◆ | — | — | — | — | A◆ | — | — | — | A |
| Close project (final gate) | A ▲ | A ▲ | A◆ ▲ | — | — | — | — | — | — | A ▲ (billing side) | — | — |

## 13. Service / warranty

v1.5 scope per DECISIONS open item, but base rights assumed here for future.

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View service tickets | V | V | V | — | — | V | — | — | — | V | V | V |
| Create ticket | V C | V C | V C | — | — | V C | — | V C | V C | — | V C | V C |
| Assign / resolve ticket | V E | V E | V E | — | — | V E | — | V E | — | — | — | V C E |
| Bill service work | V C | V C | — | — | — | — | — | — | — | V C ▲ | — | — |

## 14. Customer section / customer updates

See SPEC §11 + DECISIONS 2026-04-17 — Customer update issuance authority.

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View customer touchpoint history | V | V | V◆ | V◆ (recent) | V◆ (recent) | — | — | — | — | V | V◆ | V◆ |
| Draft customer update | V C E | V C E | V C E◆ | — | — | — | — | — | — | V C E | V C E◆ | V C E◆ |
| Contribute curated content to an update (from notes) | V C | V C | V C◆ | V C◆ | V C◆ | V C◆ | V C◆ | V C◆ | V C◆ | V C | V C◆ | V C◆ |
| Issue standard update (weekly / milestone / install / closeout) | A | A | A◆ | — | — | — | — | — | — | — | A◆ | — |
| Issue billing-related update | A ▲ | A ▲ | A◆ ▲ | — | — | — | — | — | — | A ▲ (sign-off) | A◆ ▲ | — |
| Issue issue/delay notice | A ▲ | A ▲ (sign-off) | A◆ ▲ | — | — | — | — | — | — | — | A◆ ▲ | — |
| Manage customer update templates | V E | V E | — | — | — | — | — | — | — | — | V E | — |
| Export sent update | V S | V S | V S◆ | — | — | — | — | — | — | V S | V S◆ | V S◆ |

## 15. Audit log

CLAUDE.md rule 8: audit events for auth, authz failures, approvals, state transitions, money-changing actions, permission changes, customer document releases.

| Action | EO | OA | PM | DE | ES | PR | WH | TL | TU | FB | SA | SS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View platform audit log | V S | V S | — | — | — | — | — | — | — | — | — | — |
| View project-scoped audit (own projects) | V S | V S | V S◆ | V◆ | V◆ | V◆ | — | — | — | V S | V S◆ | V S◆ |
| View own action history | V | V | V | V | V | V | V | V | V | V | V | V |
| Export audit records | V S ▲ | V S ▲ | — | — | — | — | — | — | — | V S ▲ | — | — |

---

## Sensitive fields reference (seeded defaults)

Per SPEC §8 + DECISIONS 2026-04-17 — Sensitive field list + RBAC admin-editable matrix architecture. All rows below are **defaults**; admin can edit via matrix UI, weakening triggers step-up auth.

| Field | Default visibility |
|---|---|
| Unit cost, extended cost | EO, OA, FB, WH; PM◆; ES◆ (for estimation work) |
| Unit sell, extended sell (internal view) | EO, OA, FB, WH; PM◆; ES◆; SA◆ (on issued proposals) |
| Margin, margin-variance flags | EO, OA, FB; PM◆ |
| Labor rate ($/hr) | EO, OA, FB; PM◆; ES◆ |
| Vendor pricing / discount terms | EO, OA, FB, WH; ES◆ (read-only on BOM) |
| Project contract total, billing totals | EO, OA, FB; PM◆; SA◆ |
| Compensation-related data | EO, FB |
| Contact compensation / commission | EO, FB |
| Internal management notes | EO, OA, PM◆, FB |
| Approval rationale | EO, OA; role-relevant approver◆ |
| Commercial terms (proposal / contract) | EO, OA, FB, PM◆, SA◆ |
| Customer pre-proposal budget | EO, OA, SA◆, PM◆ (post-award) |

**Default seed invariants** (admin can change, step-up required):
- **TL/TU see zero dollar figures** — not on BOM, not on Project Card, not on documents, not on exports. Their view strips all monetary values.
- **WH sees anything on a PO or itemized proposal** — full cost/sell/vendor-pricing transparency for receiving and invoice matching, excluding margin and internal commercial notes.
- **Compensation and commission data** are seeded to Executive + Finance only; if admin broadens, step-up auth engages.

---

## Open items for the matrix

- Approval thresholds (PM purchasing ceiling, executive margin delta, finance payment authority) — see DECISIONS open items under Business-rule thresholds. Until set, ▲ means "requires approval" but the matrix cannot say at what level.
- Engineering trigger logic (SPEC §7.4 open decision) — determines whether DE is auto-added as Assigned contributor on a project.
- Service / warranty scope finalization (deferred to v1.5 per SPEC open items) — matrix row 13 is tentative.
