"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteConcertButton({ concertId }: { concertId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await supabase.from("concerts").delete().eq("id", concertId);
    router.push("/dashboard");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>Delete this concert?</span>
        <button onClick={handleDelete} className="text-red-600 underline">
          Yes, delete
        </button>
        <button onClick={() => setConfirming(false)} className="underline">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-black/50 hover:text-red-600 dark:text-white/50"
    >
      Delete concert
    </button>
  );
}
