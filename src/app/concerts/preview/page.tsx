import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtistCatalog } from "@/lib/spotify";
import { getFollowedAttendees } from "@/lib/activity";
import { createClient } from "@/lib/supabase/server";
import ArtistShowPanel from "@/components/ArtistShowPanel";

export default async function ConcertPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const artistName = params.artist;

  if (!artistName) {
    notFound();
  }

  const eventDate = params.date ?? "";
  const venue = params.venue || null;
  const address = params.address || null;
  const city = params.city || null;
  const ticketUrl = params.ticketUrl || null;
  const ticketVendor = params.ticketVendor || null;
  const imageUrl = params.imageUrl || null;

  const catalog = await getArtistCatalog(artistName);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const followedAttendees =
    user && eventDate ? await getFollowedAttendees(supabase, user.id, artistName, eventDate) : [];

  const addParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) addParams.set(key, value);
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <ArtistShowPanel
        artistName={artistName}
        eventDate={eventDate}
        venue={venue}
        city={city}
        address={address}
        ticketUrl={ticketUrl}
        ticketVendor={ticketVendor}
        imageUrl={imageUrl}
        topTracks={catalog.topTracks}
        topTracksError={catalog.topTracksError}
        albums={catalog.albums}
        albumsError={catalog.albumsError}
        artistSpotifyUrl={catalog.artist?.spotifyUrl}
        followedAttendees={followedAttendees}
        headerAction={
          user ? (
            <Link
              href={`/concerts/new?${addParams.toString()}`}
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
            >
              + Add to my list
            </Link>
          ) : (
            <Link
              href={`/signup?${addParams.toString()}`}
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
            >
              Sign up to track this show
            </Link>
          )
        }
      />
    </div>
  );
}
