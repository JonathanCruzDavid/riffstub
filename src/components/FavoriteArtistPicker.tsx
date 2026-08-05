"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ArtistSearchInput from "@/components/ArtistSearchInput";
import { logActivityEvent } from "@/lib/activity";
import type { SpotifyArtist } from "@/lib/spotify";

export default function FavoriteArtistPicker({
  initialArtistName,
  initialImageUrl,
  editMode,
}: {
  initialArtistName: string | null;
  initialImageUrl: string | null;
  editMode: boolean;
}) {
  const supabase = createClient();
  const [artistName, setArtistName] = useState(initialArtistName);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);

  async function handleSelect(artist: SpotifyArtist) {
    setArtistName(artist.name);
    setImageUrl(artist.heroImageUrl ?? artist.imageUrl);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        favorite_artist_name: artist.name,
        favorite_artist_image_url: artist.heroImageUrl ?? artist.imageUrl,
      })
      .eq("id", user.id);

    await logActivityEvent(supabase, user.id, "favorite_artist_changed", {
      artist_name: artist.name,
      image_url: artist.heroImageUrl ?? artist.imageUrl,
    });
  }

  async function handleClear() {
    setArtistName(null);
    setImageUrl(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ favorite_artist_name: null, favorite_artist_image_url: null })
      .eq("id", user.id);
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        Favorite artist
      </h2>
      {artistName ? (
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
            <span className="truncate">{artistName}</span>
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
        <ArtistSearchInput placeholder="Search for an artist..." onSelect={handleSelect} />
      ) : (
        <p className="text-sm text-black/60 dark:text-white/60">Not set yet.</p>
      )}
    </section>
  );
}
