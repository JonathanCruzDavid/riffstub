"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logActivityEvent } from "@/lib/activity";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Arrived here from a logged-out visitor viewing a show's preview page and
  // clicking "Sign up to track this show" — the concert they picked travels
  // along as query params so it can be saved to their list the moment their
  // account exists, instead of losing that intent and dropping them on an
  // empty dashboard.
  const pendingArtist = searchParams.get("artist");
  const pendingDate = searchParams.get("date");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const rateLimitRes = await fetch("/api/rate-limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup" }),
    });
    const { allowed } = await rateLimitRes.json();
    if (!allowed) {
      setError("Too many signups from this network — try again later.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      // Email confirmation is disabled, so signUp already logged us in.
      if (pendingArtist && pendingDate) {
        const { data: concert, error: insertError } = await supabase
          .from("concerts")
          .insert({
            user_id: data.user.id,
            artist: pendingArtist,
            venue: searchParams.get("venue") || null,
            address: searchParams.get("address") || null,
            city: searchParams.get("city") || null,
            event_date: pendingDate,
            ticket_vendor: searchParams.get("ticketVendor") || null,
            ticket_url: searchParams.get("ticketUrl") || null,
            image_url: searchParams.get("imageUrl") || null,
          })
          .select("id")
          .single();

        if (!insertError && concert) {
          await logActivityEvent(
            supabase,
            data.user.id,
            "concert_added",
            {
              artist: pendingArtist,
              event_date: pendingDate,
              venue: searchParams.get("venue"),
              city: searchParams.get("city"),
              image_url: searchParams.get("imageUrl"),
            },
            concert.id,
          );

          router.push(`/concerts/${concert.id}`);
          router.refresh();
          return;
        }
        // Account creation still succeeded even if the concert save failed
        // (e.g. it slipped past the content filter somehow) — fall through
        // to the normal dashboard redirect rather than blocking signup.
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
        <h1 className="mb-2 text-2xl font-semibold">Check your email</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          We sent a confirmation link to {email}. Click it, then come back and log in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Sign up</h1>
      {pendingArtist && pendingDate && (
        <p className="mb-4 text-sm text-black/60 dark:text-white/60">
          Create an account and we'll add <strong>{pendingArtist}</strong> to your list.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
