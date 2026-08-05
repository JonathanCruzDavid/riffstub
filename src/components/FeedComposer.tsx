"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_LENGTH = 500;

export default function FeedComposer() {
  const router = useRouter();
  const supabase = createClient();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;

    setPosting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase
      .from("feed_posts")
      .insert({ user_id: user.id, body: trimmed });

    if (insertError) {
      setError(
        insertError.code === "23514"
          ? "That contains language that isn't allowed here."
          : "Couldn't post that — try again.",
      );
    } else {
      setBody("");
      router.refresh();
    }
    setPosting(false);
  }

  return (
    <div className="card mb-6 p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Share an update with people who follow you..."
        rows={2}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-black/40 dark:placeholder:text-white/40"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-black/40 dark:text-white/40">
          {body.length}/{MAX_LENGTH}
        </span>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            type="button"
            onClick={submit}
            disabled={posting || !body.trim()}
            className="btn-primary !px-4 !py-1.5 text-sm disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
