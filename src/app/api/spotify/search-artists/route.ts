import { NextResponse } from "next/server";
import { searchArtists } from "@/lib/spotify";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("query") ?? "";

  try {
    const results = await searchArtists(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
