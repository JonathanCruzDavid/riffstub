import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("spotify_connections").delete().eq("user_id", user.id);
  }

  return NextResponse.redirect(new URL("/profile", request.url));
}
