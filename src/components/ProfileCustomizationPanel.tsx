"use client";

import { useState } from "react";
import TopArtistsSection from "@/components/TopArtistsSection";
import AboutMeSection from "@/components/AboutMeSection";
import FavoriteArtistPicker from "@/components/FavoriteArtistPicker";
import FavoriteSongPicker from "@/components/FavoriteSongPicker";
import LikedSongsList from "@/components/LikedSongsList";
import LikedArtistsList from "@/components/LikedArtistsList";
import SpotifyAttribution from "@/components/SpotifyAttribution";
import type { SpotifyArtist } from "@/lib/spotify";
import type { FavoriteSong, LikedArtist } from "@/lib/types";

export default function ProfileCustomizationPanel({
  bio,
  topArtists,
  hiddenArtists,
  favoriteArtistName,
  favoriteArtistImageUrl,
  favoriteSongName,
  favoriteSongArtist,
  favoriteSongImageUrl,
  favoriteSongs,
  likedArtists,
  spotifyConnected,
}: {
  bio: string | null;
  topArtists: SpotifyArtist[];
  hiddenArtists: SpotifyArtist[];
  favoriteArtistName: string | null;
  favoriteArtistImageUrl: string | null;
  favoriteSongName: string | null;
  favoriteSongArtist: string | null;
  favoriteSongImageUrl: string | null;
  favoriteSongs: FavoriteSong[];
  likedArtists: LikedArtist[];
  spotifyConnected: boolean;
}) {
  const [editMode, setEditMode] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <AboutMeSection initialBio={bio} editMode={editMode} />
        <button
          type="button"
          onClick={() => setEditMode((e) => !e)}
          className="flex-shrink-0 rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20"
        >
          {editMode ? "Done" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Spotify's own login flow caps how many accounts can ever connect
            (see the liked_artists schema comment), so this only renders for
            someone who's already connected — showing a "Connect Spotify"
            prompt to everyone else would be a dead end for almost all of
            them. Connecting is still available from Account Settings. */}
        {spotifyConnected && (
          <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
              Your top artists
            </h2>
            <TopArtistsSection
              initialArtists={topArtists}
              initialHiddenArtists={hiddenArtists}
              editMode={editMode}
            />
            <SpotifyAttribution />
          </div>
        )}

        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <FavoriteArtistPicker
              initialArtistName={favoriteArtistName}
              initialImageUrl={favoriteArtistImageUrl}
              editMode={editMode}
            />
            <SpotifyAttribution />
          </div>

          <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <FavoriteSongPicker
              initialSongName={favoriteSongName}
              initialArtistName={favoriteSongArtist}
              initialImageUrl={favoriteSongImageUrl}
              editMode={editMode}
            />
            <SpotifyAttribution />
          </div>
        </div>

        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <LikedSongsList initialSongs={favoriteSongs} editMode={editMode} />
          <SpotifyAttribution />
        </div>

        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <LikedArtistsList initialArtists={likedArtists} editMode={editMode} />
          <p className="mt-2 text-xs text-black/40 dark:text-white/40">
            Drives which nearby shows get matched to you.
          </p>
        </div>
      </div>
    </div>
  );
}
