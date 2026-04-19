import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { verifyChallengeAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function MfaChallengePage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");

  // No verified factor yet — user needs to enroll first.
  if (!verifiedTotp) {
    redirect("/mfa/enroll");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter your verification code</CardTitle>
        <CardDescription>
          Open your authenticator app and enter the current 6-digit code for Reach.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={verifyChallengeAction} className="space-y-4">
          <input type="hidden" name="factorId" value={verifiedTotp.id} />
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="123456"
              required
              autoFocus
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {decodeURIComponent(error)}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Verify
          </Button>
        </form>
        <form action="/auth/signout" method="POST" className="mt-4">
          <Button type="submit" variant="ghost" className="w-full">
            Sign out
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
