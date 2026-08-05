import { NextResponse } from "next/server";
import { createSpotifyState, getRequestOrigin } from "@/lib/spotify";

export async function GET(request: Request) {
  // Built from the request's actual host rather than a fixed env var, so it
  // always matches whichever host (localhost vs. 127.0.0.1, or the real
  // domain in production) the user is currently browsing from — otherwise
  // Spotify bounces them back to a different host than their session cookie
  // is scoped to, and the callback sees them as logged out.
  const redirectUri = `${getRequestOrigin(request)}/api/spotify/callback`;
  const state = await createSpotifyState();

  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID!);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "user-top-read user-follow-read");
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl);
}
