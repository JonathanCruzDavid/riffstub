// Merges Ticketmaster + SeatGeek into single result lists. Every consumer
// (the search dropdown, a selected artist's dates, nearby discovery, the
// Spotify-artist location matcher) used to talk to Ticketmaster directly;
// this module is the one place that fans out to both providers, ranks/dedupes,
// and hands back the same TicketmasterResult/TicketmasterArtist shapes those
// consumers already expect, so SeatGeek is additive rather than a rewrite.
import {
  mapEvent,
  dedupeByDateAndVenue,
  normalizeArtistName,
  rankAttractions,
  pickImage,
  pickLargestImage,
  type TicketmasterResult,
  type TicketmasterArtist,
} from "@/lib/ticketmaster";
import {
  searchSeatGeekPerformersRaw,
  mapSeatGeekPerformer,
  getSeatGeekEventsForArtistName,
  getSeatGeekEventsNearby,
  getSeatGeekEventsForArtistNearby,
} from "@/lib/seatgeek";

const TICKETMASTER_BASE = "https://app.ticketmaster.com/discovery/v2";

function ticketmasterApiKey(): string | null {
  return process.env.TICKETMASTER_API_KEY || null;
}

async function fetchTicketmasterAttractionsRaw(keyword: string): Promise<any[]> {
  const apiKey = ticketmasterApiKey();
  if (!apiKey) return [];

  const url = new URL(`${TICKETMASTER_BASE}/attractions.json`);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("size", "20");

  const res = await fetch(url, { next: { revalidate: 60 } }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  return data?._embedded?.attractions ?? [];
}

// Artist search dropdown (concerts/new): merges Ticketmaster attractions +
// SeatGeek performers, ranks out tribute/cover acts, and dedupes down to one
// row per real artist regardless of which provider(s) matched them.
export async function searchArtists(keyword: string): Promise<TicketmasterArtist[]> {
  const [tmAttractions, sgPerformers] = await Promise.all([
    fetchTicketmasterAttractionsRaw(keyword),
    searchSeatGeekPerformersRaw(keyword),
  ]);

  const tagged = [
    ...tmAttractions.map((a: any) => ({ ...a, __source: "ticketmaster" as const })),
    ...sgPerformers.map((p: any) => ({ ...p, __source: "seatgeek" as const })),
  ];

  const ranked = rankAttractions(tagged, keyword);

  const seen = new Set<string>();
  const results: TicketmasterArtist[] = [];
  for (const item of ranked) {
    const key = normalizeArtistName(item.name ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);

    results.push(
      item.__source === "seatgeek"
        ? mapSeatGeekPerformer(item)
        : {
            id: item.id,
            name: item.name,
            imageUrl: pickImage(item.images),
            heroImageUrl: pickLargestImage(item.images),
          },
    );

    if (results.length >= 10) break;
  }

  return results;
}

async function getTicketmasterEventsForArtistName(artistName: string): Promise<TicketmasterResult[]> {
  const apiKey = ticketmasterApiKey();
  if (!apiKey) return [];

  const attractions = await fetchTicketmasterAttractionsRaw(artistName);
  const target = normalizeArtistName(artistName);
  const match = attractions.find((a: any) => normalizeArtistName(a.name) === target) ?? attractions[0];
  if (!match) return [];

  const url = new URL(`${TICKETMASTER_BASE}/events.json`);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("attractionId", match.id);
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", "50");

  const res = await fetch(url, { next: { revalidate: 300 } }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  return (data?._embedded?.events ?? []).map(mapEvent);
}

// All upcoming dates for one artist, from both providers — used both for
// "here's what's on sale for the artist you just selected" and the concert
// detail page's "other upcoming dates" section.
export async function getUpcomingDatesForArtist(artistName: string): Promise<TicketmasterResult[]> {
  const [tmEvents, sgEvents] = await Promise.all([
    getTicketmasterEventsForArtistName(artistName),
    getSeatGeekEventsForArtistName(artistName),
  ]);

  return dedupeByDateAndVenue([...tmEvents, ...sgEvents]).sort((a, b) => a.date.localeCompare(b.date));
}

async function getTicketmasterEventsNearby(
  lat: string,
  lng: string,
  radiusMiles: number,
): Promise<TicketmasterResult[]> {
  const apiKey = ticketmasterApiKey();
  if (!apiKey) return [];

  const url = new URL(`${TICKETMASTER_BASE}/events.json`);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("latlong", `${lat},${lng}`);
  url.searchParams.set("radius", String(radiusMiles));
  url.searchParams.set("unit", "miles");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", "40");

  const res = await fetch(url, { next: { revalidate: 300 } }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  return (data?._embedded?.events ?? []).map(mapEvent);
}

// "Discover nearby" / homepage feed — every upcoming show near a location,
// no artist filter, from both providers. When the caller knows which
// artists the viewer actually listens to (their Spotify top/followed
// artists), those shows are bubbled to the top of the list instead of
// being buried at whatever point date-order happens to place them —
// everything else still follows, sorted by date same as before.
export async function getNearbyConcerts(
  lat: string,
  lng: string,
  radiusMiles = 50,
  likedArtistNames: string[] = [],
): Promise<TicketmasterResult[]> {
  const [tmEvents, sgEvents] = await Promise.all([
    getTicketmasterEventsNearby(lat, lng, radiusMiles),
    getSeatGeekEventsNearby(lat, lng, radiusMiles),
  ]);

  const merged = dedupeByDateAndVenue([...tmEvents, ...sgEvents]);

  if (likedArtistNames.length === 0) {
    return merged.sort((a, b) => a.date.localeCompare(b.date));
  }

  const liked = new Set(likedArtistNames.map(normalizeArtistName));
  return merged.sort((a, b) => {
    const aLiked = liked.has(normalizeArtistName(a.artist));
    const bLiked = liked.has(normalizeArtistName(b.artist));
    if (aLiked !== bLiked) return aLiked ? -1 : 1;
    return a.date.localeCompare(b.date);
  });
}

async function getTicketmasterEventsForArtistNearby(
  artistName: string,
  lat: string,
  lng: string,
  radiusMiles: number,
): Promise<TicketmasterResult[]> {
  const apiKey = ticketmasterApiKey();
  if (!apiKey) return [];

  const url = new URL(`${TICKETMASTER_BASE}/events.json`);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("keyword", artistName);
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("latlong", `${lat},${lng}`);
  url.searchParams.set("radius", String(radiusMiles));
  url.searchParams.set("unit", "miles");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", "50");

  // A single flaky request shouldn't silently drop an artist from the
  // results, so retry once before giving up on this artist.
  let res = await fetch(url, { next: { revalidate: 300 } }).catch(() => null);
  if (!res || !res.ok) res = await fetch(url, { next: { revalidate: 300 } }).catch(() => null);
  if (!res || !res.ok) return [];

  const data = await res.json().catch(() => null);
  const events: TicketmasterResult[] = (data?._embedded?.events ?? []).map(mapEvent);
  const target = normalizeArtistName(artistName);
  return events.filter((e) => normalizeArtistName(e.artist) === target);
}

// Used by the "Spotify artists near you" matcher — one artist name checked
// against a location, from both providers.
export async function findNearbyShowsForArtist(
  artistName: string,
  lat: string,
  lng: string,
  radiusMiles = 150,
): Promise<TicketmasterResult[]> {
  const [tmEvents, sgEvents] = await Promise.all([
    getTicketmasterEventsForArtistNearby(artistName, lat, lng, radiusMiles),
    getSeatGeekEventsForArtistNearby(artistName, lat, lng, radiusMiles),
  ]);

  return dedupeByDateAndVenue([...tmEvents, ...sgEvents]);
}
