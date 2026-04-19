import "server-only";
import { redirect } from "next/navigation";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Role, type Profile } from "@/lib/generated/prisma/client";
import { emit } from "@/lib/audit";

export type AuthedContext = {
  userId: string;
  email: string;
  profile: Profile;
};

/**
 * Server-side auth gate for protected routes.
 *
 * - Redirects to /sign-in if no session exists.
 * - Upserts a Profile row on first authenticated access. Default role is
 *   TECH_USER (least privilege); Ops Admin or Executive must elevate.
 * - Emits AUTHZ_DENIED only for attempted-access-without-session cases
 *   that bypass middleware (defence in depth).
 *
 * Deny-by-default per CLAUDE.md rule 4: callers are expected to use this
 * helper at the top of every protected server component / server action.
 */
export async function requireAuth(): Promise<AuthedContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Middleware should catch this first; if we got here, emit and redirect.
    await emit({ type: "AUTHZ_DENIED", metadata: { reason: "no_session" } });
    redirect("/sign-in");
  }

  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    update: { email: user.email ?? "" },
    create: {
      id: user.id,
      email: user.email ?? "",
      role: Role.TECH_USER,
    },
  });

  return {
    userId: user.id,
    email: user.email ?? "",
    profile,
  };
}
