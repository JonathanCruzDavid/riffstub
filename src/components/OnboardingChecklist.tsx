"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "riffstub:onboarding-dismissed";

type Item = {
  done: boolean;
  label: string;
  href: string;
  cta: string;
};

export default function OnboardingChecklist({
  hasConcert,
  hasLikedArtists,
}: {
  hasConcert: boolean;
  hasLikedArtists: boolean;
}) {
  const [dismissed, setDismissed] = useState(true); // default hidden until localStorage check settles, avoids a flash

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const items: Item[] = [
    {
      done: hasConcert,
      label: "Add your first concert",
      href: "/concerts/new",
      cta: "Add a concert",
    },
    {
      done: hasLikedArtists,
      label: "Add artists you like to see their shows near you",
      href: "/profile",
      cta: "Add artists",
    },
  ];

  const allDone = items.every((i) => i.done);

  if (dismissed || allDone) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="card relative mb-10 p-4">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-black/40 transition hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
      >
        ✕
      </button>
      <p className="mb-3 pr-6 font-medium">Get the most out of Riffstub</p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs ${
                  item.done
                    ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white"
                    : "border border-black/20 dark:border-white/25"
                }`}
              >
                {item.done ? "✓" : ""}
              </span>
              <span
                className={`text-sm ${item.done ? "text-black/40 line-through dark:text-white/40" : ""}`}
              >
                {item.label}
              </span>
            </div>
            {!item.done && (
              <Link href={item.href} className="flex-shrink-0 text-xs underline text-black/60 dark:text-white/60">
                {item.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
