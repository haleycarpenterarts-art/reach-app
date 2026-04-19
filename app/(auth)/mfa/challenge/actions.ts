"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emit } from "@/lib/audit";

const schema = z.object({
  factorId: z.string().min(1),
  code: z.string().length(6, "Enter the 6-digit code"),
});

export async function verifyChallengeAction(formData: FormData) {
  const parsed = schema.safeParse({
    factorId: formData.get("factorId"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid_input";
    redirect(`/mfa/challenge?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: parsed.data.factorId,
  });
  if (challengeError || !challenge) {
    await emit({
      type: "MFA_CHALLENGE_FAIL",
      actorId: user?.id ?? null,
      metadata: { reason: challengeError?.message ?? "challenge_failed" },
    });
    redirect(`/mfa/challenge?error=${encodeURIComponent(challengeError?.message ?? "challenge_failed")}`);
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: parsed.data.factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  });

  if (verifyError) {
    await emit({
      type: "MFA_CHALLENGE_FAIL",
      actorId: user?.id ?? null,
      metadata: { reason: verifyError.message },
    });
    redirect(`/mfa/challenge?error=${encodeURIComponent(verifyError.message)}`);
  }

  await emit({ type: "MFA_CHALLENGE_PASS", actorId: user?.id ?? null });
  redirect("/dashboard");
}
