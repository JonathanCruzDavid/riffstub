import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { pickImage, pickLargestImage, normalizeArtistName } from "@/lib/ticketmaster";

export type SpotifyArtist = {
  id: string;
  name: string;
  imageUrl: string | null;
  heroImageUrl: string | null;
  spotifyUrl: string | null;
};

const TOKEN_URL = "https://accounts.spotify.com/api/token";

function basicAuthHeader() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.SPOTIFY_CLIENT_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// request.url's origin can be normalized by the dev server regardless of the
// actual Host header, so callers that need the exact host the browser is on
// (both to keep the OAuth redirect_uri consistent across the two legs, and
// because Supabase's session cookie is host-scoped — a callback landing on a
// different host than the user is browsing from would look logged out) must
// build it from the real header instead of request.url.
export function getRequestOrigin(request: Request): string {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

// Self-verifying OAuth state: signed with our client secret so the callback
// can validate it without needing a matching cookie round-trip (which breaks
// if the browser hits localhost vs. 127.0.0.1 between the two legs).
export async function createSpotifyState(): Promise<string> {
  const nonce = crypto.randomUUID();
  const timestamp = Date.now();
  const signature = await hmacHex(`${nonce}.${timestamp}`);
  return `${nonce}.${timestamp}.${signature}`;
}

export async function verifySpotifyState(state: string): Promise<boolean> {
  const parts = state.split(".");
  if (parts.length !== 3) return false;

  const [nonce, timestampStr, signature] = parts;
  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > STATE_MAX_AGE_MS) return false;

  const expected = await hmacHex(`${nonce}.${timestamp}`);
  return expected === signature;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    throw new Error(`Spotify token exchange failed (${res.status})`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Spotify token refresh failed (${res.status})`);
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}

// Looks up the user's stored Spotify tokens, refreshing (and persisting the
// refresh) if the access token has expired. Returns null if never connected.
export async function getValidSpotifyAccessToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: connection } = await supabase
    .from("spotify_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection) return null;

  if (new Date(connection.expires_at).getTime() > Date.now() + 60_000) {
    return connection.access_token;
  }

  try {
    const refreshed = await refreshAccessToken(connection.refresh_token);
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    await supabase
      .from("spotify_connections")
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token ?? connection.refresh_token,
        expires_at: expiresAt,
      })
      .eq("user_id", userId);

    return refreshed.access_token;
  } catch {
    // Refresh token was revoked (user disconnected in Spotify's app
    // permissions, or app credentials were rotated) — the connection is
    // dead, so drop it instead of erroring on every future page load.
    await supabase.from("spotify_connections").delete().eq("user_id", userId);
    return null;
  }
}

function isSpotifyAuthError(err: unknown): boolean {
  return err instanceof Error && /\(401\)/.test(err.message);
}

// Fetches top + followed artists in one go, self-healing if the stored
// access token turns out to be invalid despite not being expired yet
// (e.g. the user revoked access on Spotify's side mid-session). Returns
// null when there's no usable connection, so callers can treat "never
// connected" and "connection just died" the same way.
export async function getSpotifyArtistData(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ topArtists: SpotifyArtist[]; followedArtists: SpotifyArtist[] } | null> {
  const accessToken = await getValidSpotifyAccessToken(supabase, userId);
  if (!accessToken) return null;

  try {
    const [topArtists, followedArtists] = await Promise.all([
      getTopArtists(accessToken),
      getFollowedArtists(accessToken),
    ]);
    return { topArtists, followedArtists };
  } catch (err) {
    if (isSpotifyAuthError(err)) {
      await supabase.from("spotify_connections").delete().eq("user_id", userId);
    }
    return null;
  }
}

// Spotify's client-credentials quota is shared across every user of this
// app (one app-level token, not per-user), so a burst of requests — from
// one person browsing quickly, not just from testing — can trip a 429 on
// its own. Retry once, honoring Retry-After when Spotify sends one, so a
// transient block self-heals within the same page load instead of
// surfacing an error. Capped short so a page load never hangs waiting on it.
const MAX_RETRY_WAIT_SECONDS = 3;

// A standalone Supabase client (anon key, no user session/cookies) for the
// shared spotify_cache table — this is public catalog data, not
// user-specific, so it doesn't need session-aware auth, and every visitor
// should read/write the same cache rows regardless of who's logged in.
let cacheClient: SupabaseClient | null = null;

function getCacheClient(): SupabaseClient | null {
  if (cacheClient) return cacheClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cacheClient = createSupabaseClient(url, key);
  return cacheClient;
}

// Persistent cache backing spotifyGet's cacheable calls — unlike Next.js's
// fetch cache, this survives redeploys and is shared across every
// serverless instance/region, so a cached artist lookup made by one visitor
// benefits every other visitor too. Read/write failures are swallowed:
// worst case we just fall through to a live Spotify request.
async function getCachedResponse(cacheKey: string): Promise<any | null> {
  const client = getCacheClient();
  if (!client) return null;
  try {
    const { data } = await client
      .from("spotify_cache")
      .select("value, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
    return data.value;
  } catch {
    return null;
  }
}

async function setCachedResponse(cacheKey: string, value: unknown, ttlSeconds: number) {
  const client = getCacheClient();
  if (!client) return;
  try {
    await client.from("spotify_cache").upsert({
      cache_key: cacheKey,
      value,
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    });
  } catch {
    // A failed cache write shouldn't break the actual request.
  }
}

// revalidateSeconds enables both Next.js's in-process fetch cache and the
// persistent Supabase-backed cache above — only safe to pass for public
// catalog data (search, artist albums/tracks). Never cache the
// user-specific endpoints (/me/top/artists, /me/following), since that
// would leak one user's personalized data as a shared cached response.
async function spotifyGet(accessToken: string, path: string, revalidateSeconds?: number) {
  if (revalidateSeconds) {
    const cached = await getCachedResponse(path);
    if (cached) return cached;
  }

  const fetchOptions = {
    headers: { Authorization: `Bearer ${accessToken}` },
    ...(revalidateSeconds ? { next: { revalidate: revalidateSeconds } } : {}),
  };

  let res = await fetch(`https://api.spotify.com/v1${path}`, fetchOptions);

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitSeconds = Number.isFinite(retryAfter)
      ? Math.min(retryAfter, MAX_RETRY_WAIT_SECONDS)
      : MAX_RETRY_WAIT_SECONDS;
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    res = await fetch(`https://api.spotify.com/v1${path}`, fetchOptions);
  }

  if (!res.ok) {
    throw new Error(`Spotify API request failed (${res.status})`);
  }

  const json = await res.json();

  if (revalidateSeconds) {
    await setCachedResponse(path, json, revalidateSeconds);
  }

  return json;
}

// Public catalog lookups (search, artist albums/tracks) barely change
// day-to-day, and repeat page views for the same artist are common — cache
// for a full day to meaningfully cut down how often we hit Spotify's
// shared client-credentials rate limit, not just smooth over one burst.
const CATALOG_CACHE_SECONDS = 60 * 60 * 24;

const TOP_ARTISTS_TIME_RANGES = ["short_term", "medium_term", "long_term"];

// "Top artists" differs by time window (last 4 weeks / 6 months / all-time),
// so an artist you've always loved but haven't binged recently could be
// missing from just one range. Check all three and dedupe.
export async function getTopArtists(accessToken: string): Promise<SpotifyArtist[]> {
  const pages = await Promise.all(
    TOP_ARTISTS_TIME_RANGES.map((timeRange) =>
      spotifyGet(accessToken, `/me/top/artists?limit=50&time_range=${timeRange}`),
    ),
  );

  const byId = new Map<string, SpotifyArtist>();
  for (const data of pages) {
    for (const artist of data.items ?? []) {
      byId.set(artist.id, {
        id: artist.id,
        name: artist.name,
        imageUrl: pickImage(artist.images),
        heroImageUrl: pickLargestImage(artist.images),
        spotifyUrl: artist.external_urls?.spotify ?? null,
      });
    }
  }
  return [...byId.values()];
}

const MAX_FOLLOWED_PAGES = 10;

export async function getFollowedArtists(accessToken: string): Promise<SpotifyArtist[]> {
  const artists: SpotifyArtist[] = [];
  let after: string | undefined;

  for (let page = 0; page < MAX_FOLLOWED_PAGES; page++) {
    const query = after ? `&after=${after}` : "";
    const data = await spotifyGet(accessToken, `/me/following?type=artist&limit=50${query}`);
    const items = data.artists?.items ?? [];

    artists.push(
      ...items.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        imageUrl: pickImage(artist.images),
        heroImageUrl: pickLargestImage(artist.images),
        spotifyUrl: artist.external_urls?.spotify ?? null,
      })),
    );

    after = data.artists?.cursors?.after;
    if (!after || items.length === 0) break;
  }

  return artists;
}

export type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  imageUrl: string | null;
  largeImageUrl: string | null;
  spotifyUrl: string | null;
};

// App-level token (client credentials, no user login involved) for public
// catalog data like track search — lets song search work even for users who
// haven't connected their own Spotify account. Cached in-memory since it's
// valid for ~1 hour and every wishlist search would otherwise re-fetch it.
let appToken: { accessToken: string; expiresAt: number } | null = null;

async function getAppAccessToken(): Promise<string> {
  if (appToken && appToken.expiresAt > Date.now() + 60_000) {
    return appToken.accessToken;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) {
    throw new Error(`Spotify app token request failed (${res.status})`);
  }

  const data = await res.json();
  appToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return appToken.accessToken;
}

function mapSpotifyArtist(artist: any): SpotifyArtist {
  return {
    id: artist.id,
    name: artist.name,
    imageUrl: pickImage(artist.images),
    heroImageUrl: pickLargestImage(artist.images),
    spotifyUrl: artist.external_urls?.spotify ?? null,
  };
}

function mapSpotifyTrack(track: any, fallbackArtist?: string): SpotifyTrack {
  return {
    id: track.id,
    name: track.name,
    artist: track.artists?.[0]?.name ?? fallbackArtist ?? "",
    imageUrl: pickImage(track.album?.images),
    largeImageUrl: pickLargestImage(track.album?.images),
    spotifyUrl: track.external_urls?.spotify ?? null,
  };
}

export async function searchTracks(
  query: string,
  artistName?: string,
): Promise<SpotifyTrack[]> {
  if (!query.trim() && !artistName) return [];

  const accessToken = await getAppAccessToken();
  // Free-text search (rather than field-filter syntax like `track:X`) so
  // close-but-not-exact spellings still surface a match, the way Spotify's
  // own search box behaves.
  const q = [query.trim(), artistName?.trim()].filter(Boolean).join(" ");

  const data = await spotifyGet(
    accessToken,
    `/search?type=track&limit=10&q=${encodeURIComponent(q)}`,
    CATALOG_CACHE_SECONDS,
  );

  return (data.tracks?.items ?? []).map((track: any) => mapSpotifyTrack(track, artistName));
}

export async function searchArtists(query: string): Promise<SpotifyArtist[]> {
  if (!query.trim()) return [];

  const accessToken = await getAppAccessToken();
  const data = await spotifyGet(
    accessToken,
    `/search?type=artist&limit=10&q=${encodeURIComponent(query.trim())}`,
    CATALOG_CACHE_SECONDS,
  );

  return (data.artists?.items ?? []).map(mapSpotifyArtist);
}

// Ticketmaster events only give us an artist name (no Spotify ID), so
// finding their Spotify catalog data starts with a name search. Prefer an
// exact (normalized) match over Spotify's top-ranked result, since search
// relevance can surface a bigger, differently-named artist first.
export async function findArtistByName(name: string): Promise<SpotifyArtist | null> {
  const results = await searchArtists(name);
  if (results.length === 0) return null;

  const target = normalizeArtistName(name);
  const exact = results.find((a) => normalizeArtistName(a.name) === target);
  return exact ?? results[0];
}

// Combines artist resolution + top-tracks search into a single Spotify
// request (Spotify's search endpoint accepts a comma-separated `type` list
// and returns both result buckets in one response) instead of two separate
// calls — halves the search-side request volume against the shared
// client-credentials rate limit.
async function resolveArtistAndTracks(
  artistName: string,
): Promise<{ artist: SpotifyArtist | null; topTracks: SpotifyTrack[] }> {
  const accessToken = await getAppAccessToken();
  const data = await spotifyGet(
    accessToken,
    `/search?type=artist,track&limit=10&q=${encodeURIComponent(artistName)}`,
    CATALOG_CACHE_SECONDS,
  );

  const target = normalizeArtistName(artistName);

  const artists: SpotifyArtist[] = (data.artists?.items ?? []).map(mapSpotifyArtist);
  const artist =
    artists.find((a: SpotifyArtist) => normalizeArtistName(a.name) === target) ??
    artists[0] ??
    null;

  const topTracks = (data.tracks?.items ?? [])
    .filter((track: any) =>
      (track.artists ?? []).some((a: any) => normalizeArtistName(a.name) === target),
    )
    .map((track: any) => mapSpotifyTrack(track));

  return { artist, topTracks };
}

// Spotify permanently removed the "Artist's Top Tracks" endpoint (Feb 2026
// changelog) — it now 403s for every app, not just non-extended ones. This
// is the closest available substitute: a plain free-text search on the
// artist's name, filtered down to tracks actually credited to them. It's
// not an official popularity ranking, just Spotify's search relevance, but
// in practice that surfaces an artist's well-known songs reasonably well.
export async function getArtistTracks(artistName: string): Promise<SpotifyTrack[]> {
  const accessToken = await getAppAccessToken();
  const data = await spotifyGet(
    accessToken,
    `/search?type=track&limit=10&q=${encodeURIComponent(artistName)}`,
    CATALOG_CACHE_SECONDS,
  );

  const target = normalizeArtistName(artistName);
  return (data.tracks?.items ?? [])
    .filter((track: any) =>
      (track.artists ?? []).some((a: any) => normalizeArtistName(a.name) === target),
    )
    .map((track: any) => mapSpotifyTrack(track));
}

export type SpotifyAlbum = {
  id: string;
  name: string;
  imageUrl: string | null;
  releaseDate: string;
  spotifyUrl: string | null;
};

export async function getArtistAlbums(artistId: string): Promise<SpotifyAlbum[]> {
  const accessToken = await getAppAccessToken();
  // Spotify quietly dropped this endpoint's max limit from 50 to 10 — a
  // higher value now returns a 400 "Invalid limit" instead of clamping.
  const data = await spotifyGet(
    accessToken,
    `/artists/${artistId}/albums?include_groups=album&limit=10&market=US`,
    CATALOG_CACHE_SECONDS,
  );

  // Spotify often lists the same album multiple times (regional re-releases,
  // deluxe editions with an identical name) — dedupe by name and keep the
  // newest listing, then sort newest-first.
  const byName = new Map<string, SpotifyAlbum>();
  for (const album of data.items ?? []) {
    const key = album.name.toLowerCase();
    const existing = byName.get(key);
    if (existing && existing.releaseDate >= album.release_date) continue;
    byName.set(key, {
      id: album.id,
      name: album.name,
      imageUrl: pickImage(album.images),
      releaseDate: album.release_date ?? "",
      spotifyUrl: album.external_urls?.spotify ?? null,
    });
  }

  return [...byName.values()].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}

export type ArtistCatalog = {
  artist: SpotifyArtist | null;
  topTracks: SpotifyTrack[];
  topTracksError: boolean;
  albums: SpotifyAlbum[];
  albumsError: boolean;
};

// A failed fetch (rate limit, transient network error) and a genuinely
// empty result both used to render as "no data available" — tracking the
// error separately lets the UI say "couldn't load" instead of implying the
// artist just doesn't have any songs/albums on Spotify.
//
// Resolves the artist and fetches their top tracks in one combined Spotify
// request, then fetches albums (which needs the resolved artist ID, so it
// can't be folded into the same call) — two Spotify requests total instead
// of three.
export async function getArtistCatalog(artistName: string): Promise<ArtistCatalog> {
  let topTracksError = false;
  let albumsError = false;

  let artist: SpotifyArtist | null = null;
  let topTracks: SpotifyTrack[] = [];
  try {
    const resolved = await resolveArtistAndTracks(artistName);
    artist = resolved.artist;
    topTracks = resolved.topTracks;
  } catch {
    topTracksError = true;
  }

  const albums = artist
    ? await getArtistAlbums(artist.id).catch(() => {
        albumsError = true;
        return [];
      })
    : [];

  return { artist, topTracks, topTracksError, albums, albumsError };
}
