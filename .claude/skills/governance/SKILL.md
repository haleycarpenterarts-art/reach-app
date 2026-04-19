---
name: governance
description: Use whenever implementing or modifying role-based access control, user roles, permission grants, role-tailored UI views, segregation-of-duties rules, sensitive field protection, project assignment states, or any feature that depends on "who can see or do what". Trigger on any permission check beyond basic auth.
---

# Governance and user rights

Governance is both a security control and a UX control. The correct experience for a role is usually a simplified role-specific view, not a single universal interface with disabled sections. See `SPEC.md` §8 for the full spec.

## Access model: hybrid RBAC + ABAC

Broad permissions come from role. Final access also considers:

- User role
- Project assignment or relationship to the project
- Record type
- Requested action (view, create, edit, approve, archive, export)
- Data sensitivity (field-level)
- Workflow stage / gate status

Every access decision runs through `lib/authz/`. Deny by default.

## Permission layers

Permissions exist at five layers. Treat them as independent; do not collapse.

1. **Platform** — admin settings, user management, audit tools.
2. **Module** — Library, Estimation, Purchasing, Invoicing, Scheduling, Documents.
3. **Record** — Project Card, Task, Note, PO, Invoice, Drawing, Change Record.
4. **Field** — cost, margin, labor rate, approval data, internal notes.
5. **Action** — create, edit, approve, issue, archive, export, delete.

## Rights categories

View · Create · Edit · Approve · Archive · Export/Share · Admin override.

A user may have View without Edit. Edit without Approve. Archive without Delete. Do not conflate them.

## Base user roles

- Executive / Owner
- Operations Admin
- Project Manager
- Design Engineer
- Estimator
- Programmer / Systems Engineer
- Warehouse / Inventory
- Technician / Field Lead
- Technician / Field User
- Finance / Billing
- Sales / Account
- Service / Support

The specific role-to-permission mapping is an **open decision** (see `DECISIONS.md`). Do not invent it silently.

## Project assignment states

Beyond base role, users have a per-project relationship state:

- Project owner
- Assigned lead
- Assigned contributor
- Read-only stakeholder
- Temporary support
- No project access

Visibility is limited to assigned projects, approved support queues, or explicitly granted read-only access. A Technician does not automatically see every project — only assignments.

## Sensitive fields

These fields carry field-level visibility rules independent of record visibility:

- Cost
- Margin
- Labor rate
- Compensation-related data
- Internal management notes
- Approval rationale
- Commercial terms

A user can have full view on a record and still not see these fields. Never render them on a Technician default view. Never include them in customer-facing outputs.

Implementation pattern: `authz` should expose both `canViewRecord(record)` and `canViewField(record, field)`. UI components consuming sensitive fields check the field-level permission.

## Segregation of duties (hard rules)

Enforce in code, not just in policy:

- Same user cannot both approve a purchase and approve the related payment.
- Same user cannot both receive inventory and finalize vendor payment authorization.
- A Technician submits field issues or change candidates but does not approve commercial disposition.
- An Estimator prepares pricing; approval may require PM, manager, or executive review by threshold (thresholds are in `DECISIONS.md`).

Add new SoD rules as they come up. Document them here.

## Role-tailored views

Render different layouts of the same record per role. Do not disable-grey.

See `project-card` skill for the specific layouts.

## Audit and deletion rules

- Tasks and notes archive; they do not silently delete.
- Financial records never hard-delete in normal operation.
- Approval actions always log user, date, decision.
- Permission changes record in an access audit trail (`lib/audit/`).
- Sensitive exports are logged.

## Project Card for unassigned users

If a user has `No project access` for a project, the Project Card is unreachable — not just hidden sections. The project does not appear in search results, dashboards, or link previews visible to that user.

## What not to build

- A God-role that bypasses `authz`. Even the Owner role checks through `authz`.
- UI that hides buttons as the access control. Server-side refuses regardless of UI.
- A permission cache that persists across role changes without invalidation. Role changes must take effect immediately.
- A sensitive-field mask that is "" in the API response but present in the raw record — this leaks through logs and debuggers. Don't include the field in the response at all.
