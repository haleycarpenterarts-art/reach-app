# Room SKUs — Room-type templates in the Library

Draft 2026-04-18. Defines the Room SKU layer that drives BOM generation, standard labor, and infrastructure requirements for Estimation. Feeds SPEC §6 (Library), §12.1 (Estimation), and §18 (previously-deferred Room SKU system, now in v1).

## Status — this file is a seed

Runtime Room SKU records live in Postgres tables (`room_sku`, `room_sku_version`, `room_sku_line`) and are edited via the Library admin UI (Ops Admin + Design Engineer). The seed below defines the shape; changes go through the in-app editor after initial deploy.

See DECISIONS.md 2026-04-18 — Product scope.

---

## What a Room SKU is

A **Room SKU** is a versioned template for a room type. It bundles:

- Expected equipment lines (references to Library items, with quantities and roles)
- Standard labor assumptions (hours, phase breakdown)
- Infrastructure requirements (power, network, structural, HVAC)
- Design signal flow (v1: captured as structured notes; full signal-flow auto-gen is Phase 5)
- Installation standards (field-facing notes)
- Customer-facing description language
- Tags (room type, complexity tier, intended customer segment)

Room SKUs **sit inside the Library** — they are master data, not project data. Projects *consume* Room SKUs by selecting a template when adding a room; the selection generates a project-local **Room Instance** that the estimator can then customize.

## Relationship to existing Library concepts

SPEC §6 already mentions "Room-type templates" and "Standard system packages" as Library contents. Room SKUs formalize these: rather than free-form templates, they have a schema, versioning, and structured consumption by Estimation.

- **Library Items** remain the atomic master records (specific products, SKUs, cost, specs, I/O, etc.).
- **Room SKUs** are compositions — ordered collections of Library Items plus labor, infrastructure, and design logic.
- **Standard system packages** inside a Room SKU are the sub-groupings (e.g., "display package", "audio package", "control package") — structural groupings inside a Room SKU, not separate records.

---

## Schema

### `room_sku` (identity record)

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Human-readable, unique per tenant |
| description | text | Short internal description |
| customer_description | text | Proposal language — what the customer sees |
| room_type | text | Controlled vocabulary (Conference, Huddle, Training, Boardroom, Auditorium, Theater, Bar, Pool, Golf Simulator, Lobby/Signage, Other). Ops Admin extends the vocabulary. |
| complexity_tier | text | Simple / Standard / Complex — drives engineering-trigger conversations |
| tags | text[] | Free tags for filtering |
| current_version_id | uuid | Points to active version |
| status | text | Draft / Active / Deprecated |
| created_by, created_at, updated_by, updated_at | standard audit columns | |

### `room_sku_version` (versioned content)

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| room_sku_id | uuid | FK to `room_sku.id` |
| version_label | text | `v1.0`, `v1.1`, etc. Semantic-ish: minor bump for non-breaking edits, major for schema changes or line-item changes that invalidate snapshots |
| status | text | Draft / Active / Deprecated |
| labor_hours | decimal | Total default hours |
| labor_breakdown | jsonb | `{pre_wire: h, install: h, commission: h, training: h}` |
| infrastructure_requirements | jsonb | Structured list: `[{type: "power", detail: "2×20A dedicated circuits"}, {type: "network", detail: "4×Cat6A drops"}, ...]` |
| design_notes | text | Engineering-facing (signal flow intent, DSP defaults, control logic) |
| install_notes | text | Field-facing (mounting standards, cable labeling, termination specs) |
| effective_from, effective_to | timestamptz | Effective dating for audit |
| created_by, created_at | standard audit columns | |

### `room_sku_line` (equipment lines inside a version)

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| room_sku_version_id | uuid | FK |
| position | int | Ordering within the SKU |
| library_item_id | uuid | FK to Library master record |
| qty | decimal | Default quantity |
| uom | text | Unit of measure (each, ft, pair) |
| role | text | Display, Camera, Mic, DSP, Control, Cable, Mount, Accessory, Rack, Labor-line, Infrastructure |
| optional_status | text | Included / Optional / Alternate |
| alternate_group | text | Group identifier if this line is one of several alternates |
| notes | text | Per-line install/engineering note |

---

## Who edits

**Ops Admin + Design Engineer** have create/edit/version authority via the Library admin UI. Publishing a new version (Draft → Active) requires both roles to sign off for Complex-tier SKUs; Ops Admin alone can publish Simple and Standard tiers.

RBAC matrix cells (in [docs/rbac-matrix.md](rbac-matrix.md) §2 Library) apply. Edits are admin-configurable per the RBAC architecture.

---

## Lifecycle

```
Draft → Active → Deprecated
  ↑       ↓
  └─ Archive (hard deprecate; versioned history preserved)
```

- **Draft:** editable, not selectable by projects.
- **Active:** selectable by new projects. Single Active version per `room_sku.id` at a time.
- **Deprecated:** not selectable by new projects; existing project Room Instances that referenced this version remain valid (via snapshot).
- **Archive:** SKU itself is retired. No new versions accepted. Historical references preserved.

Creating a new version:
1. Ops Admin or DE clicks "New version" on an Active SKU → copies current content to a Draft.
2. Edit equipment lines, labor, infrastructure, notes.
3. Publish: Active version flips to Deprecated, new version becomes Active. `effective_from` set on new; `effective_to` set on prior.
4. Audit event emitted with diff.

---

## Project consumption

When an Estimator adds a room to a project:

1. **Select Room SKU** — search/filter by `room_type`, `complexity_tier`, `tags`.
2. **System generates a Room Instance** on the project, stamped with `(room_sku_id, room_sku_version_id, version_label)` — the snapshot reference.
3. **Equipment lines copy into the project BOM**, preserving Library item references. Line-level edits at the project level are allowed and logged as deviations from the SKU template.
4. **Labor, infrastructure, and notes populate** the room's section of the estimate.
5. **Project-level overrides** (swap an item, change a qty, add an extra line) are tagged "deviation" and show in the revision comparison and in gate reports.

### Deviation tracking

Every override from the SKU template is captured with:
- Who made the change
- When
- What changed (field-level diff)
- Why (free-text note — optional but encouraged)

Gate 3 (Estimate Ready) surfaces all deviations per room for Estimator + PM review before proposal issue. Deviations are *not* blocking — they inform, not prevent.

---

## Snapshot behavior (version drift)

The core rule: **a project using Room SKU `X` version `v1.2` stays on `v1.2` forever unless the project explicitly updates.**

When Room SKU `X` is updated to `v1.3`:
- New projects selecting `X` get `v1.3`.
- Existing Room Instances on `v1.2` continue to reference `v1.2`. Pricing, labor, and scope captured at that snapshot remain authoritative for that project.
- An "Update to latest version" action on the Room Instance pulls `v1.3`'s changes, shows a diff (added/removed/changed lines), and requires estimator confirmation. On confirm, the Room Instance re-stamps to `v1.3` and deviations are recomputed against the new template.

This mirrors SPEC §6 Library pricing rules: Library price changes flag on subsequent revisions but do not mutate issued snapshots.

---

## v1 scope and deferrals

**In v1:**
- Full CRUD of Room SKUs with versioning
- Ops Admin + DE editor UI (visual builder)
- Project consumption → BOM generation
- Deviation tracking
- Snapshot + update-to-latest flow
- Integration with Estimation (Phase 4)

**Deferred to Phase 5:**
- AI-assisted "suggest the right Room SKU for this scope note"
- AI-assisted "detect missing equipment relative to the selected Room SKU"
- Full signal-flow auto-generation from the SKU's device roles

**Deferred to v1.5:**
- Multi-SKU stitching (combining two Room SKUs into a single project room — e.g., "Boardroom + A/V recording")
- SKU derivation / inheritance (base SKU + customer-specific overrides as a child SKU)

---

## Admin UI surface

Phase 3 deliverable:
- `/library/room-skus` — list view with filters (type, tier, tags, status)
- `/library/room-skus/:id` — detail with version history
- `/library/room-skus/:id/versions/new` — version editor (visual equipment-line builder, labor/infra/notes editors, save as Draft, publish to Active)
- `/library/room-skus/:id/deviations` — cross-project report: where has this SKU been customized, and how?

The deviations report is particularly valuable — it surfaces patterns ("every conference room instance overrides the DSP line" → the SKU default is wrong).

---

## Open items for the Room SKU spec

- **Room type vocabulary:** starter list above (Conference, Huddle, Training, etc.) — Ops Admin can extend. Seed with ~10 common AV types at initial deploy.
- **Labor breakdown granularity:** proposed phases are pre-wire / install / commission / training. If your business tracks finer breakdowns (e.g., separate "termination" phase), let me know.
- **Unit of measure vocabulary for equipment lines:** default list or user-configurable?
- **Whether `complexity_tier` drives any automation** (beyond the Complex-tier dual-signoff on publish). Candidate: surface as a filter on "Which projects probably need design engagement?"
- **Migration path for legacy "standard system packages"** referenced in SPEC §6: if you have existing templates anywhere, they become Room SKUs on first import. If starting clean, no migration needed.
