import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session-refresh helper invoked by the root middleware on every request.
 * Keeps Supabase auth cookies fresh so Server Components see a valid session.
 *
 * Also the single place where "unauthenticated redirect to /sign-in" logic
 * will eventually live (Phase 2). For now: refresh session, pass through.
 */
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

  // IMPORTANT: `getUser()` is what actually refreshes the session.
  // Do NOT remove — dropping this quietly breaks auth.
  await supabase.auth.getUser();

  return supabaseResponse;
}
