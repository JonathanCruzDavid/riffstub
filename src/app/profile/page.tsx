import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSpotifyArtistData } from "@/lib/spotify";
import UpcomingConcertsList from "@/components/UpcomingConcertsList";
import PastConcertsList from "@/components/PastConcertsList";
import ProfileCustomizationPanel from "@/components/ProfileCustomizationPanel";
import FavoriteConcertCard from "@/components/FavoriteConcertCard";
import MostExcitedConcertCard from "@/components/MostExcitedConcertCard";
import type { Concert, FavoriteSong, LikedArtist } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, avatar_url, banner_url, favorite_song, favorite_song_artist, favorite_song_image_url, favorite_artist_name, favorite_artist_image_url, bio",
    )
    .eq("id", user!.id)
    .single();

  const { data: concerts } = await supabase
    .from("concerts")
    .select("*")
    .eq("user_id", user!.id)
    .order("event_date", { ascending: true })
    .returns<Concert[]>();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (concerts ?? []).filter((c) => c.event_date >= today);
  const past = (concerts ?? []).filter((c) => c.event_date < today);

  const { data: favoriteSongs } = await supabase
    .from("favorite_songs")
    .select("*")
    .eq("user_id", user!.id)
    .order("position", { ascending: true })
    .returns<FavoriteSong[]>();

  const { data: likedArtists } = await supabase
    .from("liked_artists")
    .select("*")
    .eq("user_id", user!.id)
    .order("position", { ascending: true })
    .returns<LikedArtist[]>();

  const { data: hiddenArtistRows } = await supabase
    .from("hidden_artists")
    .select("artist_id")
    .eq("user_id", user!.id);
  const hiddenArtistIds = new Set((hiddenArtistRows ?? []).map((h) => h.artist_id));

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", user!.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user!.id),
  ]);

  const spotifyData = await getSpotifyArtistData(supabase, user!.id);
  const allTopArtists = spotifyData?.topArtists ?? [];
  const topArtists = allTopArtists.filter((a) => !hiddenArtistIds.has(a.id));
  const hiddenArtists = allTopArtists.filter((a) => hiddenArtistIds.has(a.id));

  // Only a user's own uploaded banner can be used as a full-bleed background
  // with an overlay — Spotify's terms prohibit overlaying text/gradients or
  // blurring their artwork, so an artist photo (when no custom banner is
  // set) is shown separately, uncropped and un-overlaid, further down.
  const customBannerUrl = profile?.banner_url || null;

  const displayName = profile?.username ?? user?.email ?? "?";

  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-black/80 to-black/40 sm:h-56">
          {customBannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={customBannerUrl}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-x-6 gap-y-3 p-4 sm:p-6">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-14 w-14 flex-shrink-0 rounded-full border-2 border-white object-cover sm:h-16 sm:w-16"
                />
              ) : (
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-black/40 text-lg text-white sm:h-16 sm:w-16">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <h1 className="text-xl font-semibold text-white drop-shadow sm:text-2xl">
                {displayName}
              </h1>
            </div>

            <div className="ml-auto flex gap-6">
              <div className="text-white drop-shadow">
                <p className="text-2xl font-semibold">{upcoming.length}</p>
                <p className="text-xs uppercase tracking-wide text-white/80">Upcoming</p>
              </div>
              <div className="text-white drop-shadow">
                <p className="text-2xl font-semibold">{past.length}</p>
                <p className="text-xs uppercase tracking-wide text-white/80">Been to</p>
              </div>
              <div className="text-white drop-shadow">
                <p className="text-2xl font-semibold">{followerCount ?? 0}</p>
                <p className="text-xs uppercase tracking-wide text-white/80">Followers</p>
              </div>
              <div className="text-white drop-shadow">
                <p className="text-2xl font-semibold">{followingCount ?? 0}</p>
                <p className="text-xs uppercase tracking-wide text-white/80">Following</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <ProfileCustomizationPanel
          bio={profile?.bio ?? null}
          topArtists={topArtists}
          hiddenArtists={hiddenArtists}
          favoriteArtistName={profile?.favorite_artist_name ?? null}
          favoriteArtistImageUrl={profile?.favorite_artist_image_url ?? null}
          favoriteSongName={profile?.favorite_song ?? null}
          favoriteSongArtist={profile?.favorite_song_artist ?? null}
          favoriteSongImageUrl={profile?.favorite_song_image_url ?? null}
          favoriteSongs={favoriteSongs ?? []}
          likedArtists={likedArtists ?? []}
          spotifyConnected={!!spotifyData}
        />

        <div className="mt-10 flex flex-col gap-10">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FavoriteConcertCard pastConcerts={past} />
            <MostExcitedConcertCard upcomingConcerts={upcoming} />
          </section>

          <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
                Upcoming concerts
              </h2>
              <UpcomingConcertsList initialConcerts={upcoming} />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
                  Past Concerts
                </h2>
                <Link href="/concerts/new/past" className="text-sm underline">
                  + Add a past concert
                </Link>
              </div>
              <PastConcertsList initialConcerts={past} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
