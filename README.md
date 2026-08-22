# Reach AV

The audio-visual vertical of **Reach** — a multi-tenant workflow product for small trade
businesses, built by Reach Systems, LLC.

Covers the full project lifecycle: lead → estimate → design → handoff → purchasing → field
execution → commissioning → closeout → training → service.

## What this repo is

Reach AV is the first product in the Reach line, not a pilot for a generic core. A tenant is
an AV integration business, typically 10–20 users at $5–10M/yr. Requirements throughout this
repo are the **AV trade layer** — not one customer's configuration. Values that vary between
integrators belong in tenant configuration, never hardcoded.

Production-grade system, built with production discipline. See:

- [docs/principles.md](./docs/principles.md) — **the ten principles, the layer model, the adjudication sequence.** Governs what may be built. Read before any structural work.
- [docs/product-model.md](./docs/product-model.md) — what Reach is, the container model, brand architecture
- [docs/tenancy-model.md](./docs/tenancy-model.md) — identity, tenancy and trade layers; the model the schema is built on
- [CLAUDE.md](./CLAUDE.md) — architectural rules, build workflow, agent and skill index
- [SPEC.md](./SPEC.md) — canonical functional specification
- [PHASES.md](./PHASES.md) — build plan with entry/exit criteria per phase
- [DECISIONS.md](./DECISIONS.md) — decision log (ADRs) + open questions
- [docs/rbac-matrix.md](./docs/rbac-matrix.md) — role-to-permission seed
- [docs/gates.md](./docs/gates.md) — gate requirements seed
- [docs/room-skus.md](./docs/room-skus.md) — Room SKU structure seed

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Prisma · PostgreSQL (Supabase) · Supabase Auth · Vitest + Playwright · Sentry · Resend · Anthropic API · Vercel.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in Supabase + provider keys
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (unit + integration) |
| `npm run test:ui` | Vitest UI |
| `npm run test:e2e` | Playwright |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:deploy` | Apply migrations (prod) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Run seed script |

## Repository layout

Per [CLAUDE.md](./CLAUDE.md) architectural rules — strict layer separation.

- `app/` — Next.js routes + server actions (presentation only)
- `components/` — UI components (shadcn + project-specific)
- `services/` — business logic (framework-agnostic)
- `db/` — Prisma schema, migrations, repositories
- `lib/money/` — centralized money & calculation services
- `lib/audit/` — audit event emitters
- `lib/authz/` — authorization helpers
- `lib/ingest/` — AI extraction pipeline
- `jobs/` — background workers
- `tests/` — unit, integration, e2e
- `docs/` — product doctrine, architecture decision records, seed artifacts
- `.claude/agents/` — scoped subagents (see [CLAUDE.md](./CLAUDE.md))
- `.claude/skills/` — on-demand skills for domain-specific work
