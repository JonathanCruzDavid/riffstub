"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BIO_MAX_LENGTH = 160;

export default function AboutMeSection({
  initialBio,
  editMode,
}: {
  initialBio: string | null;
  editMode: boolean;
}) {
  const supabase = createClient();
  const [bio, setBio] = useState(initialBio ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleBlur() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ bio: bio.trim() || null })
      .eq("id", user.id);

    setError(
      updateError?.code === "23514" ? "That contains language that isn't allowed here." : null,
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        About me
      </h2>
      {editMode ? (
        <div className="max-w-xl">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
            onBlur={handleBlur}
            maxLength={BIO_MAX_LENGTH}
            rows={3}
            placeholder="Say something about yourself..."
            className="w-full resize-none rounded-md border border-black/10 p-2 text-sm dark:border-white/20"
          />
          <p className="mt-1 text-xs text-black/40 dark:text-white/40">
            {bio.length}/{BIO_MAX_LENGTH}
          </p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      ) : bio ? (
        <p className="max-w-xl whitespace-pre-wrap text-sm text-black/80 dark:text-white/80">
          {bio}
        </p>
      ) : (
        <p className="text-sm text-black/50 dark:text-white/50">No bio yet.</p>
      )}
    </div>
  );
}
