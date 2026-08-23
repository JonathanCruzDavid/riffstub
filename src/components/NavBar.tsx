import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";
import NavSearch from "@/components/NavSearch";
import NotificationBell from "@/components/NotificationBell";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = user?.email ?? "";
  let avatarUrl: string | null = null;
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, is_admin")
      .eq("id", user.id)
      .single();

    username = profile?.username ?? user.email ?? "";
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = profile?.is_admin ?? false;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/[.06] bg-white/80 backdrop-blur-md dark:border-white/[.08] dark:bg-black/60">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
        <Link
          href="/"
          className="flex flex-shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-sm shadow-sm shadow-blue-600/30">
            🎫
          </span>
          Riffstub
        </Link>
        <div className="flex items-center gap-5 text-sm">
          {user ? (
            <>
              <NavSearch />
              <Link
                href="/feed"
                className="flex-shrink-0 text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white"
              >
                Feed
              </Link>
              <Link
                href="/concerts/new"
                className="flex-shrink-0 text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white"
              >
                Add concert
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex-shrink-0 text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white"
                >
                  Admin
                </Link>
              )}
              <NotificationBell />
              <UserMenu username={username} avatarUrl={avatarUrl} />
            </>
          ) : (
            <>
              <NavSearch artistOnly />
              <Link
                href="/login"
                className="flex-shrink-0 whitespace-nowrap text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="flex-shrink-0 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition hover:shadow-md hover:shadow-blue-600/30 hover:brightness-110"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
