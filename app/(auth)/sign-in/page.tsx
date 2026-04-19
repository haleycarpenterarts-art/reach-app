import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signInAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string; redirect?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to Reach.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signInAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {prettyError(error)}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/sign-up" className="underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function prettyError(code: string): string {
  if (code === "invalid_input") return "Please enter a valid email and password (min 6 chars).";
  if (code === "signin_failed") return "Sign-in failed. Check your credentials.";
  try {
    return decodeURIComponent(code);
  } catch {
    return "Sign-in failed.";
  }
}
