"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SpotifyArtist } from "@/lib/spotify";

const DISPLAY_COUNT = 8;

export default function TopArtistsSection({
  initialArtists,
  initialHiddenArtists,
  editMode,
}: {
  initialArtists: SpotifyArtist[];
  initialHiddenArtists: SpotifyArtist[];
  editMode: boolean;
}) {
  const supabase = createClient();
  const [pool, setPool] = useState(initialArtists);
  const [hidden, setHidden] = useState(initialHiddenArtists);

  async function handleHide(artist: SpotifyArtist) {
    setPool((prev) => prev.filter((a) => a.id !== artist.id));
    setHidden((prev) => [...prev, artist]);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("hidden_artists").insert({ user_id: user.id, artist_id: artist.id });
  }

  async function handleUnhide(artist: SpotifyArtist) {
    setHidden((prev) => prev.filter((a) => a.id !== artist.id));
    setPool((prev) => [...prev, artist]);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("hidden_artists")
      .delete()
      .eq("user_id", user.id)
      .eq("artist_id", artist.id);
  }

  const visible = pool.slice(0, DISPLAY_COUNT);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {visible.map((artist) => (
          <div key={artist.id} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              {artist.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artist.imageUrl}
                  alt=""
                  className="h-10 w-10 flex-shrink-0 rounded object-cover"
                />
              ) : (
                <span className="h-10 w-10 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
              )}
              <span className="truncate text-sm font-medium">{artist.name}</span>
            </div>
            {editMode && (
              <button
                type="button"
                onClick={() => handleHide(artist)}
                className="flex-shrink-0 text-xs text-black/40 hover:text-red-600 dark:text-white/40"
              >
                hide
              </button>
            )}
          </div>
        ))}
      </div>

      {editMode && hidden.length > 0 && (
        <div className="mt-4 border-t border-black/10 pt-3 dark:border-white/10">
          <p className="mb-2 text-xs font-medium text-black/50 dark:text-white/50">
            Hidden artists
          </p>
          <div className="flex flex-col gap-2">
            {hidden.map((artist) => (
              <div key={artist.id} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  {artist.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artist.imageUrl}
                      alt=""
                      className="h-8 w-8 flex-shrink-0 rounded object-cover opacity-50"
                    />
                  ) : (
                    <span className="h-8 w-8 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
                  )}
                  <span className="truncate text-sm text-black/50 dark:text-white/50">
                    {artist.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnhide(artist)}
                  className="flex-shrink-0 text-xs text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                >
                  unhide
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
