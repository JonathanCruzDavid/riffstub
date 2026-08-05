"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ConcertResultCard from "@/components/ConcertResultCard";
import SpotifyAttribution from "@/components/SpotifyAttribution";
import LocationControl from "@/components/LocationControl";
import SeatGeekAttribution from "@/components/SeatGeekAttribution";
import { useUserLocation } from "@/lib/useUserLocation";
import type { TicketmasterResult } from "@/lib/ticketmaster";

type MatchStatus = "loading" | "no-artists" | "empty" | "ready" | "error";

const PAGE_SIZE = 6;

// Matches nearby shows against your liked artists (see /profile) — Spotify,
// if connected, adds its top/followed artists as a bonus signal on top, but
// isn't required: Spotify's own login flow caps how many accounts can ever
// connect, so this can't be the only source.
export default function SpotifyMatches() {
  const {
    location,
    status: locationStatus,
    zipError,
    submittingZip,
    submitZip,
    useCurrentLocation,
  } = useUserLocation();

  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("loading");
  const [matches, setMatches] = useState<TicketmasterResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;
    setMatchStatus("loading");

    (async () => {
      try {
        const lat = location.lat.toFixed(2);
        const lng = location.lng.toFixed(2);
        const res = await fetch(`/api/spotify/nearby-matches?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (cancelled) return;

        setSpotifyConnected(!!data.spotifyConnected);

        if (!data.hasArtists) {
          setMatchStatus("no-artists");
          return;
        }

        const results: TicketmasterResult[] = data.results ?? [];
        setMatches(results);
        setVisibleCount(PAGE_SIZE);
        setMatchStatus(results.length > 0 ? "ready" : "empty");
      } catch {
        if (!cancelled) setMatchStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location]);

  if (locationStatus === "locating") {
    return <p className="text-sm text-black/50 dark:text-white/50">Finding shows for you...</p>;
  }

  if (locationStatus === "unavailable" && !location) {
    return (
      <div>
        <p className="mb-2 text-sm text-black/60 dark:text-white/60">
          Enable location access, or enter a ZIP code, to see which artists you like are playing near you.
        </p>
        <LocationControl
          label={null}
          onSubmitZip={submitZip}
          submitting={submittingZip}
          error={zipError}
          onUseCurrentLocation={useCurrentLocation}
          startEditing
        />
      </div>
    );
  }

  return (
    <div>
      <LocationControl
        label={location?.label ?? null}
        onSubmitZip={submitZip}
        submitting={submittingZip}
        error={zipError}
        onUseCurrentLocation={useCurrentLocation}
      />

      {matchStatus === "loading" && (
        <p className="text-sm text-black/50 dark:text-white/50">Finding shows for you...</p>
      )}

      {matchStatus === "error" && (
        <p className="text-sm text-black/50 dark:text-white/50">Couldn't check this right now.</p>
      )}

      {matchStatus === "no-artists" && (
        <p className="text-sm text-black/60 dark:text-white/60">
          <Link href="/profile" className="underline">
            Add artists you like
          </Link>{" "}
          to see when they're playing near you.
        </p>
      )}

      {matchStatus === "empty" && (
        <p className="text-sm text-black/60 dark:text-white/60">
          None of your artists have a show near you right now.
        </p>
      )}

      {matchStatus === "ready" && (
        <>
          <div className="grid items-stretch grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.slice(0, visibleCount).map((concert) => (
              <ConcertResultCard key={concert.id} concert={concert} />
            ))}
          </div>
          {visibleCount < matches.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-4 block text-sm underline text-black/60 dark:text-white/60"
            >
              Show more
            </button>
          )}
          {spotifyConnected && <SpotifyAttribution />}
          {matches.some((c) => c.ticketVendor === "SeatGeek") && <SeatGeekAttribution />}
        </>
      )}
    </div>
  );
}
