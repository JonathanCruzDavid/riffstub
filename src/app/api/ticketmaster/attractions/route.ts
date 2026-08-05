import { NextResponse } from "next/server";
import { searchArtists } from "@/lib/concerts";

export type { TicketmasterArtist } from "@/lib/ticketmaster";

export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get("keyword")?.trim();

  if (!keyword) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchArtists(keyword);
  return NextResponse.json({ results });
}
