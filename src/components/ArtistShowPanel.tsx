import type { ReactNode } from "react";
import SpotifyAttribution from "@/components/SpotifyAttribution";
import ArtistTourDates from "@/components/ArtistTourDates";
import FollowedGoingBadge, { type FollowedAttendee } from "@/components/FollowedGoingBadge";
import type { SpotifyTrack, SpotifyAlbum } from "@/lib/spotify";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatEventDate(eventDate: string): string | null {
  if (!eventDate) return null;
  const parsed = new Date(`${eventDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return dateFormatter.format(parsed);
}

const RANK_GRADIENTS = [
  "from-blue-500 to-indigo-500",
  "from-indigo-500 to-violet-500",
  "from-violet-500 to-purple-500",
  "from-cyan-500 to-blue-500",
  "from-teal-500 to-cyan-500",
  "from-sky-500 to-indigo-500",
  "from-orange-500 to-red-500",
  "from-amber-500 to-orange-500",
  "from-red-500 to-orange-500",
  "from-purple-500 to-indigo-500",
];

function SpotifyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#fff" />
      <path
        d="M17.5 16.6c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.5-.5 10.3 1.2.3.2.4.6.2.9zm1.2-2.7c-.2.4-.7.5-1.1.3-2.9-1.8-7.3-2.3-10.7-1.3-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.9-1.2 8.7-.6 12 1.4.4.2.5.7.3 1.1zm.1-2.8C15.2 9 8.9 8.8 5.3 9.9c-.5.2-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 4.1-1.2 11-1 14.9 1.3.5.3.6.9.3 1.4-.3.4-.9.5-1.4.3z"
        fill="#1DB954"
      />
    </svg>
  );
}

// Shared by the saved-concert detail page and the not-yet-saved show preview
// page — the Ticketmaster-sourced event info (read-only) plus this artist's
// Spotify songs and albums are identical in both places; only the header
// action (Delete vs. Add to my list) and what renders below differ.
export default function ArtistShowPanel({
  artistName,
  eventDate,
  venue,
  city,
  address,
  ticketUrl,
  ticketVendor,
  imageUrl,
  notes,
  topTracks,
  topTracksError,
  albums,
  albumsError,
  artistSpotifyUrl,
  headerAction,
  followedAttendees,
}: {
  artistName: string;
  eventDate: string;
  venue: string | null;
  city: string | null;
  address: string | null;
  ticketUrl: string | null;
  ticketVendor: string | null;
  imageUrl: string | null;
  notes?: string | null;
  topTracks: SpotifyTrack[];
  topTracksError?: boolean;
  albums: SpotifyAlbum[];
  albumsError?: boolean;
  artistSpotifyUrl?: string | null;
  headerAction?: ReactNode;
  followedAttendees?: FollowedAttendee[];
}) {
  const displayDate = formatEventDate(eventDate);

  return (
    <>
      {/* Full-bleed hero, sourced from Ticketmaster — shown read-only, since
          this isn't user-editable data. Kept as a pure image (no text
          overlay) since legibility against an arbitrary photo isn't
          reliable — the actual event details render below it instead. */}
      <div className="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 sm:aspect-[3/1]">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>

      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-4xl">{artistName}</h1>
          {displayDate && (
            <p className="mt-1 text-black/70 dark:text-white/70 sm:text-lg">{displayDate}</p>
          )}
          {(venue || city) && (
            <p className="text-black/70 dark:text-white/70">
              {[venue, city].filter(Boolean).join(" · ")}
            </p>
          )}
          {address && (
            <p className="mt-1 text-sm text-black/50 dark:text-white/50">{address}</p>
          )}
          {ticketUrl && (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm font-medium text-blue-600 underline dark:text-blue-400"
            >
              {ticketVendor || "Ticket link"} ↗
            </a>
          )}
          {followedAttendees && <FollowedGoingBadge attendees={followedAttendees} />}
          {notes && (
            <p className="mt-3 max-w-lg text-sm text-black/70 dark:text-white/70">{notes}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          {artistSpotifyUrl && (
            <a
              href={artistSpotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-[#1ed760]"
            >
              <SpotifyLogo className="h-5 w-5 flex-shrink-0" />
              Open in Spotify
            </a>
          )}
          {headerAction}
        </div>
      </div>

      {/* Spotify catalog data for this artist. Top songs is a plain text
          list so it doesn't need as much width as the album art grid. */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Top songs
          </h2>
          {topTracks.length > 0 ? (
            <ol className="flex flex-col gap-1">
              {topTracks.map((track, i) => {
                const row = (
                  <>
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${RANK_GRADIENTS[i % RANK_GRADIENTS.length]} text-xs font-bold text-white`}
                    >
                      {i + 1}
                    </span>
                    {track.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.imageUrl}
                        alt=""
                        className="h-10 w-10 flex-shrink-0 rounded object-contain"
                      />
                    ) : (
                      <span className="h-10 w-10 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
                    )}
                    <span className="truncate">{track.name}</span>
                  </>
                );

                return (
                  <li key={track.id}>
                    {track.spotifyUrl ? (
                      <a
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="-mx-1 flex items-center gap-3 rounded-md px-1 py-1 text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                      >
                        {row}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 px-1 py-1 text-sm">{row}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-black/50 dark:text-white/50">
              {topTracksError
                ? "Couldn't load songs right now — try refreshing."
                : "No song data available for this artist."}
            </p>
          )}
          <SpotifyAttribution />
        </section>

        <section className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Albums
          </h2>
          {albums.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {albums.map((album) => {
                const cover = album.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.imageUrl}
                    alt=""
                    className="aspect-square w-full rounded-md object-contain shadow-sm"
                  />
                ) : (
                  <span className="flex aspect-square w-full items-center justify-center rounded-md bg-black/10 dark:bg-white/10" />
                );

                return (
                  <div key={album.id}>
                    {album.spotifyUrl ? (
                      <a
                        href={album.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block transition-transform hover:scale-105"
                      >
                        {cover}
                      </a>
                    ) : (
                      cover
                    )}
                    <p className="mt-1 truncate text-xs font-medium">{album.name}</p>
                    {album.releaseDate && (
                      <p className="text-xs text-black/50 dark:text-white/50">
                        {album.releaseDate.slice(0, 4)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-black/50 dark:text-white/50">
              {albumsError
                ? "Couldn't load albums right now — try refreshing."
                : "No album data available for this artist."}
            </p>
          )}
          <SpotifyAttribution />
        </section>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Tour dates
        </h2>
        <ArtistTourDates artistName={artistName} excludeDate={eventDate} excludeVenue={venue} />
      </div>
    </>
  );
}
