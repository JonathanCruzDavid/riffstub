"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getStoredLocation } from "@/lib/useUserLocation";
import { formatDisplayDate } from "@/lib/format";
import type { TicketmasterResult } from "@/lib/ticketmaster";
import type { Notification } from "@/lib/types";

type RequesterProfile = { id: string; username: string | null; avatar_url: string | null };

export default function NotificationBell() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requesters, setRequesters] = useState<Map<string, RequesterProfile>>(new Map());
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncedRef = useRef(false);

  const pendingCount = notifications.filter((n) => !n.dismissed_at).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .returns<Notification[]>();

    const list = data ?? [];
    setNotifications(list);

    const requesterIds = [
      ...new Set(
        list
          .filter((n) => n.type === "follow_request")
          .map((n) => (n.data as { requester_id?: string }).requester_id)
          .filter((id): id is string => !!id),
      ),
    ];

    if (requesterIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", requesterIds)
        .returns<RequesterProfile[]>();
      setRequesters(new Map((profiles ?? []).map((p) => [p.id, p])));
    }

    setLoading(false);
  }, [supabase]);

  // Badge count on mount, no location/Spotify sync yet — that only happens
  // once the mailbox is actually opened.
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function syncNearbyShows() {
    if (syncedRef.current) return;
    syncedRef.current = true;

    // Opportunistic only — never prompts for a fresh geolocation permission
    // from a passive mailbox icon. If nothing's cached yet, skip silently;
    // it'll pick up next time the dashboard/Spotify matches have run.
    const location = getStoredLocation();
    if (!location) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(
        `/api/spotify/nearby-matches?lat=${location.lat.toFixed(2)}&lng=${location.lng.toFixed(2)}`,
      );
      const data = await res.json();
      if (!data.connected) return;

      const results: TicketmasterResult[] = data.results ?? [];
      if (results.length === 0) return;

      const rows = results.map((show) => ({
        user_id: user.id,
        type: "nearby_show" as const,
        dedupe_key: `nearby_show:${show.id}`,
        data: {
          artist: show.artist,
          venue: show.venue,
          city: show.city,
          date: show.date,
          imageUrl: show.imageUrl,
          ticketUrl: show.ticketUrl,
        },
      }));

      await supabase.from("notifications").upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
      await loadNotifications();
    } catch {
      // Best-effort background sync — failures just mean the mailbox shows
      // whatever was already there.
    }
  }

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) syncNearbyShows();
  }

  async function acceptRequest(requesterId: string) {
    setBusyKey(requesterId);
    const { error } = await supabase.rpc("accept_follow_request", { p_requester_id: requesterId });
    if (!error) await loadNotifications();
    setBusyKey(null);
  }

  async function declineRequest(requesterId: string) {
    setBusyKey(requesterId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("follow_requests")
        .delete()
        .eq("requester_id", requesterId)
        .eq("target_id", user.id);
    }
    await loadNotifications();
    setBusyKey(null);
  }

  async function dismiss(id: string) {
    setBusyKey(id);
    await supabase.from("notifications").update({ dismissed_at: new Date().toISOString() }).eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setBusyKey(null);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-black/70 transition hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        ✉️
        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="scroll-thin absolute right-0 z-40 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-neutral-900">
          <div className="border-b border-black/10 px-4 py-2.5 text-sm font-medium dark:border-white/10">
            Notifications
          </div>

          {loading && notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-black/50 dark:text-white/50">Loading...</p>
          )}

          {!loading && notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-black/50 dark:text-white/50">
              Nothing new right now.
            </p>
          )}

          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {notifications.map((n) => {
              if (n.type === "follow_request") {
                const requesterId = (n.data as { requester_id?: string }).requester_id ?? "";
                const requester = requesters.get(requesterId);
                const isBusy = busyKey === requesterId;
                return (
                  <li key={n.id} className="flex items-center gap-3 px-4 py-3">
                    {requester?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={requester.avatar_url}
                        alt=""
                        className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-black/10 text-sm dark:bg-white/10">
                        {(requester?.username ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        <span className="font-medium">{requester?.username ?? "Someone"}</span>{" "}
                        wants to follow you
                      </p>
                      <div className="mt-1.5 flex gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => acceptRequest(requesterId)}
                          className="btn-primary !px-3 !py-1 text-xs disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => declineRequest(requesterId)}
                          className="rounded-full border border-black/10 px-3 py-1 text-xs transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/20"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </li>
                );
              }

              const show = n.data as {
                artist?: string;
                venue?: string | null;
                city?: string | null;
                date?: string;
                imageUrl?: string | null;
                ticketUrl?: string;
              };
              const isBusy = busyKey === n.id;

              return (
                <li key={n.id} className="flex items-center gap-3 px-4 py-3">
                  {show.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={show.imageUrl}
                      alt=""
                      className="h-9 w-9 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-black/10 text-xs dark:bg-white/10">
                      🎵
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">{show.artist}</span> is playing near you
                    </p>
                    <p className="truncate text-xs text-black/50 dark:text-white/50">
                      {[show.date ? formatDisplayDate(show.date) : null, show.venue].filter(Boolean).join(" · ")}
                    </p>
                    {show.ticketUrl && (
                      <a
                        href={show.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs underline text-black/60 dark:text-white/60"
                      >
                        View tickets
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => dismiss(n.id)}
                    aria-label="Dismiss"
                    className="flex-shrink-0 text-black/40 transition hover:text-black/70 disabled:opacity-50 dark:text-white/40 dark:hover:text-white/70"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>

          <Link
            href="/feed"
            onClick={() => setOpen(false)}
            className="block border-t border-black/10 px-4 py-2 text-center text-xs text-black/50 hover:text-black dark:border-white/10 dark:text-white/50 dark:hover:text-white"
          >
            Go to feed
          </Link>
        </div>
      )}
    </div>
  );
}
