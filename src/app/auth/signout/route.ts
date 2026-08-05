import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // request.url's origin can be normalized by the dev server regardless of
  // the actual Host header, so build the redirect from the real header
  // instead — otherwise this can bounce 127.0.0.1 sessions to localhost.
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  return NextResponse.redirect(new URL("/login", `${protocol}://${host}`));
}
