# Reach — product model

What Reach is, what the container is, and how the verticals relate. `docs/principles.md`
holds what it may not stop being; this file holds what it is.

Read both before any structural work.

---

## What Reach is

A workflow system targeting workflow gaps in small businesses, with trade industry
businesses as the primary target — not exclusively.

The thesis is an analytical observation about how businesses of this size operate. Across
multiple businesses and multiple system stacks, the same pattern held: a business of this
size runs on roughly thirty tools to execute a workflow that could be collapsed into a
handful of steps. Different companies, different software, the same structural failure.
Reach exists to be that collapse.

The thesis dates to 2017 and has not changed since. That constancy is a signal — it has
survived years of contact with real operations, and it was not derived from any single one
of them.

## The name

*Within reach.* Everything the business has ever produced, retrievable from wherever you
happen to be standing — literally and metaphorically.

The name is the design principle, not branding. Any feature that puts something further
away has failed the test. This is Principle 1.

## The container

**Every commitment is a project.**

The container is the paper file — the pattern offices have used for as long as there have
been offices. A job starts, a file opens, everything related to it goes in the file.
Nothing about the model needs teaching, which is the point.

Three rules follow, and they are rules rather than features:

1. **Taking work on is the instantiation trigger.** If the business took it on for someone,
   it is a project — billable or not. Warranty, rework and goodwill instantiate the same
   container as a sold job. No discretion, no judgement call about whether something merits
   a record. This is what keeps work from living in email, and it is what makes cost
   visible rather than only revenue. (Principle 2.)
2. **Data lives with the project for its entire life** — from generation through closeout
   and archive. No migration to an archive system, no "that's in the old system."
   Retrievability years later is the actual use case. (Principle 3.)
3. **Every entity is a lens onto the same data.** CRM, projects, inventory, scheduling,
   calendar, action items, invoicing — a web of systems that all funnel back to the project
   level, cross-referenced in every direction. (Principle 4.)

Standing at a customer shows every project done for them, everything purchased, every hour
spent, every dollar invoiced. Standing at a building shows what is installed and who
governs it. One dataset, many entry points — not many datasets requiring reconciliation.

**This is the distinction from project management software.** Project management tools
manage projects. Reach makes the project the index for the entire business.

## Brand architecture

**Reach Systems** is the parent, named for extension rather than for a single product.

The product line is trade-specific branded versions sharing a common core — Reach AV, Reach
Low Voltage, Reach Security, Reach Electrical, and so on. Each is tailored to the workflows
of that trade.

This is a product architecture decision, not a naming one. It is why multi-tenancy matters
more than it would for a single-vertical product, and it informs every structural decision
in this repository.

**There is no trade-agnostic version of Reach and none is planned.** Each vertical is built
for its trade. What holds them together is the set of foundational principles in
`docs/principles.md`, which do not change across verticals. (Principle 6.)

## Reach AV is this repository

**Reach AV is the first product** — built first because it is the trade with the deepest
domain knowledge already in hand. It is not a pilot for a generic core. It is the product.

A tenant is an AV integration business, typically 10–20 users at $5–10M/yr. The requirements
throughout `SPEC.md` were drawn from operating a business of that shape. They are the **AV
trade layer**, not one customer's configuration.

Everything in this repository sits in one of three layers:

| Layer | Varies by | Changed by |
|---|---|---|
| **Core** | Nothing. Invariant. | Written amendment only |
| **Trade** | Vertical — Reach AV, Reach Electrical | Building that vertical, once, with its domain partner |
| **Tenant** | Business, within a trade | Configuration. No code. |

Values that vary between integrators — margin floors, deposit customs, approval ceilings,
status labels, templates, branding — are **tenant configuration**, never hardcoded. The
adjudication sequence in `docs/principles.md` is how a request is placed in a layer.

## Expansion

Each new trade is built with a domain partner brought in for expertise, compensated with
equity rather than cash, through a structured discovery engagement. Expect several partners
per trade rather than one — different operators work differently, and a single perspective
produces a single operator's tool.

**What this means for the code.** The trade layer must be a real seam, not a convention. A
second vertical arrives as its own layer over the same core, and the core does not
generalise to accommodate it — generalising a trade model instead of building that trade's
layer is a Principle 6 violation and the specific way a vertical product dies.

Partner requests will arrive that sound reasonable and would alter what Reach is. The
principles are what make that distinction arguable rather than a matter of opinion between
equity holders. Run the adjudication sequence; the question is never whether a request is
reasonable, it is which layer it lives in.

## What is not decided here

Feature scope, interface design, roadmap sequence, pricing and business model live in
`SPEC.md`, `PHASES.md` and `DECISIONS.md`. This file and `docs/principles.md` constrain
those decisions; they do not make them.
