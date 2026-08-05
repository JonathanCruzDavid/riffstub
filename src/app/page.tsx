import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NearbyConcerts from "@/components/NearbyConcerts";

const FEATURES = [
  {
    emoji: "🔍",
    title: "Search & track",
    description: "Search any artist, see their upcoming shows, and add the ones you're going to.",
  },
  {
    emoji: "📸",
    title: "Keep the memories",
    description: "Log every concert you've been to with photos, ratings, and notes.",
  },
  {
    emoji: "👥",
    title: "Follow friends",
    description: "See who's going to the same show, and what your friends have been to.",
  },
  {
    emoji: "🔒",
    title: "Your data, your rules",
    description: "Keep your profile public or private — you decide what's shared.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden px-6 pb-20 pt-20 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 flex justify-center"
        >
          <div className="h-[420px] w-[720px] rounded-full bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-transparent blur-3xl" />
        </div>

        <span className="mx-auto flex w-fit items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/60 shadow-sm dark:border-white/15 dark:bg-white/[.04] dark:text-white/60">
          🎟️ Your concert history, in one place
        </span>

        <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Every concert you're going to.{" "}
          <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            One place.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-black/60 dark:text-white/60">
          Stop juggling ticket sites, group chats, and a phone full of
          screenshots. Track upcoming shows and keep a photo journal of every
          concert you've been to.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card flex items-start gap-3 p-4 text-left">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-base shadow-sm shadow-blue-600/20">
                {feature.emoji}
              </span>
              <div>
                <p className="font-medium">{feature.title}</p>
                <p className="mt-0.5 text-sm text-black/60 dark:text-white/60">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 pb-20">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-600 to-violet-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Concerts near you
          </h2>
        </div>
        <div className="card p-5 text-left">
          <NearbyConcerts />
        </div>
      </section>
    </div>
  );
}
