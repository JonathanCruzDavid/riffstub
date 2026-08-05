"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ReportTargetType } from "@/lib/types";

export default function ReportButton({
  targetType,
  targetId,
  className,
}: {
  targetType: ReportTargetType;
  targetId: string;
  className?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<"idle" | "sent" | "error" | "already">("idle");

  async function submit() {
    const trimmed = reason.trim();
    if (!trimmed) return;

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: trimmed,
    });

    setSubmitting(false);

    if (error) {
      setState(error.code === "23505" ? "already" : "error");
      return;
    }

    setState("sent");
    setOpen(false);
  }

  const baseClass = className ?? "text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white/70";

  if (state === "sent") {
    return <span className={`text-xs ${baseClass}`}>Reported</span>;
  }

  if (state === "already") {
    return <span className={`text-xs ${baseClass}`}>Already reported</span>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`text-xs underline transition ${baseClass}`}>
        Report {targetType === "account" ? "account" : "post"}
      </button>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-black/10 p-2 dark:border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 300))}
        placeholder="Why are you reporting this?"
        rows={2}
        autoFocus
        className="w-full resize-none rounded border border-black/10 bg-transparent p-1.5 text-xs outline-none dark:border-white/20"
      />
      {state === "error" && <p className="text-xs text-red-600">Couldn't send that — try again.</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !reason.trim()}
          className="rounded bg-foreground px-2.5 py-1 text-xs text-background disabled:opacity-50"
        >
          Submit report
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-black/10 px-2.5 py-1 text-xs dark:border-white/20"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
