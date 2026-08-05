"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TrackSearchInput from "@/components/TrackSearchInput";
import type { SpotifyTrack } from "@/lib/spotify";
import type { FavoriteSong } from "@/lib/types";

const MAX_LIKED_SONGS = 5;

export default function LikedSongsList({
  initialSongs,
  editMode,
}: {
  initialSongs: FavoriteSong[];
  editMode: boolean;
}) {
  const supabase = createClient();
  const [songs, setSongs] = useState(initialSongs);
  const [adding, setAdding] = useState(false);

  async function handleAdd(track: SpotifyTrack) {
    if (songs.length >= MAX_LIKED_SONGS) return;
    setAdding(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAdding(false);
      return;
    }

    const { data, error } = await supabase
      .from("favorite_songs")
      .insert({
        user_id: user.id,
        song_name: track.name,
        artist_name: track.artist,
        image_url: track.imageUrl,
        position: songs.length,
      })
      .select("*")
      .single();

    setAdding(false);

    if (!error && data) {
      setSongs((prev) => [...prev, data as FavoriteSong]);
    }
  }

  async function handleRemove(id: string) {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("favorite_songs").delete().eq("id", id);
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        Songs you like ({songs.length}/{MAX_LIKED_SONGS})
      </h2>
      {songs.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {songs.map((song) => (
            <li key={song.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                {song.image_url ? (
                  // Shown at its original aspect ratio, un-cropped, with
                  // nothing overlaid on top, per Spotify's artwork guidelines.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={song.image_url}
                    alt=""
                    className="h-16 w-16 flex-shrink-0 rounded object-contain"
                  />
                ) : (
                  <span className="h-16 w-16 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{song.song_name}</p>
                  <p className="truncate text-black/50 dark:text-white/50">{song.artist_name}</p>
                </div>
              </div>
              {editMode && (
                <button
                  type="button"
                  onClick={() => handleRemove(song.id)}
                  className="flex-shrink-0 text-xs text-black/40 hover:text-red-600 dark:text-white/40"
                >
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editMode && songs.length < MAX_LIKED_SONGS && (
        <TrackSearchInput
          placeholder="Search for a song..."
          disabled={adding}
          showArtist
          onSelect={handleAdd}
        />
      )}
    </section>
  );
}
