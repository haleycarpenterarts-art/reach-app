import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await emit({ type: "SIGN_OUT", actorId: user.id });
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/sign-in", request.url), { status: 303 });
}
