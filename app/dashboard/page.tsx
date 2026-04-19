import { requireAuth } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { email, profile } = await requireAuth();

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Reach</CardTitle>
          <CardDescription>You&apos;re signed in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span> {email}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span> {profile.role}
          </p>
          <p>
            <span className="text-muted-foreground">Profile ID:</span>{" "}
            <code className="text-xs">{profile.id}</code>
          </p>
        </CardContent>
      </Card>

      <form action="/auth/signout" method="POST">
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Phase 1 scaffold. Real dashboard shipping in Phase 3.
      </p>
    </main>
  );
}
