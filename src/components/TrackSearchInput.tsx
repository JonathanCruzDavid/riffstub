"use client";

import { useEffect, useRef, useState } from "react";
import type { SpotifyTrack } from "@/lib/spotify";

export default function TrackSearchInput({
  artistName,
  placeholder,
  disabled,
  showArtist = false,
  onSelect,
}: {
  artistName?: string;
  placeholder: string;
  disabled?: boolean;
  showArtist?: boolean;
  onSelect: (track: SpotifyTrack) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
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
        const artistParam = artistName ? `&artist=${encodeURIComponent(artistName)}` : "";
        const res = await fetch(
          `/api/spotify/search-tracks?query=${encodeURIComponent(query)}${artistParam}`,
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, artistName]);

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
            <li className="px-2 py-1.5 text-sm text-black/50 dark:text-white/50">
              Searching...
            </li>
          )}
          {!searching &&
            results.map((track) => (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(track);
                    setQuery("");
                    setResults([]);
                  }}
                  className="block w-full px-2 py-1.5 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                >
                  {track.name}
                  {showArtist && (
                    <span className="text-black/50 dark:text-white/50"> — {track.artist}</span>
                  )}
                </button>
              </li>
            ))}
          {!searching && results.length === 0 && (
            <li className="px-2 py-1.5 text-sm text-black/50 dark:text-white/50">
              No matches found.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
