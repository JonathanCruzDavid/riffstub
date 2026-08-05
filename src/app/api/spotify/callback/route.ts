import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, verifySpotifyState, getRequestOrigin } from "@/lib/spotify";
import { logEvent } from "@/lib/logflare";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const origin = getRequestOrigin(request);

  if (!code || !state || !(await verifySpotifyState(state))) {
    return NextResponse.redirect(new URL("/profile?spotify_error=1", origin));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  try {
    // Must exactly match the redirect_uri sent to /authorize in the login
    // route — both are derived from the request's real host the same way,
    // so they stay in sync.
    const tokens = await exchangeCodeForTokens(code, `${origin}/api/spotify/callback`);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase.from("spotify_connections").upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    });

    return NextResponse.redirect(new URL("/profile?spotify_connected=1", origin));
  } catch (err) {
    console.error("[spotify callback] failed", err);
    await logEvent("spotify callback failed", { userId: user.id, error: String(err) });
    return NextResponse.redirect(new URL("/profile?spotify_error=1", origin));
  }
}
