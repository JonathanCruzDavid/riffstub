"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDisplayDate } from "@/lib/format";
import { distanceMiles } from "@/lib/ticketmaster";
import { logActivityEvent } from "@/lib/activity";
import SeatGeekAttribution from "@/components/SeatGeekAttribution";
import type { TicketmasterResult } from "@/lib/ticketmaster";
import type { TicketmasterArtist } from "@/app/api/ticketmaster/attractions/route";

export default function AddUpcomingConcertForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [artistResults, setArtistResults] = useState<TicketmasterArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<TicketmasterArtist | null>(null);
  const [dates, setDates] = useState<TicketmasterResult[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selected, setSelected] = useState<TicketmasterResult | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Denied/unavailable — dates just fall back to date order below.
      },
      { timeout: 5000 },
    );
  }, []);

  // Arrived from an artist's preview page ("+ Add to my list") with a
  // specific date already resolved — skip straight to the locked review
  // step instead of making them search again.
  useEffect(() => {
    const artist = searchParams.get("artist");
    const date = searchParams.get("date");
    if (!artist || !date) return;

    setSelected({
      id: "prefill",
      artist,
      venue: searchParams.get("venue") || null,
      address: searchParams.get("address") || null,
      city: searchParams.get("city") || null,
      date,
      ticketUrl: searchParams.get("ticketUrl") || "",
      imageUrl: searchParams.get("imageUrl") || null,
      heroImageUrl: null,
      lat: null,
      lng: null,
      ticketVendor: searchParams.get("ticketVendor") || "",
    });
  }, [searchParams]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setArtistResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/ticketmaster/attractions?keyword=${encodeURIComponent(searchQuery)}`,
        );
        const data = await res.json();
        setArtistResults(data.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  async function selectArtist(artist: TicketmasterArtist) {
    setSelectedArtist(artist);
    setArtistResults([]);
    setSearchQuery("");
    setLoadingDates(true);
    try {
      const res = await fetch(`/api/ticketmaster/tour-dates?artist=${encodeURIComponent(artist.name)}`);
      const data = await res.json();
      setDates(data.results ?? []);
    } finally {
      setLoadingDates(false);
    }
  }

  function reset() {
    setSelectedArtist(null);
    setDates([]);
    setSelected(null);
  }

  // Closest to the user first; falls back to date order when we don't have
  // the user's location or a given show is missing coordinates.
  const sortedDates = useMemo(() => {
    return [...dates].sort((a, b) => {
      if (userCoords && a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
        const distA = distanceMiles(userCoords.lat, userCoords.lng, a.lat, a.lng);
        const distB = distanceMiles(userCoords.lat, userCoords.lng, b.lat, b.lng);
        if (distA !== distB) return distA - distB;
      }
      return a.date.localeCompare(b.date);
    });
  }, [dates, userCoords]);

  function distanceLabel(result: TicketmasterResult): string | null {
    if (!userCoords || result.lat == null || result.lng == null) return null;
    const miles = distanceMiles(userCoords.lat, userCoords.lng, result.lat, result.lng);
    return `${Math.round(miles)} mi away`;
  }

  async function handleSave() {
    if (!selected) return;
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be logged in.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("concerts")
      .insert({
        user_id: user.id,
        artist: selected.artist,
        venue: selected.venue || null,
        address: selected.address || null,
        city: selected.city || null,
        event_date: selected.date,
        ticket_vendor: selected.ticketVendor || null,
        ticket_url: selected.ticketUrl || null,
        image_url: selected.heroImageUrl ?? selected.imageUrl ?? null,
      })
      .select("id")
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await logActivityEvent(
      supabase,
      user.id,
      "concert_added",
      {
        artist: selected.artist,
        event_date: selected.date,
        venue: selected.venue,
        city: selected.city,
        image_url: selected.heroImageUrl ?? selected.imageUrl ?? null,
      },
      data.id,
    );

    router.push(`/concerts/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Add a concert</h1>

      {!selectedArtist && (
        <div>
          <label className="flex flex-col gap-1 text-sm">
            Artist
            <input
              type="text"
              placeholder="Search artist name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
            />
          </label>

          {searching && (
            <p className="mt-2 text-sm text-black/50 dark:text-white/50">Searching...</p>
          )}

          {artistResults.length > 0 && (
            <ul className="mt-2 divide-y divide-black/10 rounded-md border border-black/10 dark:divide-white/10 dark:border-white/20">
              {artistResults.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => selectArtist(result)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                  >
                    {result.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.imageUrl}
                        alt=""
                        className="h-10 w-10 flex-shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="h-10 w-10 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
                    )}
                    <span className="font-medium">{result.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedArtist && !selected && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            {selectedArtist.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedArtist.imageUrl}
                alt=""
                className="h-12 w-12 flex-shrink-0 rounded object-cover"
              />
            ) : (
              <span className="h-12 w-12 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
            )}
            <div>
              <p className="font-medium">{selectedArtist.name}</p>
              <button
                type="button"
                onClick={reset}
                className="text-xs underline text-black/60 dark:text-white/60"
              >
                Search a different artist
              </button>
            </div>
          </div>

          {loadingDates && (
            <p className="text-sm text-black/50 dark:text-white/50">Loading tour dates...</p>
          )}

          {!loadingDates && dates.length === 0 && (
            <p className="text-sm text-black/60 dark:text-white/60">
              No upcoming tour dates found for {selectedArtist.name}.
            </p>
          )}

          {sortedDates.length > 0 && (
            <ul className="divide-y divide-black/10 rounded-md border border-black/10 dark:divide-white/10 dark:border-white/20">
              {sortedDates.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(result)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="font-medium">{formatDisplayDate(result.date)}</span>
                      {distanceLabel(result) && (
                        <span className="text-xs text-black/50 dark:text-white/50">
                          {distanceLabel(result)}
                        </span>
                      )}
                    </span>
                    <span className="text-black/60 dark:text-white/60">
                      {[result.venue, result.city].filter(Boolean).join(", ")}
                    </span>
                    {result.address && (
                      <span className="text-xs text-black/50 dark:text-white/50">
                        {result.address}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {dates.some((d) => d.ticketVendor === "SeatGeek") && <SeatGeekAttribution />}
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-md border border-black/10 p-3 dark:border-white/20">
            {(selected.heroImageUrl ?? selected.imageUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.heroImageUrl ?? selected.imageUrl ?? undefined}
                alt=""
                className="h-16 w-16 flex-shrink-0 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{selected.artist}</p>
              <p className="text-black/60 dark:text-white/60">
                {formatDisplayDate(selected.date)}
              </p>
              {(selected.venue || selected.city) && (
                <p className="text-black/60 dark:text-white/60">
                  {[selected.venue, selected.city].filter(Boolean).join(", ")}
                </p>
              )}
              {selected.address && (
                <p className="text-xs text-black/50 dark:text-white/50">{selected.address}</p>
              )}
              {selected.ticketUrl && (
                <a
                  href={selected.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline text-black/60 dark:text-white/60"
                >
                  View {selected.ticketVendor ? `on ${selected.ticketVendor}` : "ticket link"} ↗
                </a>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelected(null)}
            className="self-start text-xs underline text-black/60 dark:text-white/60"
          >
            Choose a different date
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="mt-2 rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save concert"}
          </button>
        </div>
      )}
    </div>
  );
}
