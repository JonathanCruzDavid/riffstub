"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "off" | "enrolling" | "on";

export default function TwoFactorSettings({ required }: { required: boolean }) {
  const supabase = createClient();
  const [status, setStatus] = useState<Status>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qrEnlarged, setQrEnlarged] = useState(false);

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    if (verified) {
      setFactorId(verified.id);
      setStatus("on");
    } else {
      setStatus("off");
    }
  }

  useEffect(() => {
    loadFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setError(null);
    setBusy(true);

    // Clean up any abandoned unverified factor from a previous attempt so
    // enrolling doesn't pile up dead factors. The SDK's types claim
    // listFactors().totp is always-verified, but unverified TOTP factors do
    // show up there at runtime — checking .all (typed as any status) instead
    // keeps this accurate without fighting the type.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const stale = existing?.all?.find((f) => f.factor_type === "totp" && f.status === "unverified");
    if (stale) {
      await supabase.auth.mfa.unenroll({ factorId: stale.id });
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Couldn't start setup — try again.");
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStatus("enrolling");
  }

  async function confirmEnroll() {
    if (!factorId || code.trim().length !== 6) return;
    setBusy(true);
    setError(null);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setBusy(false);
      setError(challengeError?.message ?? "Couldn't verify that code — try again.");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });

    setBusy(false);

    if (verifyError) {
      setError("That code didn't match — check your app and try again.");
      return;
    }

    setCode("");
    setQrCode(null);
    setSecret(null);
    setStatus("on");
  }

  async function disable() {
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (unenrollError) {
      setError("Couldn't disable it — try again.");
      return;
    }
    setFactorId(null);
    setStatus("off");
  }

  if (status === "loading") {
    return <p className="text-sm text-black/50 dark:text-white/50">Checking two-factor status...</p>;
  }

  return (
    <div>
      <p className="mb-2 font-medium">Two-factor authentication</p>

      {status === "off" && (
        <div>
          <p className="text-sm text-black/60 dark:text-white/60">
            Add a code from an authenticator app (like Google Authenticator or Authy) at login, on top of your
            password.
            {required && (
              <span className="mt-1 block text-amber-600 dark:text-amber-500">
                Required for admin access — you won't be able to use the admin panel until this is on.
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={startEnroll}
            disabled={busy}
            className="mt-3 rounded-md bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
          >
            {busy ? "Starting..." : "Enable two-factor authentication"}
          </button>
        </div>
      )}

      {status === "enrolling" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-black/60 dark:text-white/60">
            Scan this with your authenticator app, then enter the 6-digit code it shows.
          </p>
          {qrCode && (
            <div>
              {/* Explicit white backing + padding: the SVG Supabase returns
                  draws only the black modules with no opaque background, so
                  on a dark-mode page the "white" squares show through as
                  dark and the code becomes unreadable. The padding also
                  gives it a real quiet zone, which scanners rely on. */}
              <button
                type="button"
                onClick={() => setQrEnlarged(true)}
                className="block cursor-zoom-in rounded border border-black/10 bg-white p-3 dark:border-white/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="Two-factor QR code" className="h-40 w-40" />
              </button>
              <button
                type="button"
                onClick={() => setQrEnlarged(true)}
                className="mt-1 text-xs underline text-black/50 dark:text-white/50"
              >
                Enlarge
              </button>
            </div>
          )}
          {secret && (
            <p className="text-xs text-black/50 dark:text-white/50">
              Can't scan it? Enter this code manually: <span className="font-mono">{secret}</span>
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-32 rounded-md border border-black/10 px-3 py-2 text-center font-mono dark:border-white/20"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmEnroll}
              disabled={busy || code.length !== 6}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
            >
              {busy ? "Verifying..." : "Verify & enable"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus("off");
                setCode("");
                setError(null);
              }}
              className="rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {qrEnlarged && qrCode && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setQrEnlarged(false)}
          onKeyDown={(e) => e.key === "Escape" && setQrEnlarged(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/70 p-6"
        >
          <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
            <div className="rounded bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="Two-factor QR code" className="h-72 w-72 sm:h-80 sm:w-80" />
            </div>
            <p className="mt-3 text-center text-xs text-black/50 dark:text-white/50">Tap anywhere to close</p>
          </div>
        </div>
      )}

      {status === "on" && (
        <div>
          <p className="text-sm text-green-600">Two-factor authentication is enabled.</p>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={disable}
            disabled={busy}
            className="mt-3 rounded-md border border-black/10 px-3 py-1.5 text-sm transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/20"
          >
            {busy ? "Disabling..." : "Disable"}
          </button>
        </div>
      )}
    </div>
  );
}
