"use client";

import { useEffect, useRef, useState } from "react";
import type { TicketmasterArtist } from "@/lib/ticketmaster";

// Searches Ticketmaster's attraction catalog (same search used everywhere
// else in the app to add a concert) rather than Spotify's — no login, no
// user cap, and the results are guaranteed to be artists nearby-show
// matching can actually work with.
export default function TicketmasterArtistSearchInput({
  placeholder,
  disabled,
  onSelect,
}: {
  placeholder: string;
  disabled?: boolean;
  onSelect: (artist: TicketmasterArtist) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TicketmasterArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/ticketmaster/attractions?keyword=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/20"
      />
      {(searching || results.length > 0) && query.trim() && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-black/10 bg-background shadow-lg dark:border-white/20">
          {searching && (
            <li className="px-2 py-1.5 text-sm text-black/50 dark:text-white/50">Searching...</li>
          )}
          {!searching &&
            results.map((artist) => (
              <li key={artist.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(artist);
                    setQuery("");
                    setResults([]);
                  }}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                >
                  {artist.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artist.imageUrl} alt="" className="h-6 w-6 flex-shrink-0 rounded object-cover" />
                  ) : (
                    <span className="h-6 w-6 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
                  )}
                  {artist.name}
                </button>
              </li>
            ))}
          {!searching && results.length === 0 && (
            <li className="px-2 py-1.5 text-sm text-black/50 dark:text-white/50">No matches found.</li>
          )}
        </ul>
      )}
    </div>
  );
}
