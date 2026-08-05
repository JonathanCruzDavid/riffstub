"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "users" | "artists";

type UserResult = { id: string; username: string; avatar_url: string | null };
type ArtistResult = { id: string; name: string; imageUrl: string | null; heroImageUrl: string | null };

const MODE_LABELS: Record<Mode, string> = { users: "Users", artists: "Artists" };

export default function NavSearch({ artistOnly = false }: { artistOnly?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("artists");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [artistResults, setArtistResults] = useState<ArtistResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setUserResults([]);
      setArtistResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (mode === "users") {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setUserResults(data.results ?? []);
      } else {
        const res = await fetch(`/api/ticketmaster/attractions?keyword=${encodeURIComponent(query)}`);
        const data = await res.json();
        setArtistResults(data.results ?? []);
      }
      setOpen(true);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setModeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setModeMenuOpen(false);
    setUserResults([]);
    setArtistResults([]);
    setOpen(false);
  }

  function goToUser(username: string) {
    setOpen(false);
    setQuery("");
    router.push(`/u/${username}`);
  }

  function goToArtist(artist: ArtistResult) {
    setOpen(false);
    setQuery("");
    const params = new URLSearchParams({ artist: artist.name });
    const image = artist.heroImageUrl ?? artist.imageUrl;
    if (image) params.set("imageUrl", image);
    router.push(`/concerts/preview?${params.toString()}`);
  }

  const results = mode === "users" ? userResults : artistResults;

  return (
    <div ref={containerRef} className={`relative flex w-full min-w-0 ${artistOnly ? "max-w-[150px]" : "max-w-[280px]"}`}>
      {!artistOnly && (
        <button
          type="button"
          onClick={() => setModeMenuOpen((o) => !o)}
          className="flex flex-shrink-0 items-center gap-1 rounded-l-full border border-r-0 border-black/10 bg-black/[.03] px-3 py-1.5 text-xs text-black/60 dark:border-white/15 dark:bg-white/[.05] dark:text-white/60"
        >
          {MODE_LABELS[mode]}
          <span className="text-[10px]">▾</span>
        </button>
      )}

      <input
        type="text"
        placeholder={mode === "users" ? "Search users..." : "Search artists..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className={`w-full min-w-0 border border-black/10 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-white/[.03] ${artistOnly ? "rounded-full" : "rounded-r-full"}`}
      />

      {!artistOnly && modeMenuOpen && (
        <ul className="absolute left-0 top-full z-40 mt-1 w-28 divide-y divide-black/10 rounded-md border border-black/10 bg-white shadow-lg dark:divide-white/10 dark:border-white/20 dark:bg-black">
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <li key={m}>
              <button
                type="button"
                onClick={() => switchMode(m)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
              >
                {MODE_LABELS[m]}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && results.length > 0 && (
        <ul className="absolute right-0 top-full z-40 mt-1 w-64 divide-y divide-black/10 rounded-md border border-black/10 bg-white shadow-lg dark:divide-white/10 dark:border-white/20 dark:bg-black">
          {mode === "users"
            ? userResults.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => goToUser(r.username)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                  >
                    {r.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.avatar_url}
                        alt=""
                        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black/10 text-xs dark:bg-white/10">
                        {r.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="truncate font-medium">{r.username}</span>
                  </button>
                </li>
              ))
            : artistResults.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => goToArtist(a)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                  >
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.imageUrl}
                        alt=""
                        className="h-8 w-8 flex-shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="h-8 w-8 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
                    )}
                    <span className="truncate font-medium">{a.name}</span>
                  </button>
                </li>
              ))}
        </ul>
      )}
    </div>
  );
}
