---
name: schematic
description: Use whenever building or modifying the Schematic Diagram sub-application — signal flow diagrams, device connectivity maps, rack layouts, concept diagrams, submittal diagrams, field diagrams, connection validation, diagram revision tracking, or diagram-to-project data synchronization. Also use when expanding the Library technical schema to support diagram generation.
---

# Schematic Diagram sub-application

Project Card-integrated sub-application tied to rooms, BOM items, and Library technical data. Generates AI-assisted system drawings from structured device definitions, I/O signal flow, and engineering notes. See `SPEC.md` §12.2 for the full spec.

## Core design principle

**The canvas is not the source of truth.** The schematic is a rendered expression of structured project, room, BOM, and Library data with controlled project-specific overrides.

The pain this replaces: generic diagramming tools (Draw.io-style) require manual device updates, manual data entry, manual rewiring, and redraw work every time BOM or engineering inputs change. The schematic app generates from project truth, then engineering reviews — not the other way around.

## Source-of-truth hierarchy

| Data element | Source |
|--------------|--------|
| Project structure | Project Card |
| Rooms and room roles | Estimating / project structure layer |
| Devices and pricing | Library |
| Selected equipment for the job | BOM / estimate revision |
| Device I/O definitions | Library technical schema |
| Engineering notes | Library + approved project-specific overrides |
| Diagram layout | Diagram application |
| Connection logic | BOM + Library I/O rules + approved engineering overrides |

## Integration rules (hard)

- A device does not appear in a diagram unless it exists in the project BOM, the project design package, or an approved lead-stage concept set.
- Device labels inherit from Library data and project naming standards. No manual label text unless a project-specific override is logged.
- Connection points inherit from the Library I/O schema.
- Room and system groupings inherit from the Project Card structure.
- Diagram revisions tie to estimate, BOM, and document revision states.
- Manual overrides are permitted but logged as project-specific exceptions with reason and author.

## Required Library technical schema

The Library must carry technical device definitions for diagrams to work. Without them, AI-assisted diagram generation is guess-driven and unreliable. See `library` skill for the full field list. Minimum for diagram support:

- Device type and functional role
- Input/output/control/network port definitions
- Audio signal types, video signal types, USB roles
- Power requirements
- Mounting notes
- Standard engineering notes
- Signal-flow behavior rules
- Compatible accessory relationships
- Preferred upstream and downstream pairings

## Diagram modes

All generated from the same underlying project data:

- **Concept** — early lead-stage and conceptual layouts.
- **Signal flow** — engineering logic.
- **Rack connectivity** — staging and build.
- **Submittal** — customer and GC communication.
- **Field** — simplified installation reference.

Users switch modes on the same project data; they do not maintain separate diagrams per mode.

## AI-assisted behaviors

The AI layer assists with layout, validation, note generation, and first-pass signal logic. It does not invent device behavior or silently modify approved diagrams.

Allowed:
- Suggest first-pass signal flow.
- Auto-place standard devices by room and system type.
- Recommend connection paths using Library I/O definitions.
- Draft annotations and engineering notes.
- Detect likely missing devices or signal breaks.
- Flag mismatches between room type, BOM, and drawing logic.
- Summarize revision differences between diagram issues.

Not allowed:
- Invent a device that isn't in the BOM or Library.
- Modify an issued diagram.
- Accept a BOM-to-diagram regeneration without user review.

## Validation

Before rendering any device or connection:

- Validate the device exists in Library and has the required technical schema fields.
- Validate connections against allowed signal and port types from the Library I/O schema.
- Show lineage for each diagram object: device → BOM line → Library item → revision.
- Log every manual override with user, timestamp, and reason.
- Alert when the BOM changes after a diagram was issued — the diagram is flagged as potentially stale until reviewed.

## Revision and lifecycle

- Diagram revisions are tied to BOM revision and document revision.
- A new BOM revision does not silently regenerate an issued diagram. The system flags impact; a user triggers regeneration review; the result is a new diagram revision.
- Issued diagrams are snapshots. See `trusted-core`.

## UI direction

- Left panel: project rooms, systems, hierarchy.
- Center canvas: generated diagram.
- Right panel: selected device properties, ports, notes, overrides.
- Change/diff panel: impacts from estimate or BOM revisions.

## Interconnections

- Project Card (project context, official history).
- Estimation (room structure, selected BOM).
- Library (device definitions, I/O schema, engineering notes).
- Document control (issue status, revision tracking).
- Staging and installation (simplified field views).
- Embedded digital assistant (explanation, validation, revision summaries).

## What not to build

- A freeform drawing canvas with no link to project data. That's the problem being replaced, not the solution.
- Manual device-label text entry as the default path. Overrides exist, but they are logged and exceptional.
- Diagrams that exist outside a Project Card or approved lead-stage opportunity.
- Connection validation that runs at render time only. Validate at edit time so invalid states are never saved.
- Silent regeneration of issued diagrams from BOM changes.
