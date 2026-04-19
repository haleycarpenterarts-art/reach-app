"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emit } from "@/lib/audit";

const schema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export async function signInAction(formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/sign-in?error=invalid_input");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    await emit({
      type: "SIGN_IN_FAILED",
      metadata: { email: parsed.data.email, reason: error?.message ?? "unknown" },
    });
    redirect(`/sign-in?error=${encodeURIComponent(error?.message ?? "signin_failed")}`);
  }

  await emit({ type: "SIGN_IN", actorId: data.user.id });
  redirect("/dashboard");
}
