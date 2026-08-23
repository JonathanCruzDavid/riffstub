"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // A recovery-link session only reaches aal1 — accounts with 2FA enrolled
  // must clear an MFA challenge before Supabase allows updateUser({password}).
  const [needsMfa, setNeedsMfa] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [linkInvalid, setLinkInvalid] = useState(false);

  useEffect(() => {
    async function prepareRecoverySession() {
      const urlCode = new URLSearchParams(window.location.search).get("code");

      // Recovery codes are single-use — a reload of this page after the
      // first successful exchange (e.g. hitting refresh) will fail here,
      // since the code was already consumed. Fail clearly instead of
      // silently falling through to a confusing "Auth session missing"
      // error later when updateUser() is called with no session.
      if (urlCode) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(urlCode);
        if (exchangeError) {
          setLinkInvalid(true);
          setReady(true);
          return;
        }
      }

      // Deciding off listFactors() directly rather than
      // getAuthenticatorAssuranceLevel()'s nextLevel — that computed
      // comparison was reporting no step-up needed for recovery-link
      // sessions even when the account has a verified factor, and the
      // server rejects updateUser() over it regardless. Whether the
      // account has 2FA at all is the real question here.
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) {
        setLinkInvalid(true);
        setReady(true);
        return;
      }

      const factor = factors?.totp?.find((f) => f.status === "verified");

      if (factor) {
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: factor.id,
        });

        if (challengeError || !challenge) {
          setError(challengeError?.message ?? "Couldn't start two-factor verification — try again.");
          setReady(true);
          return;
        }

        setFactorId(factor.id);
        setChallengeId(challenge.id);
        setNeedsMfa(true);
      }

      setReady(true);
    }
    prepareRecoverySession();
  }, [supabase]);

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

    setNeedsMfa(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (!ready) return null;

  if (linkInvalid) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
        <h1 className="mb-2 text-2xl font-semibold">This link expired</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          Password reset links only work once and expire quickly. Request a new one and use it right away,
          without refreshing the page first.
        </p>
        <Link
          href="/forgot-password"
          className="rounded-md bg-foreground px-4 py-2 text-center text-background"
        >
          Send a new link
        </Link>
      </div>
    );
  }

  if (needsMfa) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
        <h1 className="mb-2 text-2xl font-semibold">Enter your code</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          This account has two-factor authentication on — open your authenticator app and enter the current
          6-digit code before setting a new password.
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
      <h1 className="mb-6 text-2xl font-semibold">Set a new password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          New password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confirm new password
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {loading ? "Saving..." : "Set new password"}
        </button>
      </form>
    </div>
  );
}
