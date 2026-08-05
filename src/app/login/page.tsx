"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [needsMfa, setNeedsMfa] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function finishLogin() {
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const rateLimitRes = await fetch("/api/rate-limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login" }),
    });
    const { allowed } = await rateLimitRes.json();
    if (!allowed) {
      setError("Too many attempts from this network — try again in a bit.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.find((f) => f.status === "verified");

      if (!factor) {
        setLoading(false);
        setError("Two-factor authentication is set up but no verified device was found — contact support.");
        return;
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

      setLoading(false);

      if (challengeError || !challenge) {
        setError(challengeError?.message ?? "Couldn't start two-factor verification — try again.");
        return;
      }

      setFactorId(factor.id);
      setChallengeId(challenge.id);
      setNeedsMfa(true);
      return;
    }

    setLoading(false);
    await finishLogin();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !challengeId || code.trim().length !== 6) return;

    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.trim(),
    });

    setLoading(false);

    if (verifyError) {
      setError("That code didn't match — check your app and try again.");
      return;
    }

    await finishLogin();
  }

  if (needsMfa) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
        <h1 className="mb-2 text-2xl font-semibold">Enter your code</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          Open your authenticator app and enter the current 6-digit code.
        </p>
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="rounded-md border border-black/10 px-3 py-2 text-center font-mono text-lg dark:border-white/20"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="mt-2 rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <Link href="/forgot-password" className="-mt-2 self-end text-xs underline text-black/60 dark:text-white/60">
          Forgot password?
        </Link>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        No account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
