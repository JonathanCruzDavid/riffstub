"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "not_following" | "pending" | "following";

export default function FollowButton({
  targetUserId,
  targetIsPrivate,
  initialIsFollowing,
  initialHasPendingRequest,
}: {
  targetUserId: string;
  targetIsPrivate: boolean;
  initialIsFollowing: boolean;
  initialHasPendingRequest: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<Status>(
    initialIsFollowing ? "following" : initialHasPendingRequest ? "pending" : "not_following",
  );
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (status === "following") {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("followee_id", targetUserId);
      if (!error) setStatus("not_following");
    } else if (status === "pending") {
      const { error } = await supabase
        .from("follow_requests")
        .delete()
        .eq("requester_id", user.id)
        .eq("target_id", targetUserId);
      if (!error) setStatus("not_following");
    } else if (targetIsPrivate) {
      const { error } = await supabase
        .from("follow_requests")
        .insert({ requester_id: user.id, target_id: targetUserId });
      if (!error) setStatus("pending");
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, followee_id: targetUserId });
      if (!error) setStatus("following");
    }

    setLoading(false);
    router.refresh();
  }

  const label = status === "following" ? "Following" : status === "pending" ? "Requested" : "Follow";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={
        status === "not_following"
          ? "btn-primary !px-4 !py-1.5 text-sm disabled:opacity-50"
          : "rounded-full border border-black/10 px-4 py-1.5 text-sm transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/20"
      }
    >
      {label}
    </button>
  );
}
