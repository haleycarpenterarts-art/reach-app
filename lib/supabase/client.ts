import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Use only in Client Components.
 * Auth state is read/written via browser cookies managed by @supabase/ssr.
 *
 * Per CLAUDE.md rule 1: integrations isolated behind adapters in lib/.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
