"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function CommentsSection({
  concertId,
  initialComments,
}: {
  concertId: string;
  initialComments: Comment[];
}) {
  const supabase = createClient();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({ concert_id: concertId, user_id: user.id, body: body.trim() })
      .select("*")
      .single();

    setLoading(false);

    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      setBody("");
    }
  }

  return (
    <div>
      {comments.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          No comments yet — say something about this show.
        </p>
      ) : (
        <ul className="mb-4 space-y-3 text-sm">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-md bg-black/[.03] p-3 dark:bg-white/[.05]">
              <p>{comment.body}</p>
              <span className="mt-1 block text-xs text-black/40 dark:text-white/40">
                {dateFormatter.format(new Date(comment.created_at))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment"
          className="flex-1 rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-black/10 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-white/20"
        >
          Post
        </button>
      </form>
    </div>
  );
}
