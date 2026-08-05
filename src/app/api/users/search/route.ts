import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .not("username", "is", null)
    .ilike("username", `%${query}%`)
    .limit(8);

  const results = (data ?? []).filter((p) => p.username);
  return NextResponse.json({ results });
}
