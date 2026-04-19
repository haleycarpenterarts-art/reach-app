import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Reach</h1>
        <p className="text-muted-foreground">
          Internal operating system for AV integration. Lead through closeout.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/sign-in" className={cn(buttonVariants())}>
            Sign in
          </Link>
          <Link href="/sign-up" className={cn(buttonVariants({ variant: "outline" }))}>
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
