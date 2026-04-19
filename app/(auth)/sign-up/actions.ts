"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUpAction(formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid_input";
    redirect(`/sign-up?error=${encodeURIComponent(msg)}`);
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

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
