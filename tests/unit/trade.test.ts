import { describe, it, expect } from "vitest";
import { tradeFromHost, isTrade, resolveTrade, SUBDOMAIN_FOR_TRADE } from "@/lib/tenancy/trade";

import { Trade } from "@/lib/generated/prisma/enums";

describe("tradeFromHost", () => {
  it("reads the trade from a trade subdomain", () => {
    expect(tradeFromHost("av.reach-systems.app")).toBe(Trade.AV);
    expect(tradeFromHost("elec.reach-systems.app")).toBe(Trade.ELECTRICAL);
    expect(tradeFromHost("lv.reach-systems.app")).toBe(Trade.LOW_VOLTAGE);
    expect(tradeFromHost("sec.reach-systems.app")).toBe(Trade.SECURITY);
  });

  it("ignores port, case, trailing dot and userinfo", () => {
    expect(tradeFromHost("AV.reach-systems.app:3000")).toBe(Trade.AV);
    expect(tradeFromHost("av.reach-systems.app.")).toBe(Trade.AV);
    expect(tradeFromHost("  av.localhost:3000  ")).toBe(Trade.AV);
    expect(tradeFromHost("user@av.reach-systems.app")).toBe(Trade.AV);
  });

  it("returns null where no trade is named", () => {
    expect(tradeFromHost("reach-systems.app")).toBeNull();
    expect(tradeFromHost("www.reach-systems.app")).toBeNull();
    expect(tradeFromHost("localhost")).toBeNull();
    expect(tradeFromHost("localhost:3000")).toBeNull();
    expect(tradeFromHost("app.reach-systems.app")).toBeNull();
  });

  it("returns null rather than throwing on hostile or malformed input", () => {
    // Host is attacker-controlled: a parser that throws is a denial of service.
    for (const host of [null, undefined, "", "   ", ".", "..", ":3000", "plumbing.reach-systems.app"]) {
      expect(tradeFromHost(host)).toBeNull();
    }
  });

  it("never lets the subdomain imply a tenant", () => {
    // Two different hosts for the same trade resolve identically. The hostname
    // carries a trade layer and nothing else.
    expect(tradeFromHost("av.reach-systems.app")).toBe(tradeFromHost("av.localhost:3000"));
  });

  it("round-trips through the reverse map", () => {
    for (const trade of Object.values(Trade)) {
      const sub = SUBDOMAIN_FOR_TRADE[trade];
      expect(sub).toBeTruthy();
      expect(tradeFromHost(`${sub}.reach-systems.app`)).toBe(trade);
    }
  });
});

describe("isTrade", () => {
  it("accepts trades and rejects everything else", () => {
    expect(isTrade(Trade.AV)).toBe(true);
    expect(isTrade("PLUMBING")).toBe(false);
    expect(isTrade(null)).toBe(false);
    expect(isTrade("")).toBe(false);
  });
});

describe("resolveTrade", () => {
  it("grants a requested trade the tenant has enabled", () => {
    expect(resolveTrade(Trade.AV, [Trade.AV, Trade.SECURITY])).toBe(Trade.AV);
  });

  it("refuses a requested trade the tenant does not have", () => {
    // Denied, never silently downgraded to a trade they do have.
    expect(resolveTrade(Trade.ELECTRICAL, [Trade.AV, Trade.SECURITY])).toBeNull();
  });

  it("refuses everything when the tenant has no trades", () => {
    expect(resolveTrade(Trade.AV, [])).toBeNull();
    expect(resolveTrade(null, [])).toBeNull();
  });

  it("resolves the only trade when none is requested", () => {
    expect(resolveTrade(null, [Trade.AV])).toBe(Trade.AV);
  });

  it("refuses to guess between several when none is requested", () => {
    expect(resolveTrade(null, [Trade.AV, Trade.LOW_VOLTAGE, Trade.SECURITY])).toBeNull();
  });
});
