import { NextResponse } from "next/server";
import { searchTracks } from "@/lib/spotify";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const artist = params.get("artist")?.trim() || undefined;
  const query = params.get("query") ?? "";

  try {
    const results = await searchTracks(query, artist);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
