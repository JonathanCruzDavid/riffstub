"use client";

import { useEffect, useState } from "react";
import TourDateRow from "@/components/TourDateRow";
import SeatGeekAttribution from "@/components/SeatGeekAttribution";
import { distanceMiles } from "@/lib/ticketmaster";
import type { TicketmasterResult } from "@/lib/ticketmaster";

type Status = "locating" | "loading" | "empty" | "ready" | "error";

const NEARBY_RADIUS_MILES = 200;
const PAGE_SIZE = 6;

export default function ArtistTourDates({
  artistName,
  excludeDate,
  excludeVenue,
}: {
  artistName: string;
  excludeDate?: string;
  excludeVenue?: string | null;
}) {
  const [status, setStatus] = useState<Status>("locating");
  const [dates, setDates] = useState<TicketmasterResult[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    async function load() {
      setStatus("loading");
      try {
        const res = await fetch(`/api/ticketmaster/tour-dates?artist=${encodeURIComponent(artistName)}`);
        const data = await res.json();
        const results: TicketmasterResult[] = (data.results ?? []).filter(
          (r: TicketmasterResult) => !(r.date === excludeDate && r.venue === excludeVenue),
        );
        setDates(results);
        setStatus(results.length > 0 ? "ready" : "empty");
      } catch {
        setStatus("error");
      }
    }

    if (!navigator.geolocation) {
      load();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        load();
      },
      () => load(),
      { timeout: 5000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistName]);

  if (status === "locating" || status === "loading") {
    return <p className="text-sm text-black/50 dark:text-white/50">Finding tour dates...</p>;
  }
  if (status === "error") {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        Couldn't load tour dates right now.
      </p>
    );
  }
  if (status === "empty") {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No other upcoming dates found for this artist.
      </p>
    );
  }

  const withDistance = dates.map((result) => ({
    result,
    distance:
      userCoords && result.lat != null && result.lng != null
        ? distanceMiles(userCoords.lat, userCoords.lng, result.lat, result.lng)
        : null,
  }));

  const nearby = withDistance
    .filter((d) => d.distance != null && d.distance <= NEARBY_RADIUS_MILES)
    .sort((a, b) => a.distance! - b.distance!)
    .map((d) => d.result);

  const nearbyIds = new Set(nearby.map((r) => r.id));
  const others = dates.filter((r) => !nearbyIds.has(r.id));
  const visibleOthers = others.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-8">
      {nearby.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Near you
          </h3>
          <div className="grid items-stretch grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((concert) => (
              <TourDateRow key={concert.id} concert={concert} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            All dates
          </h3>
          <div className="grid items-stretch grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleOthers.map((concert) => (
              <TourDateRow key={concert.id} concert={concert} />
            ))}
          </div>
          {visibleCount < others.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-4 block text-sm underline text-black/60 dark:text-white/60"
            >
              Show more
            </button>
          )}
        </div>
      )}

      {dates.some((d) => d.ticketVendor === "SeatGeek") && <SeatGeekAttribution />}
    </div>
  );
}
