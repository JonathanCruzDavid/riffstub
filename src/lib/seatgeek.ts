import type { TicketmasterArtist, TicketmasterResult } from "@/lib/ticketmaster";
import { normalizeArtistName } from "@/lib/ticketmaster";

const SEATGEEK_BASE = "https://api.seatgeek.com/2";

function clientId(): string | null {
  return process.env.SEATGEEK_CLIENT_ID || null;
}

// SeatGeek's images can come as a flat `image` string or a sized `images`
// object (huge/large/medium/small) — grab the biggest one available.
function pickSeatGeekImage(raw: any): string | null {
  const images = raw?.images;
  if (images) {
    return images.huge ?? images.large ?? images.medium ?? images.small ?? raw?.image ?? null;
  }
  return raw?.image ?? null;
}

function buildSeatGeekAddress(venue: any): string | null {
  if (!venue?.address) return null;
  const cityState = [venue.city, venue.state].filter(Boolean).join(", ");
  const cityStateZip = [cityState, venue.postal_code].filter(Boolean).join(" ");
  return cityStateZip ? `${venue.address}, ${cityStateZip}` : venue.address;
}

export function mapSeatGeekPerformer(raw: any): TicketmasterArtist {
  const img = pickSeatGeekImage(raw);
  return {
    id: `sg-${raw.id}`,
    name: raw.name,
    imageUrl: img,
    heroImageUrl: img,
  };
}

export function mapSeatGeekEvent(raw: any): TicketmasterResult {
  const venue = raw?.venue;
  const performers: any[] = raw?.performers ?? [];
  const primary = performers.find((p) => p.primary) ?? performers[0];
  const img = pickSeatGeekImage(primary);

  return {
    id: `sg-${raw.id}`,
    artist: primary?.name ?? raw.title,
    venue: venue?.name ?? null,
    address: buildSeatGeekAddress(venue),
    city: venue?.city ?? null,
    date: raw?.datetime_local?.slice(0, 10) ?? "",
    ticketUrl: raw.url,
    imageUrl: img,
    heroImageUrl: img,
    lat: venue?.location?.lat ?? null,
    lng: venue?.location?.lon ?? null,
    ticketVendor: "SeatGeek",
  };
}

// Every fetch here swallows its own errors and returns an empty result —
// SeatGeek is an ADDITIONAL source layered onto Ticketmaster, so a missing
// client ID, an outage, or a bad response should silently fall back to
// "no SeatGeek results" rather than breaking the page.

export async function searchSeatGeekPerformersRaw(keyword: string): Promise<any[]> {
  const id = clientId();
  if (!id) return [];

  const url = new URL(`${SEATGEEK_BASE}/performers`);
  url.searchParams.set("client_id", id);
  url.searchParams.set("q", keyword);
  url.searchParams.set("taxonomies.name", "concert");
  url.searchParams.set("per_page", "20");

  const res = await fetch(url, { next: { revalidate: 60 } }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  return data?.performers ?? [];
}

async function fetchSeatGeekEvents(url: URL): Promise<TicketmasterResult[]> {
  const res = await fetch(url, { next: { revalidate: 300 } }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  return (data?.events ?? []).map(mapSeatGeekEvent);
}

export async function getSeatGeekEventsForArtistName(artistName: string): Promise<TicketmasterResult[]> {
  const id = clientId();
  if (!id) return [];

  // Resolve to a specific performer first (like Ticketmaster's
  // attraction-id step) so we get every upcoming date, not just ones whose
  // title happens to contain the exact keyword text.
  const performers = await searchSeatGeekPerformersRaw(artistName);
  const target = normalizeArtistName(artistName);
  const match = performers.find((p: any) => normalizeArtistName(p.name) === target) ?? performers[0];
  if (!match) return [];

  const url = new URL(`${SEATGEEK_BASE}/events`);
  url.searchParams.set("client_id", id);
  url.searchParams.set("performers.id", String(match.id));
  url.searchParams.set("sort", "datetime_local.asc");
  url.searchParams.set("per_page", "50");
  return fetchSeatGeekEvents(url);
}

export async function getSeatGeekEventsNearby(
  lat: string,
  lng: string,
  radiusMiles: number,
): Promise<TicketmasterResult[]> {
  const id = clientId();
  if (!id) return [];

  const url = new URL(`${SEATGEEK_BASE}/events`);
  url.searchParams.set("client_id", id);
  url.searchParams.set("taxonomies.name", "concert");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lng);
  url.searchParams.set("range", `${radiusMiles}mi`);
  url.searchParams.set("sort", "datetime_local.asc");
  url.searchParams.set("per_page", "40");
  return fetchSeatGeekEvents(url);
}

export async function getSeatGeekEventsForArtistNearby(
  artistName: string,
  lat: string,
  lng: string,
  radiusMiles: number,
): Promise<TicketmasterResult[]> {
  const id = clientId();
  if (!id) return [];

  const url = new URL(`${SEATGEEK_BASE}/events`);
  url.searchParams.set("client_id", id);
  url.searchParams.set("q", artistName);
  url.searchParams.set("taxonomies.name", "concert");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lng);
  url.searchParams.set("range", `${radiusMiles}mi`);
  url.searchParams.set("sort", "datetime_local.asc");
  url.searchParams.set("per_page", "50");

  const target = normalizeArtistName(artistName);
  const events = await fetchSeatGeekEvents(url);
  return events.filter((e) => normalizeArtistName(e.artist) === target);
}
