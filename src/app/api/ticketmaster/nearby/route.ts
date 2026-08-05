import { NextResponse } from "next/server";
import { getNearbyConcerts } from "@/lib/concerts";
import { createClient } from "@/lib/supabase/server";
import { getSpotifyArtistData } from "@/lib/spotify";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = params.get("lat");
  const lng = params.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ results: [] });
  }

  // Logged-out visitors (homepage) and users who haven't connected Spotify
  // just get plain date-ordered results — this is a nice-to-have ranking
  // boost, not something worth blocking the page on.
  let likedArtistNames: string[] = [];
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const spotifyData = await getSpotifyArtistData(supabase, user.id);
      if (spotifyData) {
        likedArtistNames = [
          ...new Set([...spotifyData.topArtists, ...spotifyData.followedArtists].map((a) => a.name)),
        ];
      }
    }
  } catch {
    // Fall through with no personalization rather than failing the request.
  }

  const results = await getNearbyConcerts(lat, lng, 50, likedArtistNames);
  return NextResponse.json({ results });
}
