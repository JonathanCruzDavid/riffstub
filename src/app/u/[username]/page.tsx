import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SpotifyAttribution from "@/components/SpotifyAttribution";
import LikedSongsList from "@/components/LikedSongsList";
import LikedArtistsList from "@/components/LikedArtistsList";
import FollowButton from "@/components/FollowButton";
import ReportButton from "@/components/ReportButton";
import type { FavoriteSong, LikedArtist, ProfilePreview } from "@/lib/types";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, avatar_url, banner_url, bio, favorite_song, favorite_song_artist, favorite_song_image_url, favorite_artist_name, favorite_artist_image_url, is_private",
    )
    .eq("username", username)
    .maybeSingle();

  // RLS hides the full row for a private profile you don't own. Fall back to
  // a minimal preview (id/username/avatar) via a security-definer RPC so a
  // private account can still be found and sent a follow request.
  if (!profile) {
    const { data: preview } = await supabase
      .rpc("get_profile_preview", { lookup_username: username })
      .returns<ProfilePreview[]>()
      .maybeSingle();

    if (!preview || !viewer || viewer.id === preview.id) {
      notFound();
    }

    let hasPendingRequest = false;
    const { data: existingRequest } = await supabase
      .from("follow_requests")
      .select("requester_id")
      .eq("requester_id", viewer.id)
      .eq("target_id", preview.id)
      .maybeSingle();
    hasPendingRequest = !!existingRequest;

    const displayName = preview.username ?? "?";

    return (
      <div className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
          {preview.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.avatar_url}
              alt=""
              className="mx-auto h-16 w-16 rounded-full border-2 border-black/10 object-cover dark:border-white/10"
            />
          ) : (
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-black/10 bg-black/5 text-lg dark:border-white/10 dark:bg-white/5">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <h1 className="mt-4 text-xl font-semibold">{displayName}</h1>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            This account is private. Follow to see their profile.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <FollowButton
              targetUserId={preview.id}
              targetIsPrivate
              initialIsFollowing={false}
              initialHasPendingRequest={hasPendingRequest}
            />
            <ReportButton
              targetType="account"
              targetId={preview.id}
              className="text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
            />
          </div>
        </div>
      </div>
    );
  }

  const [{ data: favoriteSongs }, { data: likedArtists }] = await Promise.all([
    supabase
      .from("favorite_songs")
      .select("*")
      .eq("user_id", profile.id)
      .order("position", { ascending: true })
      .returns<FavoriteSong[]>(),
    supabase
      .from("liked_artists")
      .select("*")
      .eq("user_id", profile.id)
      .order("position", { ascending: true })
      .returns<LikedArtist[]>(),
  ]);

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
  ]);

  let alreadyFollowing = false;
  let hasPendingRequest = false;
  if (viewer && viewer.id !== profile.id) {
    const [{ data: existingFollow }, { data: existingRequest }] = await Promise.all([
      supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewer.id)
        .eq("followee_id", profile.id)
        .maybeSingle(),
      supabase
        .from("follow_requests")
        .select("requester_id")
        .eq("requester_id", viewer.id)
        .eq("target_id", profile.id)
        .maybeSingle(),
    ]);
    alreadyFollowing = !!existingFollow;
    hasPendingRequest = !!existingRequest;
  }

  const displayName = profile.username ?? "?";
  // A user's own concert history is private (not covered by the "profiles
  // are public" policy), so it deliberately doesn't appear here — this page
  // only shows the same public bio/favorites fields the profile owner chose
  // to fill in.
  const customBannerUrl = profile.banner_url || null;

  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-4xl px-4 pt-6">
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gradient-to-br from-black/80 to-black/40 sm:h-48">
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
              {profile.avatar_url ? (
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

            <div className="ml-auto flex items-center gap-6">
              <div className="text-white drop-shadow">
                <p className="text-2xl font-semibold">{followerCount ?? 0}</p>
                <p className="text-xs uppercase tracking-wide text-white/80">Followers</p>
              </div>
              <div className="text-white drop-shadow">
                <p className="text-2xl font-semibold">{followingCount ?? 0}</p>
                <p className="text-xs uppercase tracking-wide text-white/80">Following</p>
              </div>
              {viewer && viewer.id !== profile.id && (
                <div className="flex flex-col items-end gap-1">
                  <FollowButton
                    targetUserId={profile.id}
                    targetIsPrivate={profile.is_private}
                    initialIsFollowing={alreadyFollowing}
                    initialHasPendingRequest={hasPendingRequest}
                  />
                  <ReportButton
                    targetType="account"
                    targetId={profile.id}
                    className="text-white/70 drop-shadow hover:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {profile.bio && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
              About
            </h2>
            <p className="text-sm text-black/70 dark:text-white/70">{profile.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
              Favorite artist
            </h2>
            {profile.favorite_artist_name ? (
              <div className="flex items-center gap-3">
                {profile.favorite_artist_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.favorite_artist_image_url}
                    alt=""
                    className="h-20 w-20 flex-shrink-0 rounded object-contain"
                  />
                )}
                <span className="text-sm">{profile.favorite_artist_name}</span>
              </div>
            ) : (
              <p className="text-sm text-black/60 dark:text-white/60">Not set yet.</p>
            )}
            <SpotifyAttribution />
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
              Favorite song
            </h2>
            {profile.favorite_song ? (
              <div className="flex items-center gap-3">
                {profile.favorite_song_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.favorite_song_image_url}
                    alt=""
                    className="h-20 w-20 flex-shrink-0 rounded object-contain"
                  />
                )}
                <div className="min-w-0 text-sm">
                  <p className="truncate">{profile.favorite_song}</p>
                  {profile.favorite_song_artist && (
                    <p className="truncate text-black/50 dark:text-white/50">
                      {profile.favorite_song_artist}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-black/60 dark:text-white/60">Not set yet.</p>
            )}
            <SpotifyAttribution />
          </div>

          <div className="card p-4">
            <LikedSongsList initialSongs={favoriteSongs ?? []} editMode={false} />
            <SpotifyAttribution />
          </div>

          <div className="card p-4">
            <LikedArtistsList initialArtists={likedArtists ?? []} editMode={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
