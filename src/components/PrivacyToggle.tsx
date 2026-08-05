"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PrivacyToggle({ initialIsPrivate }: { initialIsPrivate: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !isPrivate;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").update({ is_private: next }).eq("id", user.id);

    if (!error) {
      setIsPrivate(next);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm">Private profile</p>
        <p className="text-xs text-black/50 dark:text-white/50">
          {isPrivate
            ? "Hidden from user search and profile lookups — only you can see it."
            : "Anyone can find your profile by username and view your public info."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isPrivate}
        onClick={toggle}
        disabled={saving}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          isPrivate ? "bg-gradient-to-r from-blue-600 to-violet-600" : "bg-black/15 dark:bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            isPrivate ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
