"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TrackSearchInput from "@/components/TrackSearchInput";
import { logActivityEvent } from "@/lib/activity";
import type { SpotifyTrack } from "@/lib/spotify";

export default function FavoriteSongPicker({
  initialSongName,
  initialArtistName,
  initialImageUrl,
  editMode,
}: {
  initialSongName: string | null;
  initialArtistName: string | null;
  initialImageUrl: string | null;
  editMode: boolean;
}) {
  const supabase = createClient();
  const [songName, setSongName] = useState(initialSongName);
  const [artistName, setArtistName] = useState(initialArtistName);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);

  async function handleSelect(track: SpotifyTrack) {
    setSongName(track.name);
    setArtistName(track.artist);
    setImageUrl(track.largeImageUrl ?? track.imageUrl);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        favorite_song: track.name,
        favorite_song_artist: track.artist,
        favorite_song_image_url: track.largeImageUrl ?? track.imageUrl,
      })
      .eq("id", user.id);

    await logActivityEvent(supabase, user.id, "favorite_song_changed", {
      song_name: track.name,
      artist_name: track.artist,
      image_url: track.largeImageUrl ?? track.imageUrl,
    });
  }

  async function handleClear() {
    setSongName(null);
    setArtistName(null);
    setImageUrl(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ favorite_song: null, favorite_song_artist: null, favorite_song_image_url: null })
      .eq("id", user.id);
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        Favorite song
      </h2>
      {songName ? (
        <div className="flex items-center gap-3">
          {imageUrl && (
            // Shown at its original aspect ratio, un-cropped, with nothing
            // overlaid on top, per Spotify's artwork guidelines.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-32 w-32 flex-shrink-0 rounded object-contain"
            />
          )}
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{songName}</p>
              {artistName && (
                <p className="truncate text-black/50 dark:text-white/50">{artistName}</p>
              )}
            </div>
            {editMode && (
              <button
                type="button"
                onClick={handleClear}
                className="flex-shrink-0 text-xs text-black/40 hover:text-red-600 dark:text-white/40"
              >
                change
              </button>
            )}
          </div>
        </div>
      ) : editMode ? (
        <TrackSearchInput placeholder="Search for a song..." showArtist onSelect={handleSelect} />
      ) : (
        <p className="text-sm text-black/60 dark:text-white/60">Not set yet.</p>
      )}
    </section>
  );
}
