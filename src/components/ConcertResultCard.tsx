import Link from "next/link";
import { formatDisplayDate } from "@/lib/format";
import type { TicketmasterResult } from "@/lib/ticketmaster";

export default function ConcertResultCard({ concert }: { concert: TicketmasterResult }) {
  // Prefer the largest available image — the ~300px thumbnail looks blurry
  // once it's stretched across a full-width poster card or the detail/
  // preview page's big hero image.
  const displayImageUrl = concert.heroImageUrl ?? concert.imageUrl;

  const addParams = new URLSearchParams({
    artist: concert.artist,
    venue: concert.venue ?? "",
    address: concert.address ?? "",
    city: concert.city ?? "",
    date: concert.date,
    ticketVendor: concert.ticketVendor,
    ticketUrl: concert.ticketUrl,
    imageUrl: displayImageUrl ?? "",
  });

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-black/10 transition-colors hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.05]">
      <Link
        href={`/concerts/preview?${addParams.toString()}`}
        className="absolute inset-0 z-10"
        aria-label={`View ${concert.artist} details`}
      />

      <div className="relative aspect-[4/3] w-full flex-shrink-0 bg-black/10 dark:bg-white/10">
        {displayImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          // Absolutely positioned so the image's own intrinsic aspect ratio
          // can never leak into this flex child's auto-sizing and override
          // the fixed 4:3 box — that's what was causing images with unusual
          // native proportions (e.g. a square or ultra-wide photo) to render
          // at their own natural height instead of the intended 4:3 size,
          // throwing off row alignment.
          <img src={displayImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>

      <div className="p-3">
        <p className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
          {formatDisplayDate(concert.date)}
        </p>
        <p className="font-medium">{concert.artist}</p>
        {(concert.venue || concert.city) && (
          <p className="truncate text-sm text-black/60 dark:text-white/60">
            {[concert.venue, concert.city].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/[.06] p-3 dark:border-white/[.08]">
        <span className="truncate text-xs text-black/50 dark:text-white/50">
          {concert.address ?? ""}
        </span>
        <a
          href={concert.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-20 flex-shrink-0 whitespace-nowrap text-xs underline text-black/50 dark:text-white/50"
        >
          Tickets ↗
        </a>
      </div>
    </div>
  );
}
