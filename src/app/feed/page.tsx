import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDisplayDate } from "@/lib/format";
import FeedComposer from "@/components/FeedComposer";
import ReportButton from "@/components/ReportButton";
import type { ActivityEvent, FeedPost, Profile } from "@/lib/types";

function timeAgo(isoTimestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDisplayDate(isoTimestamp.slice(0, 10));
}

function eventText(event: ActivityEvent, username: string): { headline: string; sub: string | null } {
  const data = event.data as Record<string, string | number | null | undefined>;

  switch (event.type) {
    case "concert_added": {
      const isPast = typeof data.event_date === "string" && data.event_date < new Date().toISOString().slice(0, 10);
      return {
        headline: `${username} ${isPast ? "logged" : "is going to"} ${data.artist ?? "a concert"}`,
        sub: [
          typeof data.event_date === "string" ? formatDisplayDate(data.event_date) : null,
          [data.venue, data.city].filter(Boolean).join(", ") || null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
      };
    }
    case "concert_rated":
      return {
        headline: `${username} rated ${data.artist ?? "a concert"} ${"★".repeat(Number(data.rating) || 0)}`,
        sub: typeof data.event_date === "string" ? formatDisplayDate(data.event_date) : null,
      };
    case "favorite_artist_changed":
      return {
        headline: `${username} set their favorite artist to ${data.artist_name ?? ""}`,
        sub: null,
      };
    case "favorite_song_changed":
      return {
        headline: `${username} set their favorite song to ${data.song_name ?? ""}`,
        sub: typeof data.artist_name === "string" ? data.artist_name : null,
      };
    default:
      return { headline: `${username} did something`, sub: null };
  }
}

type FeedItem =
  | { kind: "event"; id: string; created_at: string; userId: string; event: ActivityEvent }
  | { kind: "post"; id: string; created_at: string; userId: string; post: FeedPost };

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: followRows } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user!.id);

  const followeeIds = (followRows ?? []).map((f) => f.followee_id);
  const timelineUserIds = [user!.id, ...followeeIds];

  const [{ data: events }, { data: posts }] = await Promise.all([
    supabase
      .from("activity_events")
      .select("*")
      .in("user_id", timelineUserIds)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<ActivityEvent[]>(),
    supabase
      .from("feed_posts")
      .select("*")
      .in("user_id", timelineUserIds)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<FeedPost[]>(),
  ]);

  const items: FeedItem[] = [
    ...(events ?? []).map(
      (event): FeedItem => ({ kind: "event", id: `e-${event.id}`, created_at: event.created_at, userId: event.user_id, event }),
    ),
    ...(posts ?? []).map(
      (post): FeedItem => ({ kind: "post", id: `p-${post.id}`, created_at: post.created_at, userId: post.user_id, post }),
    ),
  ]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 50);

  const actorIds = [...new Set(items.map((i) => i.userId))];
  const { data: actors } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", actorIds.length > 0 ? actorIds : ["00000000-0000-0000-0000-000000000000"])
    .returns<Pick<Profile, "id" | "username" | "avatar_url">[]>();

  const actorById = new Map((actors ?? []).map((a) => [a.id, a]));

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Feed</h1>

      <FeedComposer />

      {items.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          {followeeIds.length === 0
            ? "You're not following anyone yet. Search for a user up top and follow them to see what shows they're going to, new ratings, and favorite picks here."
            : "No activity yet from you or people you follow."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const actor = actorById.get(item.userId);
            const username = actor?.username ?? "Someone";

            let headline: string;
            let sub: string | null;
            let imageUrl: string | null = null;

            if (item.kind === "post") {
              headline = item.post.body;
              sub = null;
            } else {
              const text = eventText(item.event, username);
              headline = text.headline;
              sub = text.sub;
              imageUrl =
                typeof item.event.data.image_url === "string"
                  ? (item.event.data.image_url as string)
                  : null;
            }

            const content = (
              <div className="card flex items-center gap-3 p-3">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded object-cover"
                  />
                ) : actor?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={actor.avatar_url}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="h-12 w-12 flex-shrink-0 rounded bg-black/10 dark:bg-white/10" />
                )}
                <div className="min-w-0 flex-1">
                  {item.kind === "post" && (
                    <p className="truncate text-xs font-medium text-black/50 dark:text-white/50">
                      {username}
                    </p>
                  )}
                  <p className="truncate text-sm">{headline}</p>
                  {sub && <p className="truncate text-xs text-black/50 dark:text-white/50">{sub}</p>}
                </div>
                <span className="flex-shrink-0 text-xs text-black/40 dark:text-white/40">
                  {timeAgo(item.created_at)}
                </span>
              </div>
            );

            // Concerts are private (owner-only), so a feed item can never
            // deep-link to someone else's /concerts/[id] page — it 404s.
            // Link to their public profile instead.
            return (
              <li key={item.id}>
                {actor?.username ? <Link href={`/u/${actor.username}`}>{content}</Link> : content}
                {item.kind === "post" && item.userId !== user!.id && (
                  <div className="mt-1 pl-3">
                    <ReportButton targetType="post" targetId={item.post.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
