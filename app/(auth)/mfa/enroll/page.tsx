import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { verifyEnrollmentAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function MfaEnrollPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  const supabase = await createClient();

  // If a verified factor already exists, the user should be on /mfa/challenge
  // (or dashboard, if they just challenged). Punt to middleware.
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const verified = factorsData?.totp?.find((f) => f.status === "verified");
  if (verified) {
    redirect("/mfa/challenge");
  }

  // Clean up stale unverified factors (previous abandoned enrollments).
  const stale = factorsData?.all?.filter((f) => f.status === "unverified") ?? [];
  for (const f of stale) {
    await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  // Start a fresh enrollment.
  const { data: factor, error: enrollError } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });

  if (enrollError || !factor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MFA setup failed</CardTitle>
          <CardDescription>{enrollError?.message ?? "Unknown error"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up two-factor authentication</CardTitle>
        <CardDescription>
          Scan this QR code with an authenticator app (Google Authenticator, 1Password,
          Authy, etc.), then enter the 6-digit code to confirm.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={factor.totp.qr_code}
          alt="MFA QR code"
          className="mx-auto h-48 w-48 bg-white p-2 rounded"
        />
        <p className="text-center text-xs text-muted-foreground">
          Can&apos;t scan? Enter manually:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] break-all">
            {factor.totp.secret}
          </code>
        </p>
        <form action={verifyEnrollmentAction} className="space-y-3">
          <input type="hidden" name="factorId" value={factor.id} />
          <div className="space-y-2">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {decodeURIComponent(error)}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Verify and finish
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
