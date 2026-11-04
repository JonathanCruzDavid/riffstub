import { NextResponse } from "next/server";
import { getArtistCatalog } from "@/lib/spotify";

// An artist's Spotify top tracks and albums, for the Android app's artist and
// concert pages (the website renders these server-side in ArtistShowPanel).
// Public catalog data via the app-level Spotify token — no user login needed.
export async function GET(request: Request) {
  const artist = new URL(request.url).searchParams.get("artist")?.trim();

  if (!artist) {
    return NextResponse.json({ error: "Missing artist." }, { status: 400 });
  }

  const catalog = await getArtistCatalog(artist);
  return NextResponse.json(catalog);
}
