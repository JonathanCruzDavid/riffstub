import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getArtistCatalog } from "@/lib/spotify";
import { getFollowedAttendees } from "@/lib/activity";
import DeleteConcertButton from "@/components/DeleteConcertButton";
import CoverPhotoUpload from "@/components/CoverPhotoUpload";
import ArtistShowPanel from "@/components/ArtistShowPanel";
import type { Concert } from "@/lib/types";

export default async function ConcertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: concert } = await supabase
    .from("concerts")
    .select("*")
    .eq("id", id)
    .single<Concert>();

  if (!concert) {
    notFound();
  }

  const catalog = await getArtistCatalog(concert.artist);

  const today = new Date().toISOString().slice(0, 10);
  const isPast = concert.event_date < today;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const followedAttendees = user
    ? await getFollowedAttendees(supabase, user.id, concert.artist, concert.event_date)
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <ArtistShowPanel
        artistName={concert.artist}
        eventDate={concert.event_date}
        venue={concert.venue}
        city={concert.city}
        address={concert.address}
        ticketUrl={concert.ticket_url}
        ticketVendor={concert.ticket_vendor}
        imageUrl={concert.image_url}
        notes={concert.notes}
        topTracks={catalog.topTracks}
        topTracksError={catalog.topTracksError}
        albums={catalog.albums}
        albumsError={catalog.albumsError}
        artistSpotifyUrl={catalog.artist?.spotifyUrl}
        followedAttendees={followedAttendees}
        headerAction={
          <div className="flex items-center gap-3">
            {isPast && (
              <CoverPhotoUpload concertId={concert.id} hasImage={!!concert.image_url} />
            )}
            <DeleteConcertButton concertId={concert.id} />
          </div>
        }
      />
    </div>
  );
}
