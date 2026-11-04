"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Phone-only bottom navigation (hidden from the sm breakpoint up, where the
// top NavBar has room for these links). globals.css pads the page and hides
// the footer whenever this bar is on screen — see #mobile-tab-bar there.
const TABS = [
  {
    href: "/dashboard",
    label: "Home",
    match: (p: string) => p === "/dashboard",
    icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z",
  },
  {
    href: "/feed",
    label: "Feed",
    match: (p: string) => p.startsWith("/feed"),
    icon: "M4 5h16M4 12h16M4 19h10",
  },
  {
    href: "/concerts/new",
    label: "Add",
    match: (p: string) => p === "/concerts/new",
    icon: "M12 5v14M5 12h14",
  },
  {
    href: "/profile",
    label: "Profile",
    match: (p: string) => p.startsWith("/profile"),
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  },
  {
    href: "/account",
    label: "Settings",
    match: (p: string) => p.startsWith("/account") || p.startsWith("/admin"),
    icon: "M4 7h9m4 0h3M4 17h3m4 0h9M15 5v4M9 15v4",
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      id="mobile-tab-bar"
      className="fixed inset-x-0 bottom-0 z-30 select-none border-t border-black/[.06] bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden dark:border-white/[.08] dark:bg-black/80"
    >
      <ul className="grid h-16 grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                  active ? "text-blue-600 dark:text-blue-400" : "text-black/50 dark:text-white/50"
                }`}
              >
                {tab.label === "Add" ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm shadow-blue-600/30">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={tab.icon} />
                    </svg>
                  </span>
                ) : (
                  <span className="flex h-8 items-center">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={tab.icon} />
                    </svg>
                  </span>
                )}
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
