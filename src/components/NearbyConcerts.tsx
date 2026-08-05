"use client";

import { useEffect, useState } from "react";
import ConcertResultCard from "@/components/ConcertResultCard";
import LocationControl from "@/components/LocationControl";
import SeatGeekAttribution from "@/components/SeatGeekAttribution";
import { useUserLocation } from "@/lib/useUserLocation";
import type { TicketmasterResult } from "@/lib/ticketmaster";

type Status = "loading" | "empty" | "ready" | "error";

const PAGE_SIZE = 6;

export default function NearbyConcerts() {
  const {
    location,
    status: locationStatus,
    zipError,
    submittingZip,
    submitZip,
    useCurrentLocation,
  } = useUserLocation();

  const [status, setStatus] = useState<Status>("loading");
  const [concerts, setConcerts] = useState<TicketmasterResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const lat = location.lat.toFixed(2);
        const lng = location.lng.toFixed(2);
        const res = await fetch(`/api/ticketmaster/nearby?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (cancelled) return;

        const results: TicketmasterResult[] = data.results ?? [];
        setConcerts(results);
        setVisibleCount(PAGE_SIZE);
        setStatus(results.length > 0 ? "ready" : "empty");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location]);

  if (locationStatus === "locating") {
    return <p className="text-sm text-black/50 dark:text-white/50">Finding your location...</p>;
  }

  if (locationStatus === "unavailable" && !location) {
    return (
      <div>
        <p className="mb-2 text-sm text-black/50 dark:text-white/50">
          Enable location access, or enter a ZIP code, to see what's playing near you.
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

      {status === "loading" && (
        <p className="text-sm text-black/50 dark:text-white/50">Finding concerts near you...</p>
      )}

      {status === "error" && (
        <p className="text-sm text-black/50 dark:text-white/50">
          Couldn't load nearby concerts right now.
        </p>
      )}

      {status === "empty" && (
        <p className="text-sm text-black/50 dark:text-white/50">
          No upcoming shows found near you right now.
        </p>
      )}

      {status === "ready" && (
        <>
          <div className="grid items-stretch grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concerts.slice(0, visibleCount).map((concert) => (
              <ConcertResultCard key={concert.id} concert={concert} />
            ))}
          </div>
          {visibleCount < concerts.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-4 block text-sm underline text-black/60 dark:text-white/60"
            >
              Show more
            </button>
          )}
          {concerts.some((c) => c.ticketVendor === "SeatGeek") && <SeatGeekAttribution />}
        </>
      )}
    </div>
  );
}
