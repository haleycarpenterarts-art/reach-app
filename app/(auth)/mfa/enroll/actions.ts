"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emit } from "@/lib/audit";

const schema = z.object({
  factorId: z.string().min(1),
  code: z.string().length(6, "Enter the 6-digit code"),
});

export async function verifyEnrollmentAction(formData: FormData) {
  const parsed = schema.safeParse({
    factorId: formData.get("factorId"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid_input";
    redirect(`/mfa/enroll?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: parsed.data.factorId,
  });
  if (challengeError || !challenge) {
    redirect(`/mfa/enroll?error=${encodeURIComponent(challengeError?.message ?? "challenge_failed")}`);
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: parsed.data.factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  });
  if (verifyError) {
    redirect(`/mfa/enroll?error=${encodeURIComponent(verifyError.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await emit({ type: "MFA_ENROLL", actorId: user?.id ?? null });

  redirect("/dashboard");
}
