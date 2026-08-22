/**
 * AV trade layer — seeded role defaults.
 *
 * Source of truth for the SEED is docs/rbac-matrix.md §Role codes. Runtime is
 * the tenant-scoped `roles` table, edited via the admin UI — see DECISIONS.md
 * 2026-04-17. Editing this file changes what a NEW tenant starts with. It does
 * not change any existing tenant, and it must never be re-run over one.
 *
 * These twelve are the AV vertical's defaults. A tenant may rename them or add
 * to them without a migration, which is the whole reason roles stopped being a
 * Postgres enum. See docs/tenancy-model.md.
 */
export const AV_ROLE_SEED: ReadonlyArray<{ code: string; name: string }> = [
  { code: "EO", name: "Executive / Owner" },
  { code: "OA", name: "Operations Admin" },
  { code: "PM", name: "Project Manager" },
  { code: "DE", name: "Design Engineer" },
  { code: "ES", name: "Estimator" },
  { code: "PR", name: "Programmer / Systems Engineer" },
  { code: "WH", name: "Warehouse / Inventory" },
  { code: "TL", name: "Technician — Field Lead" },
  { code: "TU", name: "Technician — Field User" },
  { code: "FB", name: "Finance / Billing" },
  { code: "SA", name: "Sales / Account" },
  { code: "SS", name: "Service / Support" },
];

/** Least-privilege default for a new member. Matches docs/rbac-matrix.md. */
export const DEFAULT_MEMBER_ROLE_CODE = "TU";
