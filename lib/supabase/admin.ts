import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row-Level Security.
 * Server-only — NEVER import from client components.
 * Use when you need to act on behalf of the system (e.g., creating a
 * profile row for a newly signed-up user, emitting server-side audit
 * events that should not be subject to user RLS).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
