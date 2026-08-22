import { Trade } from "@/lib/generated/prisma/enums";

/**
 * Subdomain to trade layer.
 *
 * `reach-systems.app` is the platform; `av.`, `elec.` and so on select the
 * active TRADE LAYER — the vocabulary, workflows, document types and screens
 * of that trade, over the tenant's one dataset.
 *
 * The subdomain selects the trade layer and NOTHING else. It never selects the
 * tenant and never scopes the data. It arrives from the client, so it carries
 * no authority: whether the caller may use a trade is decided by the tenant's
 * enabled-trades list and the role's grant, not by the hostname they typed.
 *
 * See docs/tenancy-model.md and DECISIONS.md 2026-08-22 — Trade layers.
 */
export const TRADE_SUBDOMAINS: Readonly<Record<string, Trade>> = {
  av: Trade.AV,
  lv: Trade.LOW_VOLTAGE,
  sec: Trade.SECURITY,
  elec: Trade.ELECTRICAL,
};

/** Reverse map, for building links to a trade layer. */
export const SUBDOMAIN_FOR_TRADE: Readonly<Record<Trade, string>> = Object.freeze(
  Object.fromEntries(
    Object.entries(TRADE_SUBDOMAINS).map(([sub, trade]) => [trade, sub]),
  ) as Record<Trade, string>,
);

/** Hostnames whose first label is never a trade subdomain. */
const NON_TRADE_LABELS = new Set(["www", "localhost", "app", "api"]);

/**
 * Extract the trade layer from a Host header.
 *
 * Returns null when the host names no trade — the bare platform domain, a
 * localhost dev server, a preview deployment, or an unrecognised label. Null
 * means "no trade selected", which is a legitimate state, not an error: the
 * caller decides what to do with it (see resolveTrade in active-tenant.ts).
 *
 * Unrecognised labels return null rather than throwing. A hostname is
 * attacker-controlled input, and a parser that throws on unexpected input
 * hands out a denial of service.
 */
export function tradeFromHost(host: string | null | undefined): Trade | null {
  if (!host) return null;

  // Strip port and any userinfo, lowercase, drop a trailing dot.
  const hostname = host
    .trim()
    .toLowerCase()
    .replace(/^.*@/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");

  if (!hostname) return null;

  const labels = hostname.split(".");
  // A bare host with no dots ("localhost") names no trade.
  if (labels.length < 2) return null;

  const first = labels[0];
  if (NON_TRADE_LABELS.has(first)) return null;

  return TRADE_SUBDOMAINS[first] ?? null;
}

/** Whether a string is one of the trade layers that exist. */
export function isTrade(value: string | null | undefined): value is Trade {
  return typeof value === "string" && value in SUBDOMAIN_FOR_TRADE;
}

/**
 * Which trade layer is active, given the subdomain and the tenant's
 * entitlement.
 *
 * Both halves must agree. The subdomain is a request for a trade layer; the
 * tenant's enabled-trades list decides whether it is available. A subdomain
 * naming a trade the tenant does not have resolves to null — denied, not
 * silently downgraded to something else.
 *
 * With no subdomain and exactly one enabled trade, that trade is active. With
 * no subdomain and several, this returns null: the caller must say which.
 * (Open question in docs/tenancy-model.md — whether the bare domain should
 * resolve for a single-trade tenant. Implemented as yes, since there is
 * nothing to choose between.)
 *
 * The ROLE-level half of the check is not here. Trade access is also a grant
 * in the RBAC matrix, which lands with permission_grants — until then only
 * tenant entitlement is enforceable. See docs/rbac-matrix.md §1a.
 */
export function resolveTrade(
  requested: Trade | null,
  enabledTrades: Trade[],
): Trade | null {
  if (requested) {
    return enabledTrades.includes(requested) ? requested : null;
  }
  return enabledTrades.length === 1 ? enabledTrades[0] : null;
}
