"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Concert } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function FavoriteConcertCard({ pastConcerts }: { pastConcerts: Concert[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [favoriteId, setFavoriteId] = useState(
    pastConcerts.find((c) => c.is_favorite)?.id ?? null,
  );
  const [picking, setPicking] = useState(false);

  const favorite = pastConcerts.find((c) => c.id === favoriteId) ?? null;

  async function handlePick(concertId: string) {
    setFavoriteId(concertId);
    setPicking(false);

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

  return (
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        Favorite concert
      </h2>

      {pastConcerts.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          Log a past concert to pick a favorite.
        </p>
      ) : favorite && !picking ? (
        <Link href={`/concerts/${favorite.id}`} className="flex items-center gap-3">
          {favorite.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favorite.image_url}
              alt=""
              className="h-20 w-20 flex-shrink-0 rounded object-cover"
            />
          ) : (
            <span className="h-20 w-20 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{favorite.artist}</p>
            <p className="truncate text-sm text-black/60 dark:text-white/60">
              {dateFormatter.format(new Date(`${favorite.event_date}T00:00:00`))}
              {favorite.venue ? ` · ${favorite.venue}` : ""}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPicking(true);
              }}
              className="mt-1 text-xs text-black/40 hover:text-red-600 dark:text-white/40"
            >
              change
            </button>
          </div>
        </Link>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="scroll-thin max-h-56 divide-y divide-black/10 overflow-y-auto rounded-md border border-black/10 dark:divide-white/10 dark:border-white/20">
            {pastConcerts.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => handlePick(c.id)}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                >
                  <span className="font-medium">{c.artist}</span>
                  <span className="text-black/60 dark:text-white/60">
                    {dateFormatter.format(new Date(`${c.event_date}T00:00:00`))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {favorite && (
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="self-start text-xs text-black/40 dark:text-white/40"
            >
              cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
