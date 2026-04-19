"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Resolve the stable site origin for outbound email links.
 * Priority: NEXT_PUBLIC_SITE_URL → Vercel production domain → request headers.
 * Never use request host directly — on Vercel it can be a per-commit preview
 * URL that disappears on the next deploy, breaking confirmation links.
 */
async function resolveSiteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function signUpAction(formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid_input";
    redirect(`/sign-up?error=${encodeURIComponent(msg)}`);
  }

  const origin = await resolveSiteOrigin();

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/sign-up?pending=1");
}
