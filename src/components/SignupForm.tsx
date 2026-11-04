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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
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
      // Recorded on the auth user so there's a timestamp of when this
      // account agreed to the terms (Play's UGC policy requires acceptance
      // before anyone can post).
      options: { data: { username, terms_accepted_at: new Date().toISOString() } },
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
          Create an account and we&apos;ll add <strong>{pendingArtist}</strong> to your list.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
            autoComplete="email"
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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-black/70 dark:text-white/70">
          <input
            type="checkbox"
            required
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0"
          />
          <span>
            I&apos;m at least 13 and agree to the{" "}
            <Link href="/terms" target="_blank" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="underline">
              Privacy Policy
            </Link>
            , including the content rules.
          </span>
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
