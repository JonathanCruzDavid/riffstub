export type FollowedAttendee = { userId: string; username: string | null; avatarUrl: string | null };

export default function FollowedGoingBadge({ attendees }: { attendees: FollowedAttendee[] }) {
  if (attendees.length === 0) return null;

  return (
    <div className="mt-3 flex w-fit items-center gap-2 rounded-full border border-black/10 bg-black/[.02] py-1.5 pl-1.5 pr-3 text-sm dark:border-white/15 dark:bg-white/[.03]">
      <div className="flex -space-x-2">
        {attendees.slice(0, 4).map((a) =>
          a.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.userId}
              src={a.avatarUrl}
              alt=""
              className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-white object-cover dark:border-black"
            />
          ) : (
            <span
              key={a.userId}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-black/10 text-[10px] dark:border-black dark:bg-white/10"
            >
              {(a.username ?? "?").charAt(0).toUpperCase()}
            </span>
          ),
        )}
      </div>
      <span className="text-black/70 dark:text-white/70">
        {attendees.length === 1
          ? `${attendees[0].username ?? "Someone"} you follow is going too`
          : `${attendees.length} people you follow are going too`}
      </span>
    </div>
  );
}
