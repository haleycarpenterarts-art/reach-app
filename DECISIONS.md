# DECISIONS.md

This file tracks decisions that need to be made and decisions that have been made. Two sections:

1. **Open decisions** — things Claude Code should not silently pick. Close these before they force their way into the architecture.
2. **Decision log** — once a decision is made, move it here with date, decision, and rationale. Lightweight ADRs.

---

## Open decisions

### Stack-level

- [x] **Auth provider.** → Supabase Auth. See 2026-04-17 log.
- [x] **Managed object storage provider.** → Supabase Storage. See 2026-04-17 log.
- [x] **Background job system.** → Supabase pg_cron + pgmq for v1; revisit for Phase 5 ingest volume. See 2026-04-17 log.
- [x] **Deployment target.** → Vercel. See 2026-04-17 log.
- [x] **Managed PostgreSQL provider.** → Supabase (Pro tier for PITR). See 2026-04-17 log.
- [x] **Monitoring / error tracking.** → Sentry. See 2026-04-17 log.
- [x] **Email provider.** → Resend. See 2026-04-17 log.
- [x] **Log storage (implicit in PHASES §1).** → Vercel built-in logs for v1; add dedicated vendor (Axiom candidate) only when log queries become a pattern. See 2026-04-17 log.
- [x] **UI component library.** → shadcn/ui. See 2026-04-17 log.
- [x] **Styling approach.** → Tailwind. See 2026-04-17 log.
- [x] **Testing stack.** → Vitest (unit) + Playwright (integration/E2E) + Testing Library (components). See 2026-04-17 log.
- [x] **AI provider for extraction / assistant.** → Anthropic API (Claude Sonnet + Haiku). Inference split: synchronous via server actions, background via pg_cron/pgmq. See 2026-04-17 log.
- [x] **PDF / DOC generation.** → React-PDF (PDFs) + `docx` npm package (Word). See 2026-04-17 log.

### Business-rule thresholds (required before Phase 4 ships)

- [x] **Approval matrix thresholds.** → PM PO ceiling $15K; Exec approval $15K–$50K tier and above $50K; 3pp margin variance trigger; 20% margin floor; Finance dual-approval above $25K. Admin-editable (Owner + Finance) with step-up. See 2026-04-18 log.
- [x] **Deposit invoice requirement.** → 30% default on projects >$25K; 50% on smaller projects; milestone-staged (25/25/50) as opt-in. Admin-editable per deal type. See 2026-04-18 log.
- [x] **Margin variance alerts.** → Exec review triggered on any of: revision drops GM ≥3pp from issued proposal; project GM below 20% floor; GM dollars change >$5K or >10%. See 2026-04-18 log.
- [x] **PO auto-routing rules.** → Combination: amount tier + category override + project flag override. See 2026-04-18 log.
- [x] **Default gate requirements per phase.** → Seed approved as-is at `docs/gates.md`. Admin-editable at runtime. See 2026-04-18 log.

### Governance specifics

- [x] **Role-to-permission mapping.** → Seed approved as-is at `docs/rbac-matrix.md`. Admin-editable at runtime per RBAC architecture. See 2026-04-18 log.
- [x] **Sensitive field list finalization.** → Confirmed SPEC §8 list + added vendor pricing/discount terms, customer pre-proposal budget, contact compensation. See 2026-04-17 log.
- [x] **Project assignment state semantics.** → Read/write matrix per state defined; assignment modulates role but never elevates it. See 2026-04-17 log.
- [x] **MFA scope.** → Required for all users. See 2026-04-17 log.
- [x] **Customer update approval.** → PM + Sales/Account + Executive can issue. Finance sign-off for billing-related. Executive sign-off for issue/delay notices. Others contribute content only. See 2026-04-17 log.

### Data / retention

- [x] **Audit log retention period.** → Indefinite. See 2026-04-18 log.
- [x] **Archived record retention.** → 7 years, then admin-reviewed soft-purge option. See 2026-04-18 log.
- [x] **Customer update artifact storage.** → Keep generated PDFs/DOCs permanently. See 2026-04-18 log.
- [x] **File storage limits per project.** → No hard cap; alert at 5GB per project. See 2026-04-18 log.

### Product scope

- [x] **Room SKU integration timeline.** → **Pulled into v1.** Editable SKU builder (Ops Admin + Design Engineer). Seed approved as-is at `docs/room-skus.md`. See 2026-04-18 log.
- [x] **Engineering trigger logic.** → No auto-trigger rules. Business routes projects in/out of engineering manually. DE role added as Assigned contributor on demand. See 2026-04-18 log.
- [x] **Playbook format.** → In-app editable by Ops Admin. See 2026-04-18 log.
- [x] **Service / warranty workflow scope.** → v1 ships Gate 12 (warranty handoff creates record only). Ticketing, SLAs, scheduling deferred to v1.5. See 2026-04-18 log.

### UX

- [x] **Mobile strategy.** → Responsive web (mobile-first layouts) in v1 for Technician + PM + Warehouse. PWA deferred to Phase 3 enhancement. Native deferred indefinitely. See 2026-04-18 log.
- [x] **Offline support for field work.** → v1.5. Responsive web assumes connected sites. See 2026-04-18 log.
- [x] **Photo / markup tooling.** → Simple upload + server-side thumbnails + tap-to-zoom in v1. Integrated redline/annotation deferred to v1.5+. See 2026-04-18 log.

---

## Decision log

*Record decisions here as they are made. Format below.*

### Template

```
### YYYY-MM-DD — Short title
**Decision:** What was chosen.
**Context:** What problem it solves.
**Alternatives considered:** Options that were rejected and why.
**Consequences:** What this locks in, what it makes harder later.
```

### 2026-04-17 — Stack core

**Decision:** Next.js (App Router) + TypeScript + PostgreSQL + Prisma.
**Context:** Need a production-capable, maintainable stack for a 10–20 user internal business system that a conventional developer can maintain after AI-assisted implementation.
**Alternatives considered:** Remix (less ecosystem momentum at this scale); Rails or Django (strong, but the app needs heavy React UI and real-time-ish interactions); T3 stack with tRPC (considered, deferred in favor of vanilla Next.js server actions for lower ceremony).
**Consequences:** Locks in Node ecosystem for the foreseeable future. Prisma couples us to its migration model; escape hatch is raw SQL via Prisma when needed.

### 2026-04-17 — Bundled infrastructure stack

**Decision:** Vercel (host) + Supabase (Postgres, Auth, Storage, basic jobs via pg_cron/pgmq). Email and error tracking still TBD.
**Context:** Solo maintainer, lean posture, $500/mo ceiling, no existing vendor relationships. Fewer vendors is a bigger win than marginal best-in-class quality at 10–20 internal users.
**Alternatives considered:** Best-of-breed (Vercel + Neon + Clerk + R2 + Inngest + others) rejected — 7-vendor surface area too high for a solo maintainer and each extra vendor adds failure modes and bills. Supabase Auth's simpler role model is acceptable because the hybrid RBAC+ABAC in SPEC §8 lives in `lib/authz/` regardless of provider.
**Consequences:** Supabase becomes a single point of coupling — an outage hits DB, auth, and storage together. Mitigation: Supabase Pro SLA + daily backups + PITR; Prisma abstracts DB so migration out is a Postgres dump + auth rewrite, not a codebase rewrite. Jobs on pg_cron/pgmq for v1 — plan to add Inngest as a separate layer if Phase 5 ingest outgrows it. Supabase branching (paid feature) replaces Neon branching for staging/migration testing.

### 2026-04-17 — $500/mo operating budget

**Decision:** $500/mo ceiling for production runtime at steady state.
**Context:** System runs a $5–10M/yr business; $500/mo is ~0.1% of revenue — a sane ratio for the operating system of the business. Solo-maintainer time is the scarce resource, not infrastructure dollars.
**Alternatives considered:** $300/mo tight tier (forces AI rationing and smaller DB tiers — false economy); no cap (rejected — explicit ceiling prevents vendor-cost surprises and forces AI discipline).
**Consequences:** Any vendor or feature pushing steady-state spend over $500/mo requires explicit reconsideration. AI usage in Phase 5 needs monitoring to stay under ~$200/mo of the envelope.

### 2026-04-17 — Error tracking, email, and log storage

**Decision:** Sentry for error tracking. Resend for transactional and customer-update email. No dedicated log vendor for v1 — Vercel built-in logs only; revisit when log-query patterns emerge.
**Context:** Stack-coherent picks: Sentry has first-class Next.js/Vercel integration; Resend pairs with React Email for the customer-update templates in SPEC §11. Logs deferral avoids premature vendor proliferation — you can't justify an Axiom subscription before you have queries you actually want to run.
**Alternatives considered:** Error tracking — Better Stack (weaker error UX), Axiom (events-first), Datadog (overkill/expensive). Email — Postmark (deliverability king but weaker React template story), SendGrid (legacy/complex). Logs — Axiom or Better Stack deferred, not rejected.
**Consequences:** Sentry free tier (5K errors/mo) covers early phases; upgrade to Team ($26/mo) when volume crosses. Resend free tier (3K emails/mo) covers build; $20/mo when it crosses. Vercel log retention is 1 day (Hobby) / 3 days (Pro) — post-incident forensics are time-limited. Accept for v1; add Axiom or similar if an incident hits the retention wall.

### 2026-04-17 — Frontend stack

**Decision:** shadcn/ui (components) + Tailwind (styling) + Vitest (unit) + Playwright (integration/E2E) + Testing Library (component tests).
**Context:** Next.js App Router + React Server Components + solo maintainer + AI-assisted development. shadcn/ui has the strongest AI-codegen support (faster builds with Claude/Cursor), owned components (no dep surprises), and Radix accessibility primitives. Tailwind is forced by shadcn and is the right answer regardless. Vitest + Playwright is the 2026 default for new Next.js projects — Jest is now legacy.
**Alternatives considered:** Mantine (heavier, weaker RSC story); Chakra (Emotion runtime cost in RSC); Radix-from-scratch (more work, no gain); Jest (legacy default, slower than Vitest).
**Consequences:** shadcn components live in-repo — you re-copy from upstream when fixes land (acceptable for solo maintainer, fewer moving parts). All tools free. Tailwind config becomes a minor standards surface to maintain (design tokens, spacing scale). Playwright adds CI time but catches workflow-level regressions the unit tests miss.

### 2026-04-17 — AI provider and inference topology

**Decision:** Anthropic API as sole AI provider. Claude Sonnet for assistant, scope drafting, and complex extraction; Claude Haiku for high-volume low-complexity batch work. Inference split by latency: synchronous user interactions run from server actions (streaming); anything processing uploaded files or >10s goes through the background job queue (pg_cron/pgmq initially).
**Context:** Core AI workload is long-context structured extraction (ingest per SPEC §13) and the project-aware assistant (§14.4). Claude's long-context handling and prompt caching (5-min TTL) are a direct fit. Single vendor reduces complexity for solo maintainer.
**Alternatives considered:** OpenAI alone (weaker long-context extraction quality for the ingest workload); dual-vendor Anthropic + OpenAI (rejected — doubles SDK, monitoring, and prompt-engineering surface for marginal cost savings). All-synchronous (rejected — Vercel 300s timeout cap would break ingest of large documents). All-queued (rejected — would make the assistant and quick suggestions feel sluggish).
**Consequences:** Must implement prompt caching deliberately for the assistant to stay within the ~$200/mo AI envelope. Background job layer becomes load-bearing earlier than Phase 5 — pg_cron/pgmq must handle ingest reliably. Plan to add Inngest if pg_cron/pgmq struggles with Phase 5 throughput. Every AI-generated record must be tagged as suggestion per CLAUDE.md rule 9 — no direct writes to trusted-core paths.

### 2026-04-17 — Document generation

**Decision:** React-PDF for PDF output + the `docx` npm package for Word output. Both run in-process on Vercel serverless. No headless browser, no self-hosted renderer, no third-party template service.
**Context:** SPEC §11 requires PDF or DOC customer updates (executive summary, weekly update, milestone, closeout, etc.). Templates are standardized, not arbitrary marketing output. Pure-Node libraries avoid the Chromium-on-serverless pain and keep within the $500/mo envelope.
**Alternatives considered:** Puppeteer + `@sparticuz/chromium` (heavy cold starts, fragile on serverless); Carbone Cloud (compelling for business-editable Word templates but $79/mo minimum and another vendor — deferred, not rejected); Gotenberg (self-hosted, rejected on lean + solo grounds).
**Consequences:** React-PDF styling is a subset of CSS (flexbox, limited fonts) — customer-update layouts are designed in its idioms, not Tailwind. Fine for SPEC §11 standardized templates; would be painful if future needs require pixel-perfect marketing output (in which case, swap to Carbone Cloud or Puppeteer). Template content is code, not editable by non-devs — if that becomes friction, revisit Carbone.

### 2026-04-17 — MFA required for all users

**Decision:** TOTP MFA required for every user, no role-based exceptions.
**Context:** System touches pricing, margin, customer financials, and issues customer-facing documents. Any compromised account is a business risk. Supabase Auth provides TOTP free; user-experience cost is negligible in 2026.
**Alternatives considered:** Privileged-roles-only MFA (Exec, Ops Admin, Finance) — rejected because technicians, PMs, and estimators also touch commercially sensitive data; tiered policies are harder to enforce and audit than blanket ones.
**Consequences:** Every new user goes through MFA enrollment during onboarding. Account recovery flow must be built early (backup codes + admin-assisted reset via audit-logged action). Adds one Phase 2 deliverable: a reliable MFA reset playbook.

### 2026-04-17 — Sensitive field list

**Decision:** Field-level protection applies to: cost, margin, labor rate, compensation-related data, internal management notes, approval rationale, commercial terms (from SPEC §8) **plus** vendor pricing/discount terms, customer pre-proposal budget expectations (SPEC §7.2), and any contact compensation or commission references.
**Context:** SPEC §8 list covers internal financials but misses vendor-side and sales-cycle-sensitive values that appear on project records.
**Alternatives considered:** Only the SPEC §8 list (rejected — leaves vendor and sales-cycle values exposed to roles that shouldn't see them).
**Consequences:** Technician view must strip these fields consistently across Project Card, BOM, customer updates, and exports. Library item display must hide vendor discount terms from non-Purchasing/non-Exec roles.

### 2026-04-17 — Project assignment state semantics

**Decision:** Six assignment states with explicit read/write/approval rules. Assignment state modulates role but never elevates it — field-level restrictions from the role always win.

| State | Read | Write | Sensitive fields | Approvals |
|---|---|---|---|---|
| Project owner | All sections | All sections | Yes | Per role matrix |
| Assigned lead | All sections | All sections | Yes | Per role matrix |
| Assigned contributor | All sections | Own tasks/notes + assigned sections | Per role matrix | No |
| Read-only stakeholder | Non-sensitive sections only | None | No | No |
| Temporary support | Scoped to section(s), time-bounded | Scoped to section(s) | Per role matrix, scoped | No |
| No project access | None | None | — | — |

**Context:** SPEC §8 lists the six states but leaves semantics unspecified. Without them, `lib/authz/` can't be implemented consistently.
**Alternatives considered:** Assignment state as a role-elevator (e.g., Technician as Assigned lead sees margin) — rejected because it breaks field-level guarantees and complicates audit reasoning. The clean rule is: role sets the ceiling, assignment state sets the floor-and-scope.
**Consequences:** `lib/authz/` check signature becomes `(user_role, assignment_state, action, resource, field) → allow | deny`. Temporary support requires a time-bound mechanism (expiry timestamp, auto-revocation job).

### 2026-04-17 — Customer update issuance authority

**Decision:** PM, Sales/Account, and Executive/Owner may issue standard customer updates. Finance sign-off required for any update touching billing milestones, deposit confirmation, or change-order commercial terms. Executive sign-off required for issue/delay notices (reputational impact). All other roles (Technician, Estimator, Design, Programmer, Warehouse, Service/Support) contribute curated content per SPEC §11 but cannot issue.
**Context:** SPEC §11 governs customer-facing outputs; concentrated issuance authority reduces risk of off-message communication. Finance gate on billing-related updates aligns with SPEC §8 segregation-of-duties principles.
**Alternatives considered:** Any assigned user can issue (rejected — violates communication governance); Executive-only issuance (rejected — creates bottleneck, PMs and AMs are closest to the customer relationship).
**Consequences:** Customer update workflow needs a two-step flow for billing-affecting and issue/delay variants (draft → sign-off → send). Audit log captures issuer, approver (if applicable), content version, and sent timestamp per CLAUDE.md rule 8.

### 2026-04-17 — RBAC admin-editable matrix architecture

**Decision:** Role-to-permission grants are stored in a Postgres table (`permission_grants`) and editable via an admin UI at `/admin/roles` (Executive + Operations Admin only). The markdown matrix at `docs/rbac-matrix.md` is the **initial-deploy seed and reference documentation**, not the runtime source of truth. V1 is grants-only (no custom role creation — edit grants on the 12 base roles). Matrix version retention is indefinite. Every change emits an audit event with diff; every save snapshots a new matrix version for one-click rollback.

**Owner sovereignty:** Executive controls grants for any portion or data set per user role via the admin UI. No hardcoded field-visibility locks. Hardcoded rules are limited to **structural invariants** — system integrity, not access restrictions:
1. Audit logging cannot be disabled (CLAUDE.md rule 8).
2. Segregation of duties enforced at runtime — same user cannot approve a PO and the matching vendor payment, regardless of grants (SPEC §8).
3. Deny-by-default (CLAUDE.md rule 4).
4. AI suggestions cannot become authoritative without explicit user acceptance (CLAUDE.md rule 9).
5. Last Executive cannot demote self; last platform admin cannot revoke own admin.
6. Hard billing gate: no equipment orders until deposit invoice sent (SPEC §9).

**Step-up authentication for sensitive changes:** The following actions require re-authentication (password + MFA challenge) and emit an elevated audit event:
- Weakening a sensitive-field restriction (making a previously-hidden field visible to a new role).
- Raising approval authority above threshold values.
- Rolling back to a previous matrix version.
- Changing MFA policy.
- Granting platform admin rights to a user.

Pattern supported natively by Supabase Auth reauthentication flow.

**Default grants reflect business principles (all admin-editable; weakening triggers step-up):**
- **Technicians (TL, TU)** see no dollar figures of any kind by default — cost, sell, margin, vendor pricing, labor rates, contract totals are all hidden. Execution focus, not commercial thinking.
- **Warehouse (WH)** sees any value that would appear on a purchase order or itemized proposal (unit cost, unit sell, extended cost/sell, vendor pricing, lead times). Needed for receiving and invoice matching. WH does not see margin or internal-only commercial notes by default.
- **Executive + Finance** see all financial data by default.
- **Compensation / commission data** restricted to Executive + Finance by default.

**Context:** User requires flexibility for business-specific role evolution without dev work, while preserving audit integrity and preventing accidental exposure of sensitive data. Admin-editable matrix + step-up auth + hardcoded structural invariants achieves all three.

**Alternatives considered:** Fully hardcoded matrix (every business change becomes a dev ticket — rejected). Custom role creation in v1 (rejected — too much rope; revisit when patterns emerge). Hardcoded field-visibility locks beyond structural invariants (rejected — Owner must have sovereignty over the grant matrix; step-up auth is the safety net, not removal of the control).

**Consequences:** `lib/authz/` queries the `permission_grants` table (with cache) rather than evaluating static rules. Permission rows use `effective_from` / `effective_to` to preserve "who had what access when" for audit reconstruction. Seed script (`db/seed/rbac.ts`) generated from `docs/rbac-matrix.md` runs only at initial deploy; subsequent changes all go through admin UI, never re-seeding. Admin matrix UI is a Phase 2 deliverable (depends on auth + RBAC framework). Structural invariants live in code — changes to that list require a git commit and PR review, not an admin click.

**Closes sub-decisions:** custom roles (grants-only v1), version retention (indefinite), field-level editability scope (fully admin-editable; step-up to weaken).

### 2026-04-18 — Business-rule thresholds (approvals, deposits, margin, PO routing)

**Decision:** Seeded default thresholds below, stored in DB config table, editable at runtime via admin UI by **Owner + Finance** (distinct from RBAC grant edits which are Executive + Ops Admin). All threshold changes emit audit events; weakening a threshold (raising PM ceiling, lowering margin floor, loosening deposit policy, increasing Finance solo-payment authority) triggers step-up auth.

**Approval thresholds (default seed):**
- PM single-PO approval: up to $15,000.
- Exec approval: POs $15K–$50K (Exec approves PM-proposed) and >$50K (Exec approval with written rationale).
- Aggregate project change orders: PM up to $10,000 cumulative; Exec above $10K or >5% of contract.
- Proposal issuance: PM for any proposal ≥ margin floor; Exec for any proposal below floor.
- Margin variance (Exec review required): revision drops GM ≥3pp from issued proposal OR GM falls below 20% floor OR GM dollars change by >$5K or >10%.
- Finance payment authority: single Finance approval up to $25,000 per vendor invoice; dual approval (Finance + Exec) above $25K.
- Segregation enforced in code: user who approved the PO cannot approve the matching payment (hardcoded invariant, not editable).

**Deposit invoice policy (default seed):**
- Projects > $25K contract: **30% deposit** at award, triggers Purchasing Release gate per SPEC §9.
- Projects ≤ $25K contract: **50% deposit**, 50% on completion.
- Milestone-staged opt-in per deal: 25% contract / 25% pre-install / 50% commissioning.
- Service/warranty work: net-30, no deposit.
- Residential projects: admin can configure a separate default (industry typical is 50%).

**PO auto-routing (default seed):**
- Amount tier: ≤$15K → PM auto-approves; $15K–$50K → PM proposes, Exec approves; >$50K → Exec approval with rationale.
- Category override: any Library item flagged "exec-review" (custom fabrication, high-risk networking, specialty equipment) routes to Exec regardless of amount.
- Project flag override: projects flagged "Strategic" or "Executive-watch" route all POs through Exec regardless of amount or category.

**Context:** User requires flexibility to match business model and cashflow; values aren't stable across AV integrators (margin floors, deposit customs, PM maturity all vary). Admin-editable thresholds let the business tune without dev work.

**Alternatives considered:** Fixed hardcoded values (rejected — rigid, every business-model change becomes a ticket). Owner-only edit authority (rejected — Finance owns cashflow and payment logic, blocking them from threshold edits creates a bottleneck). Unlimited edit authority without step-up (rejected — a misclick on "PM ceiling: $15M" would be catastrophic).

**Consequences:** Threshold values live in a `business_thresholds` config table with versioning and audit, similar to `permission_grants`. Admin UI at `/admin/thresholds` (Owner + Finance). Changes apply to *new* transactions only; in-flight approvals remain governed by the threshold version in effect when the approval was initiated (captured at request time). Segregation-of-duties rule (approver can't also be payer) is a code-level invariant, not a configurable threshold.

### 2026-04-18 — Data retention

**Decision:** Audit log indefinite. Archived records (tasks, notes, superseded revisions) 7 years + admin-reviewed soft-purge option. Customer update artifacts (PDFs/DOCs) kept permanently. No hard per-project file storage cap; alert at 5GB per project.
**Context:** Internal AV-integrator business records benefit from long retention (IRS norms ~7 years; warranty and litigation windows often overlap). Audit log storage is cheap and the forensic value is high. Regenerate-from-source for customer artifacts is fragile across template and data drift.
**Alternatives considered:** 7-year audit cap (rejected — small marginal savings, significant loss of long-term forensic value). Metadata-only for customer artifacts (rejected — fragile). Hard per-project storage cap (rejected — creates blocking friction; alerts give visibility without blocking).
**Consequences:** Storage growth is bounded by customer artifact generation + file uploads; at 10–20 users and project velocity, likely ≪ 10GB/yr. Alert mechanism needed at 5GB per project — one new Phase 1 backlog item. Soft-purge workflow required for archived records (ops surface that flags records past 7 years for admin review before removal).

### 2026-04-18 — Product scope

**Decision:** Room SKU system **in v1** with editable builder (Ops Admin + Design Engineer). Engineering trigger is manual (no auto-rules). Playbooks in-app editable by Ops Admin. Service/warranty in v1 limited to Gate 12 record creation; ticketing/SLA/scheduling in v1.5.
**Context:** User pulled Room SKU into v1 because it pairs naturally with Estimation — SKUs drive BOM generation, standard labor, and infrastructure requirements, and having them in v1 prevents needing to retrofit Estimation later. Engineering routing was simplified because the business wants human judgment, not auto-rules. Playbooks as in-app editable reduces dev cycles for ops refinements.
**Alternatives considered:** Room SKU deferred to v1.5 per SPEC §18 (rejected — user wants it v1). Auto-engineering trigger rules (rejected — business prefers manual routing). Developer-authored playbooks (rejected — ops-editable reduces tickets for every workflow refinement). Full service/warranty v1 (rejected — scope cost not justified pre-pilot).
**Consequences:** Room SKU adds ~3–4 weeks to Phase 3 (schema + builder UI) and ~2 weeks to Phase 4 (Estimation consumption). Seed doc at `docs/room-skus.md` defines the shape. Engineering trigger absence means `lib/authz/` adds DE to projects only via manual assignment — no auto-trigger logic. Playbook editor is a Phase 4 deliverable (structured markdown-ish form editor). v1.5 scope now contains: full service module, offline field support, integrated redline/annotation, Room SKU AI suggestions.

### 2026-04-18 — UX strategy

**Decision:** Responsive web (mobile-first layouts) for Technician + PM + Warehouse in v1. Desktop-first for other roles with graceful responsive fallback. PWA deferred to Phase 3 enhancement (~1 week when added). Native apps deferred indefinitely. Offline support deferred to v1.5. Photo upload: simple upload + server-side thumbnails + tap-to-zoom in v1; integrated redline/annotation deferred.
**Context:** Technicians, PMs, and Warehouse staff operate away from desks — phone-first access is a real productivity win. PMs specifically need mobile access to dashboard (blocked/late/at-risk), pending approvals, and customer update drafting. Warehouse needs mobile receiving + damage logging + staging updates. Solo maintainer cannot sustain a second (native) codebase, and offline-sync correctness is weeks of work with uncertain ROI until a real connectivity-blocked site appears.
**Alternatives considered:** Technician-only mobile-first (rejected — user expanded scope). Native app (rejected — solo maintenance cost). PWA in v1 (rejected — manifest + service worker carry edge cases; adds Phase 1 complexity without clear v1 benefit). Integrated redline in v1 (rejected — distinct product surface that pairs with Phase 5 AI; premature).
**Consequences:** Design work expands from one role's mobile layout to three. Playwright test matrix gets mobile viewports for TL/TU, PM, and WH roles. Label printing (Warehouse) stays desktop (hardware dependency). PWA upgrade becomes a Phase 3 backlog item. Offline support and integrated redline land in the v1.5 backlog alongside the full service module.

### 2026-04-18 — Seed documents approved as v0

**Decision:** [docs/rbac-matrix.md](../docs/rbac-matrix.md), [docs/gates.md](../docs/gates.md), and [docs/room-skus.md](../docs/room-skus.md) approved as v0 seeds without redlines. These become the initial-deploy seed data for `permission_grants`, `gate_definitions`, and `room_sku` tables respectively. Subsequent edits flow through in-app admin UIs.
**Context:** Seeds are defaults, not contracts — runtime editability (per RBAC architecture decision) absorbs business-specific adjustments. User is explicit that v1 will go through many revisions before MVP; getting seeds "close enough" is correct, not "perfect."
**Consequences:** Closes role-to-permission mapping, gate requirements, and Room SKU structure open decisions. Scaffold phase unblocked. Seed files remain source-of-truth *only* at initial deploy; they are **not** synchronized with runtime state post-launch — the runtime DB is the truth and seed files become reference documentation.

### 2026-04-18 — Build posture: ship, don't polish

**Decision:** v1 target is MVP, not polish. Many revisions expected between first deploy and production-ready state. Optimize build choices for speed-to-feedback and reversibility over first-pass correctness.
**Context:** User explicitly stated they are not looking to make everything perfect for v1. Expecting iterative refinement based on real usage.
**Consequences:** Prefer pragmatic defaults over exhaustive deliberation. Avoid premature optimization, unused abstractions, or "nice to have" polish in Phase 1–3 scaffolding. Ship minimum viable scaffold that meets PHASES.md exit criteria; defer hardening work until evidence of need. Acceptable tradeoffs: rough UI in early phases, minimal seed data, manual workarounds where automation isn't urgent. Non-negotiable even under this posture: the trusted-core rules in CLAUDE.md (auth, money, audit, snapshots, permissions) — MVP discipline cannot excuse shortcuts on those.

### 2026-08-22 — Multi-tenancy is structural, not deferred

**Decision:** Reach AV is the AV vertical of a multi-tenant product. Every table carries tenant scope from its first migration. Supersedes the single-business framing in the original `CLAUDE.md` ("internal business operating system for an AV integrator... ~10–20 users").
**Context:** Reach's architecture is trade-specific verticals sharing a common core — see `docs/principles.md` Principle 6. Tenancy is what makes the trade layer possible and cannot be retrofitted cheaply. `prisma/schema.prisma` is currently 96 lines and two models, so the cost of adding tenancy now is near zero and rises with every model Phases 2 and 3 add. This is the most time-critical item in the build.
**Alternatives considered:** Single-tenant now, refactor before launch (rejected — the refactor's cost scales with the data model, and every migration written in the interim would need rewriting). One single-tenant instance per customer (rejected — recreates the multiple-environments problem the product exists to end, and multiplies operational surface per customer).
**Consequences:** Tenancy goes in before the next schema commit. `Profile` and `AuditEvent` both gain tenant scope, and the RLS pattern established there is followed by every subsequent table. Requirements throughout `SPEC.md` are reclassified as the AV trade layer rather than one business's configuration; a re-audit of `SPEC.md` against the principles is a Phase 2 prerequisite. Business-rule thresholds (2026-04-18) were already designed as admin-editable seeded defaults, which is tenant-layer by construction — that decision needs no revision.

### 2026-08-22 — Tenancy enforcement: application authz plus RLS

**Decision:** `lib/authz/` remains the enforcement point for every business rule — roles, segregation of duties, sensitive fields, approval authority. Row-level security is added for one thing only: a tenant can never read another tenant's rows. Prisma connects as a non-superuser role with tenant context set per request.
**Context:** Prisma typically connects through a pooled role that bypasses RLS entirely, so application-layer authorization and RLS are not interchangeable and the repo currently has only the former. A bug in business-rule authorization is a permissions defect — recoverable and embarrassing. A bug in tenant isolation is a cross-customer data leak, which is the one class of failure a multi-tenant product does not survive. That specific boundary earns a second enforcement layer that does not depend on application code being correct.
**Alternatives considered:** Application authz alone (rejected — tenant isolation would depend on no query ever forgetting a scope filter, forever). RLS alone (rejected — the hybrid RBAC/ABAC model in SPEC §8 does not express cleanly in policies, and moving it there scatters business rules across two layers). RLS for all authorization (rejected — same reason, and it makes the rules materially harder to test).
**Consequences:** Defence in depth at exactly one boundary and nowhere else. Prisma connection role and per-request tenant context are Phase 2 work — cheap now, expensive once the data model exists. Every migration must ship its policy; CI should eventually assert that no table lacks one. Verification of isolation must query as the other tenant, not read the policy.

### 2026-08-22 — A project is instantiated by commitment, not billability

**Decision:** Architectural rule 2 amended. Every commitment the business takes on gets a Project Card — billable work, warranty, rework and goodwill alike. Billability is a sufficient trigger, not a necessary one.
**Context:** The rule read "every billable action... attaches to a Project Card." This file already contradicted it: the 2026-04-18 threshold decision records service and warranty work as net-30 with no deposit, so warranty work exists in the model, is not billing-gated, and under the original rule might never get a card. A system that instantiates on billing can only report revenue. Instantiating on commitment is what lets it report cost — including the cost of work that never billed, which is the difference between what a job appeared to make and what it actually made.
**Alternatives considered:** A lighter ticket or service-call entity for unbilled work (rejected — it moves unbilled cost outside the project model, breaks the single-dataset invariant, and makes every job look more profitable than it was). Leaving the rule as written (rejected — it contradicted an existing decision in this file).
**Consequences:** Warranty and goodwill work instantiate the same container as a sold job. Later work against an existing commitment attaches to that commitment's Project Card rather than opening a new one. No `NOT NULL` on fields that may be unknown when work is taken on — a record opens before it is complete. See `docs/principles.md` Principles 2 and 8.

### 2026-08-22 — Product doctrine enters the repo as `docs/principles.md` and `docs/product-model.md`

**Decision:** The ten principles, the core/trade/tenant layer model and the adjudication sequence live in the repository as `docs/principles.md`. What Reach *is* — the container model, brand architecture, and Reach AV's position as the first vertical — lives as `docs/product-model.md`. Both are mirrors of a private doctrine record maintained outside this repository: amendments are authored there, dated, and mirrored here, never edited here first. The repo copies are authoritative for the repo; divergence beyond the omitted provenance material is a defect.
**Context:** The principles are the document the change-adjudication pipeline runs against, and `principle-check` cannot adjudicate against a file that is not present. `docs/principles.md` referenced `docs/product-model.md` before it existed, leaving a broken pointer in the governing document. Provenance, IP and derivation material is deliberately excluded — this repository will eventually be read by contributors, vertical partners and possibly counsel, and it gets product specification only.
**Alternatives considered:** Keep doctrine outside the repo and reference it (rejected — agents cannot read what is not in the working tree, and "read from memory of it" is exactly the failure the principles forbid). Copy the doctrine record wholesale including provenance (rejected — carries material that has no business in a shared repository). Merge the two files into one (rejected — one holds what may not change and the other holds what is; collapsing them makes the invariants harder to cite in an argument).
**Consequences:** `principle-check` reads `docs/principles.md` on every invocation. `README.md` and `CLAUDE.md` both lead with the doctrine files. Architectural rules 11–14 added to `CLAUDE.md`, carrying Principles 3, 4 and 8 into the enforced rule list where rules 1–10 did not already cover them. Any principle amendment is a mirror operation plus a dated entry here.

### 2026-08-22 — Repository framing: Reach AV, not an internal tool

**Decision:** `README.md` reframed to match `CLAUDE.md`. This repository is Reach AV — the audio-visual vertical of Reach, a multi-tenant product of Reach Systems, LLC — not an internal operating system for one AV integrator. The 10–20 users at $5–10M/yr shape describes a *tenant*, and the requirements throughout `SPEC.md` are the AV trade layer.
**Context:** `CLAUDE.md` was reframed in the multi-tenancy decision above; `README.md` was not, and still opened "Internal operating system for an AV integrator." README is the other front door — for contributors, partners and anyone reading the repository cold — and a repo whose two entry documents disagree about what is being built will produce work that splits the difference.
**Alternatives considered:** Leave README as an internal-facing summary (rejected — there is no internal-only audience for a product repository, and the framing was the specific error being corrected).
**Consequences:** Both entry documents now state the multi-tenant framing and point at the doctrine files first. `SPEC.md` has not yet been re-audited against the principles under the new framing — it is 915 lines written single-tenant, and that survey remains a Phase 2 prerequisite.

### 2026-08-22 — Tenancy and identity: one global identity, per-tenant membership

**Decision:** A **tenant is a business**, not a business-and-trade pairing. One dataset per business. Identity splits in two: a single global `Identity` (1:1 with the Supabase auth user, unique on email across the platform) and one `Membership` row per tenant that identity belongs to. **Role is carried on the membership, not on the identity** — the same person can hold different roles in different businesses. `Profile` as currently modelled is replaced by this pair.

**Context:** Finding 3 of the 2026-08-22 schema audit: `profiles.email` is globally unique and `profiles.id` is pinned 1:1 to `auth.users.id`, so a person can belong to exactly one business. Finding 2: `Role` is a Postgres enum in the core schema, which puts tenant-layer configuration in code. Both resolve into the same restructure, which is why they are decided together. A multi-trade business — AV plus low voltage plus security under one roof — is a **first-class case, not an edge case**: it is one tenant, one dataset, one customer record shared across its trades. Modelling the trade into the tenant key would fragment that customer record across three tenants and break Principle 4 at the foundation.

**Alternatives considered:** Tenant-scoped identity, one user row per business (rejected — a person working across two tenants would hold two credentials, two MFA enrolments and two password resets; and the platform could never recognise them as the same human). Tenant = business + trade (rejected — fragments one business's dataset across trades, duplicates the customer record, and makes cross-trade work a reconciliation problem, which is the failure the product exists to end). Role on the identity (rejected — a person is not the same seniority everywhere, and it makes role a global fact about a human rather than a fact about their relationship to one business).

**Consequences:** `Role` stops being a Postgres enum. Membership role references a tenant-scoped roles table seeded from `docs/rbac-matrix.md`, so a tenant can add or rename a role without a migration — roles are tenant layer, which is configuration, not code. Email uniqueness is global on `Identity`; nothing else in the schema is unique across tenants. Every other table carries `tenant_id` and its RLS policy from its first migration. `lib/authz/` resolves permissions from the active membership rather than from a profile column. **Invite flow must return an identical response whether or not the email already exists anywhere in the platform** — with global identity, a differing response is a cross-tenant enumeration oracle that reveals who else uses Reach. Same status code, same body, same timing envelope, same visible copy; the difference is which email is sent, and only the mailbox owner learns it. Audit authorship binds to the identity, which is never deleted — see finding 4.

### 2026-08-22 — Trade layers: subdomain selects the layer, entitlement gates it, session holds the tenant

**Decision:** The platform is `reach-systems.app`; trade layers are subdomains — `av.`, `elec.`, and so on. **The subdomain selects the active trade layer. It never selects the tenant and never scopes the data.** A tenant carries an **enabled-trades list** set at provisioning, and access to a trade is a **permission in the existing admin-editable RBAC matrix**, granted per role at `/admin/roles` and nested under that list: the admin UI only offers trades the tenant has, and the runtime check consults both. The session cookie is scoped to `.reach-systems.app` so one login spans every subdomain. **The active tenant lives in the server session and is never accepted from the client**; switching tenant re-derives permissions server-side.

**Context:** With tenant decoupled from trade (decision above), something has to select which trade layer is active for a given screen, and a subdomain is the cheapest selector that survives bookmarking, link sharing and browser history. It must not carry authority: a subdomain is client-supplied, and any design where the URL determines whose data is returned is one crafted request away from a cross-tenant read. Trade access as an RBAC permission rather than a new mechanism follows 2026-04-17 — the matrix already exists, is admin-editable with step-up auth on weakening, versions every change and emits an audit diff. A second parallel entitlement system would be a second place a fact can live (Principle 4).

**Alternatives considered:** Tenant-per-subdomain (rejected — reintroduces trade-keyed tenancy through the URL, and makes the customer record subdomain-dependent). Active tenant in a client-readable cookie or the URL (rejected — client-supplied tenant scope is the cross-tenant leak that RLS exists to make unsurvivable; a second enforcement layer is worthless if the first hands the attacker the key). Trade entitlement as its own subsystem outside the matrix (rejected — Principle 4, and it would need its own audit, versioning and step-up story that the matrix already has). Billing-driven entitlement (rejected for v1 — no billing subsystem exists; the enabled-trades list is set at tenant provisioning and revisited when billing lands).

**Consequences:** Middleware resolves the trade layer from the subdomain and the tenant from the server session, independently — neither derives from the other. A request for `av.reach-systems.app` by a member whose tenant does not have AV enabled, or whose role lacks the AV permission, is denied by the same deny-by-default path as any other authorization failure and emits `AUTHZ_DENIED`. Cookie scoped to `.reach-systems.app`, `Secure`, `HttpOnly`, `SameSite=Lax`. Tenant switching is a server action that re-derives the permission set and emits an audit event; it never trusts a client-sent tenant id. `docs/rbac-matrix.md` gains a trade-access permission row per role, and the seed pattern changes accordingly. RLS policies scope on the session tenant, never on the subdomain. **No billing subsystem in v1** — enabled trades are provisioning-time state, and the open question of how entitlement and billing relate is deferred, not answered.
