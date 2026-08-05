"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Concert } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function UpcomingConcertsList({
  initialConcerts,
}: {
  initialConcerts: Concert[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [concerts, setConcerts] = useState(initialConcerts);

  async function setMostAnticipated(concertId: string) {
    setConcerts((prev) =>
      prev.map((c) => ({ ...c, is_most_anticipated: c.id === concertId })),
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("concerts")
      .update({ is_most_anticipated: false })
      .eq("user_id", user.id)
      .eq("is_most_anticipated", true);

    await supabase.from("concerts").update({ is_most_anticipated: true }).eq("id", concertId);
    router.refresh();
  }

  if (concerts.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        Nothing on the calendar yet.{" "}
        <Link href="/concerts/new" className="underline">
          Add your first concert
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="scroll-thin grid max-h-[296px] grid-cols-1 gap-3 overflow-y-auto pr-1">
      {concerts.map((concert) => (
        <div
          key={concert.id}
          className="relative flex gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
        >
          <Link href={`/concerts/${concert.id}`} className="absolute inset-0" />
          {concert.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={concert.image_url}
              alt=""
              className="h-14 w-14 flex-shrink-0 rounded object-cover"
            />
          ) : (
            <span className="h-14 w-14 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="relative z-10 flex items-start justify-between">
              <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                {dateFormatter.format(new Date(`${concert.event_date}T00:00:00`))}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setMostAnticipated(concert.id);
                }}
                aria-label="Mark as most anticipated"
                className={
                  concert.is_most_anticipated
                    ? "text-base text-yellow-500"
                    : "text-base text-black/20 hover:text-black/40 dark:text-white/20 dark:hover:text-white/40"
                }
              >
                🔥
              </button>
            </div>
            <span className="truncate text-lg font-medium">{concert.artist}</span>
            {(concert.venue || concert.city) && (
              <span className="truncate text-sm text-black/60 dark:text-white/60">
                {[concert.venue, concert.city].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
