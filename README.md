# Reach

Internal operating system for an AV integrator — lead → estimate → design → handoff → purchasing → field execution → commissioning → closeout → training → service.

## What this repo is

Production-grade internal business system, built with production discipline. See:

- [CLAUDE.md](./CLAUDE.md) — architectural rules, build workflow, skill index
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
- `docs/` — architecture decision records + seed artifacts
- `.claude/skills/` — on-demand skills for domain-specific work
