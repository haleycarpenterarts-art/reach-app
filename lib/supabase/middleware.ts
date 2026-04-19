import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session-refresh + auth gate.
 *
 * Runs on every request (see matcher in /middleware.ts). Keeps Supabase
 * auth cookies fresh, then redirects unauthenticated users away from
 * protected paths to /sign-in.
 *
 * Public paths (no auth required):
 *   - /              (landing)
 *   - /sign-in, /sign-up, /auth/*
 *
 * All other paths require a session. Deny-by-default per CLAUDE.md rule 4.
 *
 * Note: MFA enforcement (required per DECISIONS 2026-04-17) lands in a
 * follow-up commit — currently AAL1 sessions are treated as authenticated.
 */
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/auth/"];
const PUBLIC_EXACT = new Set(["/"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
