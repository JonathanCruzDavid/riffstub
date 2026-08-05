"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UsernameForm({ initialUsername }: { initialUsername: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      if (error.message.includes("duplicate")) {
        setError("That username is taken.");
      } else if (error.code === "23514") {
        setError("That username isn't allowed here.");
      } else {
        setError(error.message);
      }
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Username updated.</p>}
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-md bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save username"}
      </button>
    </form>
  );
}
