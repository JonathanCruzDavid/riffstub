"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StarRating from "@/components/StarRating";
import { logActivityEvent } from "@/lib/activity";
import type { Concert } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

type SortMode = "date" | "rating";

export default function PastConcertsList({ initialConcerts }: { initialConcerts: Concert[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [concerts, setConcerts] = useState(initialConcerts);
  const [sortMode, setSortMode] = useState<SortMode>("date");

  async function setRating(concertId: string, rating: number) {
    setConcerts((prev) => prev.map((c) => (c.id === concertId ? { ...c, rating } : c)));
    await supabase.from("concerts").update({ rating }).eq("id", concertId);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const concert = concerts.find((c) => c.id === concertId);
    if (!concert) return;

    await logActivityEvent(
      supabase,
      user.id,
      "concert_rated",
      { artist: concert.artist, event_date: concert.event_date, rating, image_url: concert.image_url },
      concertId,
    );
  }

  async function setFavorite(concertId: string) {
    setConcerts((prev) => prev.map((c) => ({ ...c, is_favorite: c.id === concertId })));

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("concerts")
      .update({ is_favorite: false })
      .eq("user_id", user.id)
      .eq("is_favorite", true);

    await supabase.from("concerts").update({ is_favorite: true }).eq("id", concertId);
    router.refresh();
  }

  const sortedConcerts = useMemo(() => {
    const copy = [...concerts];
    if (sortMode === "rating") {
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return copy.sort((a, b) => b.event_date.localeCompare(a.event_date));
  }, [concerts, sortMode]);

  if (concerts.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        Concerts you've been to will show up here.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-black/50 dark:text-white/50">Sort by</span>
        <button
          type="button"
          onClick={() => setSortMode("date")}
          className={sortMode === "date" ? "underline" : "text-black/50 dark:text-white/50"}
        >
          Date
        </button>
        <span className="text-black/30 dark:text-white/30">·</span>
        <button
          type="button"
          onClick={() => setSortMode("rating")}
          className={sortMode === "rating" ? "underline" : "text-black/50 dark:text-white/50"}
        >
          Rating
        </button>
      </div>

      <div className="scroll-thin grid max-h-[380px] grid-cols-1 gap-3 overflow-y-auto pr-1">
        {sortedConcerts.map((concert) => (
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
                    setFavorite(concert.id);
                  }}
                  aria-label="Mark as favorite"
                  className={
                    concert.is_favorite
                      ? "text-base text-red-500"
                      : "text-base text-black/20 hover:text-black/40 dark:text-white/20 dark:hover:text-white/40"
                  }
                >
                  ♥
                </button>
              </div>
              <span className="truncate text-lg font-medium">{concert.artist}</span>
              {(concert.venue || concert.city) && (
                <span className="truncate text-sm text-black/60 dark:text-white/60">
                  {[concert.venue, concert.city].filter(Boolean).join(" · ")}
                </span>
              )}
              <div className="relative z-10 mt-1" onClick={(e) => e.preventDefault()}>
                <StarRating
                  value={concert.rating}
                  onChange={(rating) => setRating(concert.id, rating)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
