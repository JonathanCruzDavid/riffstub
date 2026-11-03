"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BlockButton({
  targetUserId,
  username,
  initialIsBlocked,
  className,
}: {
  targetUserId: string;
  username: string;
  initialIsBlocked: boolean;
  className?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    setLoading(true);
    setError(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = isBlocked
      ? await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", targetUserId)
      : await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: targetUserId });

    setLoading(false);

    // 23505 = already blocked (e.g. from another tab) — the end state is the same.
    if (error && error.code !== "23505") {
      setError(true);
      return;
    }

    setIsBlocked(!isBlocked);
    setConfirming(false);
    router.refresh();
  }

  const baseClass = className ?? "text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white/70";

  if (isBlocked) {
    return (
      <>
        <button type="button" onClick={toggle} disabled={loading} className={`text-xs underline transition disabled:opacity-50 ${baseClass}`}>
          Unblock
        </button>
        {error && <p className="text-xs text-red-600">Couldn&apos;t unblock — try again.</p>}
      </>
    );
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`text-xs underline transition ${baseClass}`}>
        Block account
      </button>
    );
  }

  // A fixed overlay rather than inline, so it isn't clipped by the profile
  // banner (fixed height, overflow-hidden) the button sits inside.
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={() => setConfirming(false)}
    >
      <div
        className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-black/10 bg-background p-4 text-left text-foreground shadow-lg dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm">
          Block <strong>{username}</strong>? You&apos;ll unfollow each other, and they won&apos;t be able to find
          your profile or follow you. They won&apos;t be notified.
        </p>
        {error && <p className="text-xs text-red-600">Couldn&apos;t block — try again.</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={loading}
            className="rounded bg-red-600 px-2.5 py-1 text-xs text-white disabled:opacity-50"
          >
            Block
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded border border-black/10 px-2.5 py-1 text-xs dark:border-white/20"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
