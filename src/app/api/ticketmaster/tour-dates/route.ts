import { NextResponse } from "next/server";
import { getUpcomingDatesForArtist } from "@/lib/concerts";

export async function GET(request: Request) {
  const artist = new URL(request.url).searchParams.get("artist")?.trim();

  if (!artist) {
    return NextResponse.json({ results: [] });
  }

  const results = await getUpcomingDatesForArtist(artist);
  return NextResponse.json({ results });
}
