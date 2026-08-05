"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function UserMenu({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 hover:underline"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black/10 text-xs dark:bg-white/10">
            {username.charAt(0).toUpperCase()}
          </span>
        )}
        {username}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-md border border-black/10 bg-background py-1 shadow-lg dark:border-white/10">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
          >
            Profile
          </Link>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
          >
            Account Settings
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
