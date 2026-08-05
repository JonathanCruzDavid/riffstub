export type TicketmasterResult = {
  id: string;
  artist: string;
  venue: string | null;
  address: string | null;
  city: string | null;
  date: string;
  ticketUrl: string;
  imageUrl: string | null;
  heroImageUrl: string | null;
  lat: number | null;
  lng: number | null;
  // Which provider this listing came from (Ticketmaster, SeatGeek, ...) —
  // shown to the user and saved with the concert so the ticket link is
  // correctly attributed rather than always assuming Ticketmaster.
  ticketVendor: string;
};

export type TicketmasterArtist = {
  id: string;
  name: string;
  imageUrl: string | null;
  heroImageUrl: string | null;
};

type TicketmasterImage = { url: string; width?: number };

export function pickImage(images?: TicketmasterImage[]): string | null {
  if (!images || images.length === 0) return null;
  const closestToThumbnail = [...images].sort(
    (a, b) => Math.abs((a.width ?? 0) - 300) - Math.abs((b.width ?? 0) - 300),
  );
  return closestToThumbnail[0]?.url ?? null;
}

// Unlike pickImage (which grabs a ~300px thumbnail for small list icons),
// this picks the highest-resolution image available — needed anywhere the
// image gets stretched across a wide banner, or a small thumbnail ends up
// blurry from being upscaled.
export function pickLargestImage(images?: TicketmasterImage[]): string | null {
  if (!images || images.length === 0) return null;
  const largest = [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return largest[0]?.url ?? null;
}

function buildFullAddress(venue: any): string | null {
  const line1 = venue?.address?.line1;
  if (!line1) return null;

  const cityState = [venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(", ");
  const cityStateZip = [cityState, venue?.postalCode].filter(Boolean).join(" ");

  return cityStateZip ? `${line1}, ${cityStateZip}` : line1;
}

export function mapEvent(event: any): TicketmasterResult {
  const venue = event._embedded?.venues?.[0];
  const attraction = event._embedded?.attractions?.[0];
  const lat = venue?.location?.latitude;
  const lng = venue?.location?.longitude;

  return {
    id: event.id,
    artist: attraction?.name ?? event.name,
    venue: venue?.name ?? null,
    address: buildFullAddress(venue),
    city: venue?.city?.name ?? null,
    date: event.dates?.start?.localDate ?? "",
    ticketUrl: event.url,
    imageUrl: pickImage(attraction?.images) ?? pickImage(event.images),
    heroImageUrl: pickLargestImage(attraction?.images) ?? pickLargestImage(event.images),
    lat: lat ? parseFloat(lat) : null,
    lng: lng ? parseFloat(lng) : null,
    ticketVendor: "Ticketmaster",
  };
}

// Normalizes an artist name for comparison across sources (Spotify vs.
// Ticketmaster spellings can differ in accents, punctuation, or casing).
const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

export function normalizeArtistName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Ticketmaster lists separate rows per price tier/ticket type for the same
// show, so collapse anything sharing a date + venue down to one entry. Also
// collapses the SAME show appearing from both providers — Ticketmaster and
// SeatGeek not only format the exact same venue's name differently
// ("SnapDragon Stadium" vs. "Snapdragon Stadium", "Dover Motor Speedway" vs.
// "Dover International Speedway" for the literal same building), their
// geocoding for the same venue can disagree by a mile or more (observed:
// State Farm Stadium's two provider coordinates are ~2.5mi apart). So this
// treats same-date listings within a few miles of each other as the same
// show rather than requiring an exact venue-name or coordinate match.
const DEDUPE_RADIUS_MILES = 3;

export function dedupeByDateAndVenue(results: TicketmasterResult[]): TicketmasterResult[] {
  const kept: TicketmasterResult[] = [];

  for (const result of results) {
    const isDuplicate = kept.some((existing) => {
      if (existing.date !== result.date) return false;

      if (existing.lat != null && existing.lng != null && result.lat != null && result.lng != null) {
        return distanceMiles(existing.lat, existing.lng, result.lat, result.lng) <= DEDUPE_RADIUS_MILES;
      }

      return normalizeArtistName(existing.venue ?? "") === normalizeArtistName(result.venue ?? "");
    });

    if (!isDuplicate) kept.push(result);
  }

  return kept;
}

// Both providers' attraction/performer search mixes real artists in with
// fan tribute acts/cover bands sharing the same name ("Taylor Swift
// Tribute", "Lover - A tribute to Taylor Swift"...), plus SeatGeek in
// particular also indexes venue logistics as "performers" under the same
// name ("Coldplay Parking", "Coldplay VIP Parking", "Free Shuttle to
// Coldplay Concert"). Rank exact-name matches first, then favor
// attractions the provider has linked to an external profile (Spotify,
// MusicBrainz, Wikipedia...) or given a high popularity score, since
// tribute acts and parking listings essentially never have either, and
// deprioritize names that read as one of these.
const TRIBUTE_NAME_PATTERN =
  /\btribute\b|\bcover band\b|\bsalute\b|\bexperience\b|\ballstars\b|as performed by|dance party|\bparking\b|\bshuttle\b|\brelocation\b/i;

function scoreAttraction(attraction: any, normalizedKeyword: string): number {
  const normalizedName = normalizeArtistName(attraction?.name ?? "");
  let score = 0;

  if (normalizedName === normalizedKeyword) score += 100;
  else if (normalizedName.startsWith(normalizedKeyword)) score += 20;

  if (attraction?.externalLinks && Object.keys(attraction.externalLinks).length > 0) {
    score += 40;
  }

  // SeatGeek performers carry their own 0-1 popularity/verification score
  // instead of externalLinks — same idea, different provider's signal.
  if (typeof attraction?.score === "number") {
    score += attraction.score * 40;
  }

  if (TRIBUTE_NAME_PATTERN.test(attraction?.name ?? "")) score -= 60;

  return score;
}

export function rankAttractions<T extends { name: string }>(
  attractions: T[],
  keyword: string,
): T[] {
  const normalizedKeyword = normalizeArtistName(keyword);
  return [...attractions].sort(
    (a, b) => scoreAttraction(b, normalizedKeyword) - scoreAttraction(a, normalizedKeyword),
  );
}

export function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
