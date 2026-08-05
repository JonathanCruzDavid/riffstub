"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TicketmasterArtistSearchInput from "@/components/TicketmasterArtistSearchInput";
import type { TicketmasterArtist } from "@/lib/ticketmaster";
import type { LikedArtist } from "@/lib/types";

const MAX_LIKED_ARTISTS = 30;

// This list is what drives "shows near you" matching now — see
// NearbyArtistMatches. Searched via Ticketmaster (same search used to add a
// concert) rather than pulled from a connected Spotify account, since
// Spotify's login-based artist data only ever covers a small, capped set of
// accounts.
export default function LikedArtistsList({
  initialArtists,
  editMode,
}: {
  initialArtists: LikedArtist[];
  editMode: boolean;
}) {
  const supabase = createClient();
  const [artists, setArtists] = useState(initialArtists);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(artist: TicketmasterArtist) {
    if (artists.length >= MAX_LIKED_ARTISTS) return;
    setAdding(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAdding(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("liked_artists")
      .insert({
        user_id: user.id,
        artist_name: artist.name,
        image_url: artist.heroImageUrl ?? artist.imageUrl,
        position: artists.length,
      })
      .select("*")
      .single();

    setAdding(false);

    if (insertError) {
      setError(insertError.code === "23505" ? "Already on your list." : "Couldn't add that artist.");
      return;
    }

    if (data) {
      setArtists((prev) => [...prev, data as LikedArtist]);
    }
  }

  async function handleRemove(id: string) {
    setArtists((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("liked_artists").delete().eq("id", id);
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        Artists you like ({artists.length}/{MAX_LIKED_ARTISTS})
      </h2>
      {artists.length > 0 ? (
        <ul className="mb-3 flex flex-col gap-2">
          {artists.map((artist) => (
            <li key={artist.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                {artist.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artist.image_url}
                    alt=""
                    className="h-10 w-10 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="h-10 w-10 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
                )}
                <p className="truncate font-medium">{artist.artist_name}</p>
              </div>
              {editMode && (
                <button
                  type="button"
                  onClick={() => handleRemove(artist.id)}
                  className="flex-shrink-0 text-xs text-black/40 hover:text-red-600 dark:text-white/40"
                >
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !editMode && (
          <p className="text-sm text-black/60 dark:text-white/60">No artists added yet.</p>
        )
      )}
      {editMode && artists.length < MAX_LIKED_ARTISTS && (
        <>
          <TicketmasterArtistSearchInput
            placeholder="Add an artist to your list..."
            disabled={adding}
            onSelect={handleAdd}
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </>
      )}
    </section>
  );
}
