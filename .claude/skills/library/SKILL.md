---
name: library
description: Use whenever working with the Library — product/SKU records, pricing, standards, room-type templates, system packages, vendor links, approved alternates, or product-data lookup. Also use when building any feature that pulls items from the Library into a project, or that proposes Library updates from external product pages.
---

# Library

The Library is the canonical master database for products, equipment, pricing, standards, and reusable design logic. See `SPEC.md` §6 for the full spec.

## Core rules

- Projects *consume from* the Library. They do not duplicate its records internally.
- Projects reference Library Items by ID; they do not copy Library fields into project rows except as snapshots on issued revisions (see `trusted-core` skill).
- Free-typing equipment in a project is a last resort, not a default. The UI should make Library selection the easy path.

## Library Item data model

Each Library Item carries enough data for estimating, submittals, and diagram generation:

### Commercial
- Manufacturer, model number, product category
- Cost, target sell price / MSRP (if stored)
- Vendor links, lead times
- Approved alternates
- Standard package associations

### Physical
- Dimensions, weight
- VESA pattern (for applicable displays)
- Mounting notes
- Power requirements

### Technical (required for diagram support)
- Device type, functional role
- Input ports, output ports, control ports, network ports
- Audio signal types, video signal types, USB roles
- Signal-flow behavior rules
- Compatible accessory relationships
- Preferred upstream and downstream pairings

### Documentation
- Customer-facing product description
- Engineering / submittal description
- Reference links and last-verified date

## Standards and room templates

The Library also contains:

- Room-type templates (what equipment typically goes in a boardroom, huddle room, classroom, etc.).
- System / package definitions (standardized design packages tied to room types).
- Standard labor assumptions per item or package.
- Versioned standards by system family.
- Infrastructure requirements tied to room types.

Standards are versioned. Every issued project captures which standard version it used so you can tell later which job used which standard set.

## Pricing lifecycle

- Library prices update freely on the master record.
- Library price updates flow through to *drafts* (current working estimates).
- Library price updates do *not* mutate issued snapshots. Issued proposals, BOMs, and pricing snapshots carry their pricing forever.
- When a draft revision is compared to an issued revision, the system flags line items where Library pricing has moved since issue.

## Online product lookup

Lookups from manufacturer pages or spec sheets produce *proposals for Library updates*, not silent overwrites.

Lookup targets:
- Manufacturer product pages
- Official spec sheets
- MSRP or list price (if available)
- Dimensions, weight, VESA, I/O ports, power, mounting details

Each lookup result is staged for review with a reference link and a `last-verified` timestamp. An authorized user accepts the update before it mutates the Library.

## What triggers a Library change event

Emit an audit event on:
- New Library Item created.
- Cost or target sell price changed.
- Approved alternate added or removed.
- Standard package definition changed.
- Standard version published.

## Permissions

Library writes are a privileged action. See `governance` skill for the specific role grants. Typical: Estimator and Design Engineer can propose Library updates; Ops Admin or Design Lead approves.

## What not to build

- A "project Library" separate from the master Library. There is one Library.
- Inline Library data pasted into a project row (other than snapshot fields on issued revisions).
- A lookup flow that directly writes to the Library without a review step.
