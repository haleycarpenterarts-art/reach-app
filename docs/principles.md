# Reach — foundational principles

The invariants. What is true of every Reach vertical, in every tenant, at every
stage of the product's life.

`docs/product-model.md` holds what Reach *is*. This file holds
what it may not stop being. Its specific job is to make one distinction
arguable rather than a matter of opinion between equity holders: **a change
that belongs in a trade's layer, versus a change that alters what Reach is.**

Read it before agreeing to a change with a vertical partner, before a
structural decision in the repo, and before accepting a feature request that
sounds reasonable.

Last revision: 2026-08-22

*This file is a mirror of a private doctrine record maintained outside this repository.
Amendments are authored there, dated, and mirrored here — never edited here first. The
provenance and derivation material is deliberately not reproduced; see **Provenance** below.*

---

## The layer model

Every difference anyone will ever ask for lives in one of three layers. Naming
the layer is the first move in any disagreement, because it converts "should we
do this" into "where does this go" — and most requests resolve there.

| Layer | Varies by | Changed by | Examples |
|---|---|---|---|
| **Core** | Nothing. Invariant. | Written amendment only | The project container, the universal primitives, single dataset, lifetime residence, the perspective shift |
| **Trade** | Vertical — Reach AV, Reach Electrical | Building that vertical, once, with its domain partner | Status vocabulary, entity types, document types, estimate structure, field workflows, compliance artefacts |
| **Tenant** | Business, within a trade | Configuration. No code. | Status labels, margin targets, payment schedules, roles and permissions, templates, branding |

Most requests resolve in the tenant or trade layer, and resolving them there is
the normal outcome rather than a concession. The burden falls only on changes
that reach the core: those go through amendment, and they do not get made
because the request was reasonable and the meeting was long.

---

## What is fixed and what moves

The principles are fixed. Very little else is, and the difference is easy to get
backwards.

The foundation — a project as the container, one dataset, many lenses, the same
place every time — is not an AV idea. It holds for any business that manages
work, which is effectively any business. Verticals exist because the
*expression* of that foundation has to be native to the trade: its vocabulary,
its sequence, its artefacts. Principle 6 governs expression. It is not a claim
that the underlying model is narrow.

**"That's not how we do it" is expected input.** It will come from customers and
from vertical partners, and it is usually correct about their operation. The
methodology is not settled and is not meant to be — it developed out of one
business and will keep developing as it meets others. What is settled is the
frame the answer has to fit inside.

So the response to that sentence is a solution, not a defence. The work is
finding the version of what they need that satisfies the principles — and where
none exists, naming which principle is in the way and why, rather than treating
the request as a mistake.

**Refusing an implementation is never refusing the need.** A core violation
means *not like that*. The need still stands, and answering it is the obligation
the refusal creates.

---

## The principles

One to six govern structure — what the container is and who it is for. Seven to
ten govern records: how they come into being, and how they stay true.


### 1. Within reach

Everything the business has ever produced, retrievable from wherever the user
happens to be standing.

**What follows.** Retrievability is the product, not a feature of it. Depth of
navigation is a cost, always. The measure of any screen is how few moves it
takes to reach the thing you came for.

**What it forbids.** Any change that puts something further away. This holds
even when the change is otherwise good — a cleaner information architecture
that adds a step has failed the test, and the test is the name.

### 2. Every commitment is a project, billable or not

The business takes work on; the work gets a container. Sold jobs, warranty
visits, rework, goodwill and internal work all instantiate the same one.
Billability is the most common reason a project exists. It is not the reason the
project is the container.

**Why the project is the container.** A project is the unit at which the
business made a commitment to someone. Everything generated in service of that
commitment — hours, material, documents, decisions, correspondence, cost,
revenue — belongs to it, for the life of the record. Money is one of the things
that attaches to a commitment. It is not what brings the commitment into
existence, and a system that waits for it is blind to everything happening
before and after.

**What this differentiates.** A system that instantiates on billing can only
ever report revenue. Reach instantiates on work, so it can report **cost** —
including the cost of work that never billed. Warranty and goodwill are
precisely the work every other system loses, and they are the difference between
what a job appeared to make and what it actually made. *Standing at a customer
shows every project, every hour, every dollar* is only true if the unbilled
hours got a container too.

**What follows.** The trigger stays mechanical — work taken on for a named party
is a project, with no judgement about whether it merits a record. Unbilled work
is a first-class project, not a lesser one. Later work against an existing
commitment attaches to that project rather than opening a new one: a warranty
visit on an installed job lives on that job's project, not on a new record.
Billing is a lens onto the project (Principle 4), never its cause.

**What it forbids.** An invoice-triggered record. Discretion about whether work
deserves a project. And most specifically: a separate lightweight ticket,
service-call or task entity created to hold unbilled work outside the project
model — that is Principle 4's second dataset wearing a different hat, and it is
how the cost picture gets broken in the name of convenience.

### 3. Data lives with the project for its entire life

Generation through closeout through archive. The same place, permanently.

**What follows.** Retrievability years later is the actual use case, not an
edge case to handle after launch. Archive is a state of a project, never a
destination it moves to.

**What it forbids.** Migration to an archive system. A separate historical
store. "That's in the old system." Any lifecycle point at which data leaves
the project.

### 4. Every entity is a lens onto one dataset

Items, inventory, categories, customers, locations, addresses, invoices,
quantities, hours. Every business collects the same primitives. What varies by
trade is the language wrapped around them and the workflow they move through —
never the primitives themselves.

CRM, projects, inventory, scheduling, calendar, action items and invoicing are
not seven systems. They are seven positions to stand in, looking at one dataset.
Standing at a customer shows every project, purchase, hour and dollar. Standing
at a building shows what is installed and who governs it. Standing at a project
shows all of it, scoped to the job.

**Why most businesses fail here.** Not for want of data — they have it. They
cannot shift perspective on it. The information needed to answer a question
exists somewhere in the business, but reaching it from where the question was
asked is either impossible or expensive enough that nobody does it. So the
question stops being asked, and the business runs on impression instead of on
what it already knows.

**What this differentiates.** In Reach the interface *is* the filter. Shifting
perspective is something the user does, in the moment they want it — not a
report they request, not a dashboard an administrator configures, not a query a
developer writes. They filter one dataset down to exactly what they want to see,
when they want to see it, from wherever they are standing. This is Principle 1
applied to the data rather than the navigation: a fact you cannot get to from
where you are is out of reach whether or not it is stored.

**What follows.** Entities are entry points, not databases. Adding an entity
means adding a view, and the work is in the relationships, not the storage. The
primitives are core, not trade layer — trade layers specialise them and name
them in the trade's language, they do not replace them. A vertical that appears
to need a new primitive is usually describing an existing one differently;
check that before building it.

**What it forbids.** A second copy of anything: a reporting or analytics store
that duplicates project data, an integration that mirrors records rather than
referencing them, any feature whose implementation introduces a reconciliation
step. If two places can disagree about a fact, the principle is already broken.

And any perspective that exists only because someone built it. If answering a
new question requires development work, the lens model has been implemented as
a fixed set of screens rather than as a filter over one dataset — which looks
identical on the day it ships and fails at the first question nobody
anticipated.

### 5. The paper file is the mental model

A job starts, a file opens, everything related to it goes in the file. Offices
have worked this way for as long as there have been offices.

**What follows.** Nothing about the container needs teaching, and that is the
point — it is the adoption argument and the reason the product survives contact
with people who did not choose it. Onboarding effort is a symptom, not a
deliverable.

**The same place, every time.** The structure of the file does not vary by
project, customer or scope. *Where do I find this* is answered once, for the
whole system, instead of asked again on every job. That invariance is what makes
the answer worth learning: a location that shifts by circumstance has to be
searched for each time, and searching is the thing people quietly stop doing.

**What it compounds into.** Invariant location is what turns retrieval into
routine rather than investigation, and routine is what drives operational
overhead down. A business where finding things is a task needs people to do that
task. A business where finding things is reflex runs the same volume of work on
less administrative labour, and keeps running it as volume grows. That is the
economic argument for Reach, and it is a second-order effect of the mental
model — not a feature that can be bolted on later to a structure people have to
think about.

**What it forbids.** Any structure that requires explaining before it can be
used. If the answer to "where does this go" is not obvious to someone who has
never seen the software, the structure is wrong, not the user. And any layout
that varies by job type, size or trade specialism — conditional placement
arrives as a convenience and takes positional invariance with it.

### 6. Every vertical is built for its trade

There is no trade-agnostic version of Reach and none is planned. Reach AV is the
product for AV, not a pilot for a generic core.

**Why not generic.** The generic option already exists and is well served. The
configurable-workspace category — Asana, Monday, ClickUp and the rest — hands a
business a broad, open-ended task system it can shape into something
Reach-shaped. Two things it cannot hand over: an operation end to end rather
than a task layer sitting on top of one, and a design produced by someone who
knows the trade.

Configuration moves the domain work onto the customer. That is how those tools
serve every industry — by serving none of them, and leaving each buyer to author
an operating model out of blank components. Most never finish. The half-built
result is what they end up running on.

**The standard, not a suggestion.** When Reach AV goes live it is not a proposal
for how an AV business might be run. It is how it is run. The workflow arrives
designed, by someone who has run it, and the customer adopts an operation rather
than authoring one. Configurable tools sell possibility; Reach sells a
settled answer.

Two other principles depend on this one. Positional invariance (Principle 5) is
impossible in a system each tenant structures for itself. Primitives named in a
trade's language (Principle 4) require a trade to name them in.

This principle is about expression, not about the reach of the underlying model
— see **What is fixed and what moves**.

**What follows.** Multi-tenancy is structural, not a late refactor — it is what
makes the trade layer possible. Domain expertise is bought per vertical, with
equity, because it cannot be bought cheaply and cannot be inferred.

**What it forbids.** "Just make it configurable." Generalising a trade-specific
model to serve two trades at once in place of building the second trade's layer.
Competing on flexibility or breadth of configuration — that is the incumbents'
strength, fought with their resources, in the flooded market the 2017 counsel
warned against.

This is the specific way a vertical product dies: each generalisation is
individually defensible, and the sum is project management software with no
reason to be chosen.

### 7. Data is captured once, at its source

Whoever produces a fact enters it, where and when it is produced. Nobody
re-keys it, transcribes it, or assembles a record afterwards out of someone
else's material.

**Why this is load-bearing.** Principle 5's overhead argument depends on it
entirely. If a record is built after the fact by an administrator working from
emails, photos and notes, then retrieval being reflexive saves nothing — the
labour moved upstream and grew on the way. Capture at source is what makes the
reduction real rather than relocated.

**What follows.** Field entry is not a convenience feature; it is where the data
comes from. The person closest to the work has the fewest steps between the fact
and the record, and that distance is the thing being minimised. Structured
capture at the point of work beats richer capture later, every time. The people
doing the work already close out daily — the system meets them there rather than
collecting from them afterwards.

**What it forbids.** Any workflow where a fact is produced in one place and
entered in another. Re-keying between Reach and anything else. A role whose job
is entering data other people generated — if that role is necessary, the capture
design failed.

### 8. A record opens before it is complete

A project is creatable the moment work is taken on, with whatever is known at
that moment. Gaps are normal output, not failed intake — and they are visible as
open questions rather than as empty fields.

**Why this is load-bearing.** Principle 2's trigger is mechanical only if nothing
blocks it. Required fields at creation turn the trigger back into a judgement:
people wait until they have enough to satisfy the form, and *wait until I have
enough* is exactly how work ends up living in email. A system that demands
completeness gets bypassed by whoever is under the most pressure — which is to
say by the people whose work matters most.

**What follows.** Incompleteness is a state the system represents, not an error
it rejects. An unanswered field is a tracked open question with a shape: who it
waits on, and what it blocks. This is also what makes Principle 10 possible —
the system cannot surface what is missing unless *missing* is something it can
hold.

**What it forbids.** Required fields at creation. Validation that prevents
saving. Silent blanks — a gap that looks identical to a fact nobody needed. And
any draft or pre-project state that holds real work outside the model until it
qualifies.

### 9. What was communicated cannot change

A record of what the business said to someone outside it is frozen at the moment
of saying, together with the inputs that produced it and the person who sent it.

Three forms of the same rule. A request captured verbatim is never edited,
paraphrased or summarised — interpretation is added beside it, never over it. A
proposal marked sent locks, along with the estimate behind it; the way back in is
to supersede it, not to revise it. A decision is recorded with its evidence and
its author.

**What follows.** Version history becomes an audit trail rather than a change
log: every number ever put in front of a customer survives exactly as they saw
it, with the working that produced it. Reconciliation, dispute and warranty all
depend on this, and all of them happen long after anyone remembers the detail.

**What it forbids.** Editing in place anything that has left the building.
Correcting a sent figure rather than superseding it. Paraphrasing someone's words
into the record. Any history that can be rewritten to be more accurate — accuracy
arrived at later is a different claim, and it belongs beside the original rather
than on top of it.

### 10. The system raises the condition

State that matters is surfaced by the system, not queried out of it. A user does
not have to know a question exists in order to be told the answer.

**Why.** Every operation has failure states that stay invisible until somebody
happens to raise them: work approved but never paid for, a schedule built and
never challenged, a lead time that exceeds dates already committed, a record
sitting in a status that means two different things. None of them announce
themselves, and all of them are trivially visible in the data.

**What follows.** Surfacing is the product's job, not the user's discipline. A
condition merely *available* to someone who goes looking has not been surfaced —
availability is what every system already offers, and it is precisely why the
failure states stay silent. This is the operative form of Principle 4: shifting
perspective answers the questions you thought to ask, and this answers the ones
you did not.

**What it forbids.** A design where knowing to look is the precondition for
knowing. Reports and dashboards as the mechanism for exception state — those
serve review, not detection. And any status whose meaning is ambiguous: where a
state can mean two things, the system asks which, rather than letting the
ambiguity sit and stretch.

## Adjudicating a change request

The sequence sorts a request into where it gets built. Most exit at step 2 or 3
with something to build. Run in order, stop at the first answer.

1. **Does it put something further away?** Fails Principle 1. No, regardless of
   what else it does.
2. **Can it be satisfied as tenant configuration?** Then it is configuration.
   Build it there and stop.
3. **Is it a real difference in how that trade works?** Then it is trade layer.
   Build it in that vertical. It does not touch core and it does not propagate
   to other verticals.
4. **Does it break an invariant?** Any yes is a core violation:

| Check | Principle |
|---|---|
| Work without a project, or unbilled work in a container that isn't one | 2 |
| Data leaving the project at any point in its life | 3 |
| A second place a fact can live, or a perspective that exists only because someone built it | 4 |
| Structure that needs explaining, or placement that depends on job type | 5 |
| Generalising a trade model instead of building that trade's layer | 6 |
| A fact re-keyed, or entered by someone other than whoever produced it | 7 |
| A record that cannot be opened until it is complete | 8 |
| Something already communicated that can later be altered in place | 9 |
| A condition the user must know to ask about | 10 |

Anything surviving all four steps is a genuine gap in these principles. That is
the amendment case, and it is rare enough to be worth writing down when it
happens.

A core violation ends the implementation, not the conversation. Step 4 says *not
like that*; it does not say the need was wrong. Go back to step 2 and find the
version that fits.

> The question is never whether a request is reasonable. Every request from a
> good partner is reasonable. The question is which layer it lives in.

---

## Failure modes these exist to prevent

Each of these arrives as a sensible decision made under time pressure, which is
why the principle needs to be written before the pressure.

- **Parity drift.** Adding features because competitors have them, until Reach
  is a project management tool that manages projects rather than the index for
  the business.
- **The archive escape hatch.** Old data slowed something down, so it moved. The
  use case that justifies the whole product is the one that got broken.
- **The reporting sidecar.** Analytics were awkward against the live model, so a
  second store appeared. Now there are two answers to every question.
- **The service-ticket sidecar.** Warranty and small callbacks felt heavy as
  projects, so a lighter entity was added to hold them. The unbilled cost left
  the model, and every job now looks more profitable than it was.
- **The fixed-screen lens.** The perspective shift shipped as a set of built
  views rather than a filter over the dataset. Indistinguishable on launch day;
  every unanticipated question becomes a development request.
- **Conditional placement.** Some job type didn't need a section, so it was
  hidden for that type. Location became circumstantial, retrieval went back to
  being a search, and the overhead it was supposed to remove came back.
- **The intake form that blocks.** Required fields at creation. People waited
  until they had enough to satisfy the form, and waiting is email.
- **The admin who keys it in.** Facts arrived by phone, email and paper and
  someone was hired to enter them. Overhead moved rather than fell.
- **The silent edit.** A sent figure was corrected in place instead of
  superseded. The audit trail now describes a conversation that never happened.
- **The dashboard nobody opens.** Exception state was made available rather than
  surfaced. Available is not seen, and the failure states stayed silent.
- **Email as the real container.** The trigger got a discretionary exception,
  and the work went back where it came from.
- **Configurable creep.** Two trades were served by one generalised model to
  avoid building a layer, and the product stopped being for anyone in
  particular. Its late form is competing on flexibility — arriving at the
  incumbents' game with none of their resources.
- **Structure that needs a manual.** The model got clever. Adoption became a
  training problem, and untrained users route around it.

---

## Amendment

A core principle changes only by written amendment: dated, with what it
replaces, and with the reasoning recorded at the time rather than
reconstructed later.

It never changes silently by implementation decision. If a build decision would
violate a principle and the build is right, the principle is amended **first**.
That sequence is the whole mechanism — it is what keeps this document alive
rather than decorative, and it is what makes an amendment a deliberate act
rather than a discovery made months afterwards in the code.

Trade and tenant layers need no amendment. That is what they are for.

---

## What these principles do not govern

Features, interface design, roadmap sequence, pricing, or business model. Those
are decisions, and they live in `DECISIONS.md` and `PHASES.md`. A
principle that starts describing what to build next has stopped being a
principle.

---

## Provenance

These principles were derived from operating a real AV integration business over
a period of years, and refined against it. The derivation, the sources each
principle came from, and the record of what is owned by whom are maintained
outside this repository and are deliberately not reproduced here.

What matters inside the repo: Principles 1 and 3 are long-settled. Principles 2,
4, 5, 6 and the whole of 7 through 10 were written or substantially revised in
August 2026 and carry material the earlier product documents do not — see the
**Amendment log**.

The layer model, the adjudication sequence, the failure modes and the amendment
clause are constructed. They are the mechanism rather than the doctrine, and
they are the part to push back on.

---

## Amendment log

**2026-08-22 — Principle 2.** Replaces *"Everything billable is a project;
billability is the instantiation trigger."*

Billability is a sufficient trigger, not a necessary one. Warranty, rework and
goodwill are commitments the business honours without billing, and an
invoice-triggered record cannot see them — which breaks the cost picture the
lens model promises. The no-discretion property of the original is preserved:
the trigger moved from *is it billable* to *did we take work on for someone*,
and both are answerable without judgement.

Product model updated to match. Raised by Haley.

**2026-08-22 — Principle 4, expanded.** Statement unchanged.

Added: the universal primitives — items, inventory, categories, customers,
locations, addresses, invoices, quantities, hours — placed in the **core** layer
rather than the trade layer, on the grounds that every business collects the
same ones and only the language and workflow around them vary. Added the failure
mode the principle exists to answer: businesses hold the data but cannot shift
perspective on it, so the question stops being asked. Added the differentiator:
the interface is the filter, and the perspective shift is a user action at
runtime rather than a report, a configured dashboard or a developer query.

Consequent forbid: a perspective that exists only because someone built it.
Layer model core row and adjudication step 6 updated to match. Raised by Haley.

**2026-08-22 — Principle 5, expanded.** Statement unchanged.

Added the mechanism underneath the adoption claim: the file's structure does not
vary by project, customer or scope, so *where do I find this* is answered once
for the whole system rather than per job. Added what that compounds into —
invariant location turns retrieval into routine, routine drives operational
overhead down, and the same volume of work runs on less administrative labour as
it grows. Recorded as a second-order effect of the mental model rather than a
feature, since it cannot be added later to a structure people have to think
about.

Consequent forbid: layouts that vary by job type, size or trade specialism.
Adjudication step 7 and the failure-modes list updated to match. Raised by
Haley.

**2026-08-22 — Principle 6, expanded.** Statement unchanged.

Added the reasoning for the invariant. The generic option already exists in the
configurable-workspace category, which can be shaped into something Reach-shaped
but cannot supply an end-to-end operation or a design made by someone who knows
the trade — because configuration moves the domain work onto the customer, which
is how those tools serve every industry by serving none. Added the positioning
that follows: Reach AV is not a suggestion for how an AV business might be run,
it is the standard, and the customer adopts an operation rather than authoring
one. Recorded the dependency both ways — Principles 4 and 5 are not achievable
in a tenant-configured system.

Consequent forbid: competing on flexibility or breadth of configuration.
Failure-modes list updated to match. Raised by Haley.

Category exemplars are named once, as a category. If the names date, the
argument is about configurable general-purpose workspaces, not those three
companies.

**2026-08-22 — Framing, added.** New section **What is fixed and what moves**,
placed ahead of the principles.

The document as first written read as a refusal machine: burden on every
request, default no. That is the wrong posture and it misstates the position.
The foundation is not an AV idea — it holds for any business that manages work,
and verticals exist because the expression of it must be trade-native, not
because the model is narrow. The methodology is expected to keep developing as
it meets businesses beyond the one it came from; the frame is what does not move.

Recorded the operative rule: *"that's not how we do it"* is expected input,
usually correct about their operation, and the response to it is a solution
rather than a defence. Refusing an implementation is never refusing the need — a
core violation means *not like that*, and answering the need is the obligation
the refusal creates.

Layer-model burden clause softened at the front door and kept at the core.
Adjudication sequence reframed as routing rather than gatekeeping, with a
closing instruction to return to step 2 rather than stop. Raised by Haley.

**2026-08-22 — Principles 7 to 10, added.**

Seven and eight close dependencies the existing principles already had. Five's
overhead argument holds only if data is captured at source — a record assembled
afterwards by an administrator relocates the labour rather than removing it.
Two's trigger is mechanical only if a record can be opened incomplete —
required fields at creation turn the trigger back into a judgement, and waiting
until you have enough is how work ends up in email.

Nine and ten are additions rather than repairs. Nine consolidates three existing
rules — verbatim capture, proposal locking, evidenced decisions — into one
invariant: what left the building is frozen with its inputs and its author. Ten
makes exception detection the system's job rather than the user's discipline,
and draws the distinction between a condition being available and being
surfaced.

Adjudication sequence restructured from eight steps to four, with the invariant
checks moved into a table, so it stays runnable as the principle count grows.
Four failure modes added. Candidates raised by Claude, selection deferred to
Claude by Haley.

**2026-08-22 — Data ownership, ruled out of scope.** Whether a customer's
data leaves with them, whole, on exit. Decided to be a commercial and trust
position rather than an architectural invariant. Ruled by Haley.
