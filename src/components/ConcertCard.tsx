import Link from "next/link";
import type { Concert } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function ConcertCard({ concert }: { concert: Concert }) {
  return (
    <Link
      href={`/concerts/${concert.id}`}
      className="flex items-center gap-3 rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.03]"
    >
      {concert.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={concert.image_url}
          alt=""
          className="h-14 w-14 flex-shrink-0 rounded object-cover"
        />
      )}
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
          {dateFormatter.format(new Date(`${concert.event_date}T00:00:00`))}
        </span>
        <span className="text-lg font-medium">{concert.artist}</span>
        {(concert.venue || concert.city) && (
          <span className="text-sm text-black/60 dark:text-white/60">
            {[concert.venue, concert.city].filter(Boolean).join(" · ")}
          </span>
        )}
        {concert.address && (
          <span className="text-xs text-black/50 dark:text-white/50">{concert.address}</span>
        )}
      </div>
    </Link>
  );
}
