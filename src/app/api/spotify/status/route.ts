import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidSpotifyAccessToken } from "@/lib/spotify";

// Reports whether the current user has a working Spotify connection,
// independent of geolocation — callers that gate a "Connect Spotify" prompt
// behind a location lookup end up hiding that prompt from anyone who denies
// the location prompt, which is a much more common case than actually
// lacking a Spotify connection.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ connected: false });
  }

  const accessToken = await getValidSpotifyAccessToken(supabase, user.id);
  return NextResponse.json({ connected: !!accessToken });
}
