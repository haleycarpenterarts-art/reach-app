import { requireAuth } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { email, identityId, memberships } = await requireAuth();

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
            <span className="text-muted-foreground">Identity ID:</span>{" "}
            <code className="text-xs">{identityId}</code>
          </p>
          <div>
            <span className="text-muted-foreground">Memberships:</span>{" "}
            {memberships.length === 0 ? (
              <span>none — this identity has not been added to a business yet</span>
            ) : (
              <ul className="mt-1 space-y-1">
                {memberships.map((m) => (
                  <li key={m.id}>
                    {m.tenant.name} — {m.role.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
