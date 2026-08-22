import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { tradeFromHost } from "@/lib/tenancy/trade";

/**
 * Session-refresh + auth gate + MFA enforcement.
 *
 * Runs on every request (see matcher in /middleware.ts).
 *
 * Layers of defence (deny-by-default per CLAUDE.md rule 4):
 *   1. Refresh Supabase session cookies.
 *   2. Redirect unauthenticated users away from protected paths to /sign-in.
 *   3. Redirect authenticated-but-not-MFA-enrolled users to /mfa/enroll.
 *   4. Redirect authenticated-with-MFA users whose current session is AAL1
 *      to /mfa/challenge.
 *   5. Allow AAL2 sessions to proceed.
 *
 * MFA requirement: DECISIONS.md 2026-04-17 — MFA required for all users.
 */
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/auth/"];
const PUBLIC_EXACT = new Set(["/"]);
const MFA_PREFIX = "/mfa/";

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p),
  );
}

function isMfaPath(pathname: string): boolean {
  return pathname.startsWith(MFA_PREFIX);
}

export const TRADE_HEADER = "x-reach-trade";

export async function updateSession(request: NextRequest) {
  // Resolve the trade layer from the subdomain and hand it downstream as a
  // request header. This is a REQUEST for a trade layer, not a grant: whether
  // the caller may use it is decided by the tenant's enabled-trades list and
  // the role's grant, never by the hostname. It carries no tenant and no data
  // scope. See docs/tenancy-model.md.
  //
  // Strip any inbound copy first — otherwise a client could set the header
  // itself and skip the parse.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(TRADE_HEADER);
  const trade = tradeFromHost(request.headers.get("host"));
  if (trade) requestHeaders.set(TRADE_HEADER, trade);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() refreshes the session. Do NOT remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Layer 2 — unauthenticated.
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Layers 3–5 — MFA enforcement for authenticated users.
  // Skip checks on the MFA pages themselves (user needs to reach them)
  // and on /auth/* (e.g., signout must work mid-flow).
  if (user && !isMfaPath(pathname) && !pathname.startsWith("/auth/")) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal) {
      if (aal.currentLevel === "aal1" && aal.nextLevel === "aal1") {
        // No MFA factor enrolled — send to enrollment.
        const url = request.nextUrl.clone();
        url.pathname = "/mfa/enroll";
        return NextResponse.redirect(url);
      }
      if (aal.currentLevel === "aal1" && aal.nextLevel === "aal2") {
        // Has factor, session not yet elevated — send to challenge.
        const url = request.nextUrl.clone();
        url.pathname = "/mfa/challenge";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
