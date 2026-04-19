import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signUpAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string; pending?: string }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const { error, pending } = await searchParams;

  if (pending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We sent you a confirmation link. Click it to finish setting up your Reach account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t get it? Check spam or{" "}
            <Link href="/sign-up" className="underline">
              try again
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Get started with Reach.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signUpAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {decodeURIComponent(error)}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Sign up
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
