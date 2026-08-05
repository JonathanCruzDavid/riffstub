import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ConcertCard from "@/components/ConcertCard";
import NearbyConcerts from "@/components/NearbyConcerts";
import SpotifyMatches from "@/components/SpotifyMatches";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import type { Concert } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: concerts }, { count: concertCount }, { count: likedArtistCount }] = await Promise.all([
    supabase
      .from("concerts")
      .select("*")
      .eq("user_id", user!.id)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .returns<Concert[]>(),
    supabase.from("concerts").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("liked_artists").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
  ]);

  const upcoming = concerts ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <h1 className="mb-8 text-2xl font-semibold">Your concerts</h1>

      <OnboardingChecklist
        hasConcert={(concertCount ?? 0) > 0}
        hasLikedArtists={(likedArtistCount ?? 0) > 0}
      />

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Nothing on the calendar yet.{" "}
            <Link href="/concerts/new" className="underline">
              Add your first concert
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Your artists near you
        </h2>
        <SpotifyMatches />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Discover nearby
        </h2>
        <NearbyConcerts />
      </section>
    </div>
  );
}
