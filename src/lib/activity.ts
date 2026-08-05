import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeArtistName } from "@/lib/ticketmaster";
import type { ActivityEventType } from "@/lib/types";
import type { FollowedAttendee } from "@/components/FollowedGoingBadge";

// Logs one feed-worthy action. Fire-and-forget by design — a feed entry
// failing to write should never block or fail the actual action (saving a
// concert, setting a rating, etc.), so errors are swallowed here rather than
// surfaced to the caller.
export async function logActivityEvent(
  supabase: SupabaseClient,
  userId: string,
  type: ActivityEventType,
  data: Record<string, unknown>,
  concertId?: string | null,
): Promise<void> {
  try {
    await supabase.from("activity_events").insert({
      user_id: userId,
      type,
      concert_id: concertId ?? null,
      data,
    });
  } catch {
    // Non-critical — the primary action already succeeded.
  }
}

// Who among the people the current user follows also has this exact show
// (same artist + date) on their list — powers the "N people you follow are
// going too" badge. Relies on activity_events' own RLS (readable by the
// event's owner or their followers) to naturally scope this to people the
// viewer actually follows, without needing to pass a followee list in.
export async function getFollowedAttendees(
  supabase: SupabaseClient,
  currentUserId: string,
  artistName: string,
  eventDate: string,
): Promise<FollowedAttendee[]> {
  if (!eventDate) return [];

  const { data: events } = await supabase
    .from("activity_events")
    .select("user_id, data")
    .eq("type", "concert_added")
    .neq("user_id", currentUserId);

  if (!events || events.length === 0) return [];

  const target = normalizeArtistName(artistName);
  const matchingUserIds = [
    ...new Set(
      events
        .filter((e) => {
          const data = e.data as Record<string, unknown>;
          return (
            typeof data.artist === "string" &&
            normalizeArtistName(data.artist) === target &&
            data.event_date === eventDate
          );
        })
        .map((e) => e.user_id as string),
    ),
  ];

  if (matchingUserIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", matchingUserIds);

  return (profiles ?? []).map((p) => ({
    userId: p.id,
    username: p.username,
    avatarUrl: p.avatar_url,
  }));
}
