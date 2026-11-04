// Shown the instant a link is tapped while the next page renders on the
// server — without it, navigation looks frozen until the response arrives.
// The NavBar and phone tab bar live in the root layout, so they stay put.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 animate-pulse px-4 py-10" aria-busy="true" aria-label="Loading">
      <div className="mb-6 h-7 w-40 rounded-md bg-black/[.06] dark:bg-white/[.08]" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-black/[.04] dark:bg-white/[.05]" />
        ))}
      </div>
    </div>
  );
}
