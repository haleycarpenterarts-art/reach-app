# SPEC.md — Functional specification

This is the canonical functional description of the application. It is the source of truth for what the system does. Operational rules for *how* to build it live in `CLAUDE.md` and the skills under `.claude/skills/`.

---

## 1. Purpose

The application is the internal operating system for an AV integrator business. It serves as a single source of truth across the full lifecycle of a job — from lead capture through estimating, engineering, purchasing, field execution, closeout, training, and ongoing customer relationship management.

Two architectural principles govern everything:

- **Every billable action lives inside a Project Card.** The Project Card is not a summary page; it is the living environment in which a project is created, updated, executed, changed, and closed out.
- **The Library is the controlled master database** for devices, equipment, pricing, standards, and reusable system templates. Projects consume from the Library; they do not duplicate master data internally.

---

## 2. System layers

The data model has three layers.

| Layer | Purpose | Primary records |
|-------|---------|-----------------|
| Master data | Reusable source-of-truth entities shared across the business | Companies, Contacts, Sites/Locations, Vendors, Library Items, Standards |
| Project environment | The operational center for every billable initiative | Project Cards, Project Parties, Milestones, Decisions, Changes |
| Transaction / artifact records | Events, files, financials, and execution records tied to a project | Notes, Documents, Drawings, BOMs, POs, Equipment, Invoices, Training Logs |

All billable work, project execution, and change history attach to a Project Card. Reusable business entities live outside projects and are referenced by them.

---

## 3. Core record types

- **Project Card** — the operational environment for every billable initiative. Contains scope, linked parties, status, decisions, documents, costs, and history.
- **Company** — any business entity connected to the system: end customers, GCs, brokers, architects, consultants, referral partners.
- **Contact** — a person attached to a Company and optionally linked into projects in specific roles.
- **Site / Location** — the physical place where project work occurs; connected to Companies and Projects.
- **Vendor** — supplier or manufacturer connected to Library records, purchase activity, and project fulfillment.
- **Library Item** — master record for equipment, pricing, categories, standards, and approved selections.
- **Project Note** — a dated project-linked note; can remain informational or be elevated into a decision, issue, task, or change.
- **Decision Record** — formalized decision with timestamp, source, impacted scope, and approval history.
- **Change Record** — structured item representing a scope, product, labor, schedule, or field change affecting cost, ordering, drawings, or billing.
- **Document / Drawing** — controlled project artifact with version history and issue status.
- **Purchase Order** — procurement record linked to project scope, vendor, and specific revision states.
- **Invoice** — billing record tied to project milestones, approved work, or changes.

---

## 4. Relationship rules

The model is relational, not modular silos.

- A Project Card links to many Companies; each Company links to many Project Cards.
- A Project Card links to many Contacts; each Contact can serve different roles on different projects.
- A Project Card links to one or many Sites/Locations depending on project structure.
- A Project Card references many Library Items, but Library Items remain master records outside the project.
- A Project Card links to many Vendors through equipment selection, purchasing, or support.
- Notes, decisions, drawings, documents, equipment selections, POs, invoices, and change items always attach to a Project Card — they do not exist as unscoped standalone records.

---

## 5. Project Card

### Purpose

The primary workspace for the business. Living environment, not a summary.

### Required sections

Every Project Card includes at minimum:

- Project summary, scope, current phase
- Linked companies and contacts with role labels
- Linked site/location records
- Lead and proposal origin
- System direction and room standards in use
- BOM and equipment selections pulled from the Library
- Notes and activity timeline
- Decisions and approvals
- Changes and change-order status
- Drawings and project documents
- Purchasing status and linked POs
- Invoice and billing status
- Milestones, schedule, and responsibility ownership
- Margin, cost, and financial summary
- Training, closeout, and support records
- Assistant/copilot panel for search, summarization, and workflow support
- **Customer section** (see §11)

### Governing rules

- Every billable action requires a Project Card.
- Every project-affecting note must be promotable into a structured decision, issue, task, or change.
- Every major decision is timestamped and linked to the approving person or party.
- Every official project artifact carries version and status history.
- All reporting rolls up from linked records rather than manual summaries.
- Role-tailored views prioritize the information and actions relevant to that role; different roles see different layouts of the same card (see §8 Governance).

---

## 6. Library

### Purpose

Canonical master database for products, equipment, pricing, standards, and reusable design logic. Sits above projects and feeds them.

### Contents

- Products / SKUs
- Equipment categories
- Manufacturer and vendor links
- Cost and target sell price
- Standard labor assumptions
- Room-type templates
- Standard system packages
- Approved alternates and substitutions
- Versioned standards by system family
- Infrastructure requirements tied to room types

### Library Item data model (commercial + technical)

Each Library Item exposes enough data to support estimating, submittals, and diagram generation:

- Manufacturer, model number, product category
- Cost, target sell price / MSRP if stored
- Vendor links, lead times
- Physical dimensions, weight
- VESA pattern (for applicable displays)
- Physical I/O ports (input, output, control, network)
- Audio signal types, video signal types, USB roles
- Power requirements, mounting notes
- Customer-facing product description
- Engineering / submittal description
- Approved alternates
- Standard package associations
- Device type and functional role
- Signal-flow behavior rules
- Compatible accessory relationships
- Preferred upstream and downstream pairings

### Library rules

- Projects select from the Library whenever possible instead of free-typing equipment.
- Pricing changes in the Library update future estimating logic but preserve project-side snapshot history once proposals are issued.
- Standards are versioned so teams can identify which project used which standard set.
- Online product-data lookup is supported, but proposes Library updates for review rather than silently overwriting master data.

---

## 7. Project lifecycle (phases)

Each phase defines required feature sets and the operational risks it addresses. Transitions between phases are governed by gates (see §9).

### 7.1 Lead capture and relationship management

Lead capture stays slim while preserving relational context.

- Simple priority buckets: Active Priority, Qualified, Nurture, Archive/Disqualified.
- Fast lead creation with minimal required fields.
- Relationship links between customers, brokers, GCs, architects, referrals, and contacts.
- Immediate owner assignment and next action date.
- Conversion path from lead into a Project Card lifecycle.
- Activity timeline and note capture linked to all associated parties.
- Once qualified, the lead evolves into a Project Card rather than creating disconnected downstream records.

### 7.2 Sales and scope definition

Establishes a clean project foundation before estimating begins.

- Room list builder tied to standard room types.
- System direction flags (standard family, design path selection).
- Scope notes tied to customer, GC, architect, and site relationships.
- Budget expectation capture.
- Discovery meeting records.
- Structured handoff into estimating.

*Risks addressed:* vague scope entering estimating; decisions held in memory; no durable record of why a design path was chosen.

### 7.3 Estimating

Converts approved room structure and standards into a clean BOM, labor model, and proposal package. See §12.1 for the full Estimation sub-application spec.

*Risks addressed:* guessing outside standards; missing infrastructure; proposal versions drifting from pricing and design assumptions.

### 7.4 Design and engineering

Engages only where complexity justifies it; produces build-ready technical outputs.

- Trigger logic for when engineering is required.
- Signal flow and architecture records.
- DSP and control configuration records.
- Drawing packages: elevations, rack layouts, wiring diagrams.
- Design decision log with timestamps and approvers.
- Revision control and issue status for all drawings.
- Distribution log showing what the field should treat as current.

*Risks addressed:* engineering pulled into simple work; design rationale not recorded; outdated drawings causing field confusion.

### 7.5 Project handoff

A governed phase gate, not a conversation.

- Handoff checklist.
- Scope confirmation against current approved revision.
- Equipment and BOM confirmation.
- Schedule readiness review.
- Site readiness review.
- Known-risk register.
- Assigned owners for next-phase actions.
- Project summary generated from current Project Card state.

*Risks addressed:* poor verbal handoff; rework from hidden assumptions; loss of intent between design and execution.

### 7.6 Purchasing

Operates from approved project records and revision-controlled BOMs.

- Approved-to-order BOM state.
- Vendor selection from linked records.
- PO generation tied to specific BOM revision.
- Lead-time tracking.
- Substitution request and approval flow.
- Delivery timing coordination with project schedule.
- Purchasing audit trail.

*Hard rule:* Equipment cannot be ordered until a deposit invoice has been sent (see §9 Gates).

### 7.7 Receiving and inventory

Verifies what arrived and ties it back to project and PO.

- Shipment receiving against PO lines.
- Damage and shortage logging.
- Project staging status.
- Inventory location status.
- Serialized / controlled item tracking where needed.
- Exceptions routed back to PM and purchasing.

### 7.8 Project management

Unifies scope, schedule, budget, labor, communication, and change processing.

- Milestone tracking.
- Budget and labor tracking.
- Change tracking tied to impacts on cost, drawings, schedule, and billing.
- Communication log.
- Field issue routing.
- Customer / GC coordination log.
- PM dashboard summarizing risk, status, and cost exposure.

### 7.9 Pre-wire

Executes against current field instructions; captures deviations immediately.

- Current issued drawings for field use.
- Pre-wire checklist by room and location.
- Deviation capture.
- Trade coordination notes.
- Photo documentation.
- Issue escalation back into the Project Card.

### 7.10 Staging

Converts ordered gear into field-ready assemblies with traceability.

- Rack build / staging checklists.
- Labeling standards and verification.
- Firmware and configuration prep log.
- Equipment readiness status.
- Packout and deployment log.
- Link to commissioning prerequisites.

### 7.11 Installation and finishing

Executes against standard methods, current project records, and documented exceptions.

- Install task lists by room / system.
- Field notes and progress updates.
- Standard compliance checklists.
- Punch item logging.
- Final finish checklist.
- Photo record of completed work.

### 7.12 Commissioning

Proves the system works as designed and produces a durable record of what was configured, tested, and accepted.

- Commissioning checklist by system type.
- DSP and platform configuration log.
- Test result logging.
- Deficiency and issue tracking.
- Programming / version archive.
- Ready-for-client status gate.

### 7.13 Closeout and billing

Connects punch resolution, documentation, and final billing.

- Punch list completion tracking.
- As-built and O&M package assembly.
- Final invoice generation.
- Change-order billing reconciliation.
- Client signoff records.
- Closeout checklist.

### 7.14 Training and customer success

Training is a formal deliverable.

- Training session log.
- Attendance and stakeholder tracking.
- Standard quick-start materials.
- Customer questions and follow-up notes.
- Support handoff summary.
- Opportunity flagging for future upgrades or service.

---

## 8. Governance and user rights

### Objectives

- Protect sensitive commercial, financial, and personnel data.
- Enforce least-privilege access by default.
- Tailor UI to each role's real operational needs.
- Support approval workflows and segregation of duties for sensitive actions.
- Limit project visibility to assigned users and stakeholders.
- Maintain audit history for access-sensitive and financially significant actions.

### Hybrid access model

Role-based broad permissions + attribute-based final access. Access decisions evaluate:

- User role
- Project assignment or relationship to the project
- Record type
- Requested action (view, create, edit, approve, archive, export)
- Data sensitivity
- Workflow stage / gate status

### Permission layers

- Platform (admin settings, user management, audit tools)
- Module (Library, Estimation, Purchasing, Invoicing, Scheduling, Documents)
- Record (Project Card, Task, Note, PO, Invoice, Drawing, Change)
- Field (cost, margin, labor rate, approval data, internal notes)
- Action (create, edit, approve, issue, archive, export, delete)

### Rights categories

View · Create · Edit · Approve · Archive · Export/Share · Admin override.

A user may have view access without edit, or edit without approve. Sensitive workflows never assume the same user can initiate, approve, and finalize the same business event.

### Base user roles

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

### Project assignment states

In addition to base role:

- Project owner
- Assigned lead
- Assigned contributor
- Read-only stakeholder
- Temporary support
- No project access

Visibility is normally limited to assigned projects, approved support queues, or explicitly granted read-only access.

### Role-tailored Project Card views

Rendered layouts, not disabled-section layouts.

- **Executive:** portfolio metrics, risk, margin, approvals, project health.
- **PM:** schedule, tasks, labor, changes, purchasing, field status, required approvals.
- **Design / Estimation:** room structure, BOM, Library links, scope, revisions, drawing outputs.
- **Finance:** invoices, deposits, billing milestones, collections, cost controls.
- **Technician:** today's tasks, site access, onsite contacts, room-specific install notes, simplified field drawings, pull lists, time entry, issue logging, photo uploads.

### Technician view (mobile-optimized)

Prioritizes: today's tasks, site/location info, onsite contacts, room install notes, simplified drawings, materials for assigned work, punch/issue lists, time entry, progress updates, photo and markup upload.

Restricts: proposal history, cost, margin, vendor pricing, invoice status (beyond field-relevant holds), internal management and finance notes.

### Sensitive field governance

These fields carry field-level visibility rules even when the surrounding record is visible:

- Cost, margin, labor rate
- Compensation-related data
- Internal management notes
- Approval rationale
- Commercial terms

### Segregation of duties (examples)

- Same user cannot both approve a purchase and approve the related payment.
- Same user cannot both receive inventory and finalize vendor payment authorization.
- A technician submits field issues or change candidates but does not approve commercial disposition.
- An estimator prepares pricing; approval may require PM, manager, or executive review by threshold.

### Audit and deletion

- Tasks and notes archive, not silently delete.
- Financial records never hard-delete in normal operation.
- Approval actions log user, date, and decision.
- Permission changes record in an access audit trail.
- Sensitive exports are logged.

---

## 9. Gates, triggers, and stage transitions

A gate is a controlled transition that validates required fields, files, approvals, and readiness before allowing a Project Card or sub-process to advance. A stage does not advance simply because a user selects a new status.

### Gate definition

Each gate defines:

- Entry stage and target stage
- Required fields
- Required files / artifacts
- Required approvals (by role)
- Blocking exceptions
- Automatic triggers and notifications
- Decision outcomes: Go, Hold, Rework, Reject

### Gate classes

Lead qualification · Discovery complete · Estimate ready · Proposal issue · Award/contract · Deposit received or deposit invoice sent · Purchasing release · Install readiness · Commissioning readiness · Substantial completion · Closeout · Warranty / service handoff.

### Billable-action gating (hard rules)

- Equipment cannot be ordered until the deposit invoice has been sent and internal release conditions are satisfied.
- Vendor payment cannot be approved until invoice review and matching are complete.
- Certain design revisions cannot be released as billable work until a change or approval record exists.
- Purchasing release may require an approved BOM revision and commercial authorization.

### Procurement and payment controls

- Purchase request / release authorization.
- PO approval routing by amount, category, or project.
- Goods receipt logging and receiving confirmation.
- Invoice intake and coding.
- Matching logic between PO, receipt, and invoice where relevant.
- Payment approval separate from ordering authority.

### Trigger behaviors

- Proposal issued → create approval tracking and follow-up tasks.
- Awarded project → create PM handoff checklist and kickoff tasks.
- Deposit invoice sent → allow purchasing release workflow.
- Approved BOM revision → enable PO creation against that revision.
- Install readiness passed → release technician scheduling and field task packages.
- Closeout passed → launch training, service, and warranty records.

### Failed gates

On failure, the system displays a readable list of missing fields, files, records, or approvals and allows the user to move the item into Hold or Rework with visible reasons. Never silently block.

### Approval matrix

Defined by transaction type, project phase, and monetary thresholds. Specific thresholds are **open decisions** (see `DECISIONS.md`). Structurally:

- PM approval up to a defined purchasing threshold.
- Executive approval above threshold or for margin exceptions.
- Finance approval for invoice release and payment authorization.
- Design lead approval for engineering package issue.
- Customer approval record required for certain scope or commercial changes.

---

## 10. Simplification principles

### Default / common exception / rare escalation

Design workflows around the happy path. Surface the common exception when it occurs. Reserve escalation for high-impact events.

### Simplified status model

Visible statuses across tasks, approvals, stages, and records:

**Draft · Ready · Approved · In progress · On hold · Complete**

Additional technical states may exist underneath for automation, but users operate within this short list unless a module truly requires specialized states.

### Standardization over customization

- One universal task object across modules.
- One core status model wherever applicable.
- One approach to approvals, holds, and rejection handling.
- One Project Card section layout style per role.
- One style of gate validation messaging.

### Minimize required input

Each gate or operational step requires only the minimum fields needed to advance. Everything else is optional, suggested, inferred, or deferred.

### One question per screen

Each primary screen answers one main operational question:

- Technician: *What do I need to do now?*
- PM: *What is blocked, late, or at risk?*
- Design: *What requires technical decision or revision?*
- Finance: *What can be billed, collected, or released?*
- Executive: *Where is schedule, margin, or customer risk emerging?*

### Hide advanced logic until needed

- Basic task creation is quick-add; advanced edit is secondary.
- Gate failures show short missing-items summary first; deeper diagnostics on demand.
- Technician views default to action-first screens.
- Escalation controls appear only when an exception qualifies.

### Sparse, meaningful approvals

Approvals concentrate on high-impact transitions, commercial risk, standard deviations, and controlled releases. Ordinary operational updates do not require approval.

### Formalize only what changes execution

A note remains a note until it changes scope, cost, schedule, customer commitment, ownership, or execution behavior — then it's elevated into a structured task, decision, change, approval, or gate.

### Customer success as the evaluation filter

Simplification succeeds when it improves delivery consistency, reduces missed commitments, and makes it easier to execute reliably for customers. Not just when the internal workflow feels cleaner.

---

## 11. Customer communication and the Customer section

Each Project Card includes a Customer section that serves as the controlled home for customer-facing progress communication.

### Customer section contents

- Primary customer contacts and communication preferences.
- Customer touchpoint schedule.
- History of customer updates sent.
- Selected update type templates.
- Open customer-facing risks or notices.
- Upcoming milestones relevant to the customer.
- Training and handoff communication records.

### Touchpoints

Standardized, phase-triggered, not ad hoc:

- Award / onboarding update
- Deposit and project-start confirmation
- Pre-install planning update
- Active installation progress update
- Commissioning / training coordination update
- Closeout and handoff update
- 30-day follow-up or support check-in

### Generated customer updates

Produced in PDF or DOC format using current Project Card data + curated input from Account Manager, PM, and Field Team.

**Update types:**

- Executive summary
- Weekly project update
- Milestone update
- Installation progress update
- Issue / delay notice
- Training and handoff summary
- Closeout summary

**Content rules:**

- Project name and summary.
- Current stage or milestone.
- What has been completed.
- What is happening next.
- Notable schedule items.
- Open customer-relevant risks, blockers, or decisions needed.
- Notes from AM, PM, and Field Team as selected for customer visibility.

**Never included:** margin, internal notes, vendor pricing, unresolved internal commentary.

### Communication governance

Not every user can issue customer-facing updates. Not every internal note is eligible for inclusion. Templates, source sections, and approval requirements are governed by role and workflow stage.

---

## 12. Sub-applications

### 12.1 AI-assisted Estimation application

A major sub-application within each Project Card. Table-oriented, Library-driven, revision-controlled. Writes directly into the Project Card. Consumes the Library. Passes outputs into engineering, purchasing, handoff, and billing.

Not an isolated estimating tool.

#### Capabilities

- Build project structure inside the Project Card.
- Create rooms, room groups, area hierarchy.
- Generate a BOM tied to Library records.
- Apply labor logic and infrastructure requirements.
- Draft proposal scope language and customer-facing output.
- Generate engineering notes and submittal support data.
- Maintain revision history across estimate, proposal, and BOM states.

#### Internal modules

Estimate Setup · Room Builder · BOM Table · Pricing and Margin · Scope Writer · Proposal Generator · Engineering Notes and Submittals · Version Compare · Product Lookup and Library Sync · AI Copilot Panel.

#### Hierarchy

| Level | Purpose |
|-------|---------|
| Project | Top-level estimate container inside the Project Card |
| Area / Floor / Zone | Optional grouping layer |
| Room | Primary estimating unit |
| System / Package | Standardized design package tied to Library logic |
| BOM line items | Equipment, accessories, infrastructure, labor |
| Output artifacts | Proposal, room summary, engineering notes |

#### BOM table columns

Line number · Parent level or room · Item type · Library item ID · Manufacturer · Model · Description · Qty · UoM · Unit cost · Unit sell · Extended cost · Extended sell · Margin · Vendor · Lead time · Included/optional/alternate status · Engineering note · Procurement note · Install note · Revision status.

#### Core workflow

1. Create or open a Project Card-linked estimate.
2. Build project hierarchy (areas, floors, rooms).
3. Apply room standards and package logic from the Library.
4. Generate BOM line items from selected standards and templates.
5. Apply labor, complexity, infrastructure, and site-condition logic.
6. Use AI assistance to detect missing scope, draft language, suggest structures.
7. Generate proposal output and engineering / submittal notes.
8. Preserve issued revision snapshots; compare later revisions against them.

#### AI-assisted behaviors

- Convert rough scope notes into project and room structure.
- Suggest room templates from known project types.
- Recommend Library items based on standards and room logic.
- Detect missing infrastructure or likely scope gaps.
- Draft proposal scope language.
- Draft engineering and submittal notes.
- Flag estimate inconsistencies and incomplete selections.
- Summarize estimate revisions.

Constraint: AI accelerates but remains subordinate to structured data. It does not generate scope or product assumptions autonomously.

#### Version control

- Estimate revision number, proposal revision number, BOM revision number.
- Pricing snapshot at issue date.
- Change summary between revisions.
- Historical revision archive.
- Current working vs. issued state.
- Flag when Library pricing changed after proposal issue.

#### Online product lookup

Manufacturer product pages, official spec sheets, MSRP (if available), dimensions/weight, VESA, I/O ports, power and mounting details, reference links, last-verified dates. Lookups propose Library updates for review rather than silently overwriting.

### 12.2 Schematic Diagram application

Project Card-integrated sub-application tied to rooms, BOM items, and Library technical data. Generates AI-assisted system drawings from structured device definitions, I/O signal flow, and engineering notes.

**Core principle:** the canvas is not the source of truth. The schematic is a rendered expression of structured project, room, BOM, and Library data with controlled project-specific overrides.

#### Capabilities

- Room-level and system-level signal flow diagrams.
- Device connectivity maps.
- Rack and system connectivity logic.
- Engineering notes and connection annotations.
- Customer and GC submittal outputs.
- Synchronized with estimate and BOM revisions.
- Ties to a Project Card or to a lead-stage opportunity when early diagramming is required.

#### Source-of-truth hierarchy

| Data element | Source of truth |
|--------------|-----------------|
| Project structure | Project Card |
| Rooms and room roles | Estimating / project structure layer |
| Devices and pricing | Library |
| Selected equipment for the job | BOM / estimate revision |
| Device I/O definitions | Library technical schema |
| Engineering notes | Library plus approved project-specific overrides |
| Diagram layout | Diagram application |
| Connection logic | BOM + Library I/O rules + approved engineering overrides |

#### Integration rules

- A device does not appear unless it exists in the project BOM, project design package, or approved lead-stage concept set.
- Device labels inherit from Library data and project naming standards.
- Connection points inherit from the Library I/O schema.
- Room and system groupings inherit from the Project Card structure.
- Diagram revisions tie to estimate, BOM, and document revision states.
- Manual overrides are permitted but logged as project-specific exceptions.

#### Diagram modes

- Concept (early lead-stage and conceptual)
- Signal flow (engineering logic)
- Rack connectivity (staging and build)
- Submittal (customer and GC communication)
- Field (simplified installation reference)

#### AI-assisted behaviors

- Suggest first-pass signal flow.
- Auto-place standard devices by room and system type.
- Recommend connection paths using Library I/O definitions.
- Draft annotations and engineering notes.
- Detect likely missing devices or signal breaks.
- Flag mismatches between room type, BOM, and drawing logic.
- Summarize revision differences between diagram issues.

#### Validation

- Validate each rendered device against Library schema before drawing.
- Validate connections against allowed signal and port types.
- Show lineage for each diagram object back to room, BOM line, Library item, and revision.
- Log every manual override.
- Alert when the BOM changes after a diagram was issued.
- Require review before applying AI-regenerated updates.

#### UI direction

- Left panel: project rooms, systems, hierarchy.
- Center canvas: generated diagrams.
- Right panel: selected device properties, ports, notes, overrides.
- Change/diff panel: impacts from estimate or BOM revisions.

---

## 13. Low-input, high-inference data capture (Ingest)

### Core principle

*Capture once, infer the rest.* Users capture information once as notes, emails, meeting transcripts, uploads, or quick text entries. The system infers structured records — tasks, decisions, changes, follow-ups — with minimal additional input.

### Entry points

- Meeting records (agenda, notes, transcripts)
- Project notes inside Project Cards
- Pasted email threads or customer/GC communications
- Uploaded documents: RFPs, RFIs, punch lists, marked-up PDFs
- Field reports and daily logs
- Quick-add text entries (one-line notes)

### Inferred task metadata

For each extracted candidate task, the system infers:

- Task statement
- Suggested owner (by role, speaker, or addressee)
- Suggested due date (from phrases like "by Friday", "before rough-in")
- Task type (design, estimate, coordinate, order, install, review)
- Billable vs. non-billable likelihood
- Related project (current Project Card by default)
- Related room or area
- Related BOM or Library item
- Priority (from modifiers like "urgent", "blocker", "ASAP")

### Defaulting

- Owner: current user, PM for PM-type tasks, design engineer for engineering tasks.
- Project: current Project Card.
- Room: last referenced room in the session if not explicit.
- Billable: non-billable unless language clearly indicates out-of-scope work.
- Due date: offset from current date or next relevant milestone if no natural-language cue.
- Task type: inferred from verbs and project phase context.

All defaults are visible and easily overridable.

### Meeting-driven accountability loop

When a new meeting is created for a project, the system:

- Surfaces open tasks from previous related meetings.
- Highlights overdue items associated with the same project or stakeholder group.
- Extracts new actions, decisions, and change candidates from the latest notes or transcript.
- Links each extracted item back to its originating meeting for traceability.

### Guardrails

- AI-generated metadata is editable suggestion, not locked field.
- Users can mark specific notes or meetings as "no extraction".
- A "this suggestion is wrong" action feeds back to improve extraction quality.
- The system provides simple rationale for suggestions where feasible ("assigned to PM because this is a schedule coordination item").

### Ingest-first project setup

Project setup supports an ingest feature allowing users to upload source documentation (emails, PDFs, Word docs, images, spreadsheets) for automated parsing and structured record creation. Ingest classifies documents, extracts relevant data, attaches source artifacts to the Project Card, and proposes structured outputs (contacts, addresses, rooms, BOM clues, milestone dates, tasks, decisions, risk items) for review.

---

## 14. Cross-phase features

### 14.1 Decisions and approvals

Structured records, not freeform notes.

- Decision record type
- Approval status and timestamp
- Linked parties and approving roles
- Impact flags for scope, cost, purchasing, schedule, field execution
- Audit trail

### 14.2 Change management

- Convert note into change request.
- Cost and schedule impact analysis.
- Routing for approval.
- Automatic creation of downstream tasks.
- Billing flag if recoverable.
- Link to revised documents and purchasing actions.

### 14.3 Version control

Synchronized revision history across proposals, BOMs, pricing snapshots, drawings, and field-issued documents.

- Revision numbers and status
- Current approved version marker
- Superseded version archive
- Change summary between versions
- Controlled issue / distribution history

### 14.4 Embedded digital assistant

A relational project copilot, not a generic chatbot.

**MVP capabilities:**

- Natural-language search across structured and unstructured project records.
- Project summary generation.
- Change and decision summary generation.
- Missing-data and mismatch detection.
- Draft handoff summaries, tasks, change recommendations.

**Guardrails:**

- No direct approval authority.
- No silent edits to official records.
- No pricing or PO changes without human confirmation.
- Permission inheritance from the user's app role.
- Logged audit trail for assistant-driven actions.

---

## 15. Operations playbooks (lightweight SOP layer)

The platform includes a thin Operations Playbooks layer that translates architecture into repeatable execution patterns. Playbooks are not long SOP manuals; they define default path, common exceptions, and rare escalations for high-value flows.

### Priority playbooks

- Lead → proposal → award
- Award and deposit → purchasing release
- Purchasing → receiving → install readiness
- Field issue → change evaluation → execution
- Commissioning → closeout → warranty handoff
- Customer communication and update cadence throughout lifecycle

Each playbook describes: objective · default path · common exceptions · rare escalations · role ownership · trigger points · expected system actions · simple timing / service targets where appropriate.

### Continuous improvement loop

Inputs flow into one or more destinations:

- Library improvements
- Room SKU logic improvements (when that layer is implemented)
- Gate and approval rule refinements
- UI simplification opportunities
- Playbook updates
- Customer communication template improvements

Review cadence: monthly or quarterly for most operational refinement; urgent issues handled immediately when they affect customer outcomes, financial risk, or repeated execution failures.

---

## 16. Immediate pain points this system targets

- Too much operational knowledge residing in individual memory rather than durable project records.
- Notes and changes not being captured in a way that reaches the field or becomes orderable and billable work.
- Design choices not being timestamped or tied to the approving party.
- Versioning challenges across proposals, pricing, drawings, and construction execution.
- Weak information continuity across handoffs between sales, estimating, engineering, PM, purchasing, field teams, and closeout.

---

## 17. Design intent summary

A synchronized business operating platform, not a collection of disconnected tools. It preserves organizational knowledge, formalizes approvals and changes, connects every billable action to a Project Card, and uses the Library as the stable master database for devices, equipment, pricing, and standards.

Intended outcomes: improved proposal delivery, better field clarity, stronger timeline control, better customer experience, and stronger profit protection through controlled data relationships and project-centered execution.

---

## 18. Deferred / future scope

- **Room SKU system:** a future layer that will standardize room logic, estimating behavior, BOM generation, and engineering outputs. The current design is built to key off the Room SKU structure once integrated, but does not depend on it for v1. Do not block current work on Room SKU definition.
