import Link from "next/link";
import type { TicketmasterResult } from "@/lib/ticketmaster";

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// A compact "ticket stub" row for listing multiple dates from the SAME
// artist — unlike ConcertResultCard's poster style, it skips the repeated
// artist photo entirely and leads with a colored month/day badge instead.
export default function TourDateRow({ concert }: { concert: TicketmasterResult }) {
  const addParams = new URLSearchParams({
    artist: concert.artist,
    venue: concert.venue ?? "",
    address: concert.address ?? "",
    city: concert.city ?? "",
    date: concert.date,
    ticketVendor: concert.ticketVendor,
    ticketUrl: concert.ticketUrl,
    imageUrl: concert.heroImageUrl ?? concert.imageUrl ?? "",
  });

  const [, m, d] = concert.date.split("-");
  const monthAbbr = MONTH_ABBR[Number(m) - 1] ?? "";
  const day = Number(d) || "";

  return (
    <div className="relative flex h-full items-stretch overflow-hidden rounded-lg border border-black/10 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10">
      <Link
        href={`/concerts/preview?${addParams.toString()}`}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${concert.venue ?? concert.artist} on ${concert.date}`}
      />

      <div className="flex w-14 flex-shrink-0 flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 py-2 text-white">
        <span className="text-[10px] font-semibold tracking-wide">{monthAbbr}</span>
        <span className="text-xl font-bold leading-none">{day}</span>
      </div>

      <div className="min-w-0 flex-1 px-3 py-2">
        {(concert.venue || concert.city) && (
          <p className="truncate font-medium">
            {[concert.venue, concert.city].filter(Boolean).join(", ")}
          </p>
        )}
        {concert.address && (
          <p className="truncate text-xs text-black/50 dark:text-white/50">{concert.address}</p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center pr-3">
        <a
          href={concert.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-20 whitespace-nowrap text-xs font-medium text-blue-600 underline dark:text-blue-400"
        >
          Tickets ↗
        </a>
      </div>
    </div>
  );
}
