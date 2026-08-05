"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordForm({ email }: { email: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (reauthError) {
      setLoading(false);
      setError("Current password is incorrect.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    setSuccess(true);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm underline text-black/60 dark:text-white/60"
      >
        Change password
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Current password
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
        />
      </label>
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
      {success && <p className="text-sm text-green-600">Password updated.</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save new password"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm underline text-black/60 dark:text-white/60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
