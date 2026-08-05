import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSpotifyArtistData } from "@/lib/spotify";
import { findNearbyShowsForArtist } from "@/lib/concerts";
import { dedupeByDateAndVenue, type TicketmasterResult } from "@/lib/ticketmaster";

// Runs `fn` over `items` with at most `limit` requests in flight at once.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// Matches nearby shows against two sources: the user's self-curated
// liked_artists list (always available, no login/cap) and, if connected,
// their Spotify top/followed artists (bonus signal, capped to a small set of
// accounts by Spotify's own Development Mode restrictions — see the
// liked_artists schema comment for why this can't be the only source).
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = params.get("lat");
  const lng = params.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ spotifyConnected: false, results: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ spotifyConnected: false, results: [] });
  }

  const [{ data: likedArtistRows }, spotifyData] = await Promise.all([
    supabase.from("liked_artists").select("artist_name").eq("user_id", user.id),
    getSpotifyArtistData(supabase, user.id),
  ]);

  const likedArtistNames = (likedArtistRows ?? []).map((a) => a.artist_name);
  const spotifyArtistNames = spotifyData
    ? [...spotifyData.topArtists, ...spotifyData.followedArtists].map((a) => a.name)
    : [];

  const artistNames = [...new Set([...likedArtistNames, ...spotifyArtistNames])];

  if (artistNames.length === 0) {
    return NextResponse.json({ spotifyConnected: !!spotifyData, hasArtists: false, results: [] });
  }

  const matchGroups = await mapWithConcurrency(artistNames, 8, (name) =>
    findNearbyShowsForArtist(name, lat, lng, 150),
  );

  const results: TicketmasterResult[] = dedupeByDateAndVenue(matchGroups.flat()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return NextResponse.json({ spotifyConnected: !!spotifyData, hasArtists: true, results });
}
