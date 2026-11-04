import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import AvatarUpload from "@/components/AvatarUpload";
import BannerUpload from "@/components/BannerUpload";
import UsernameForm from "@/components/UsernameForm";
import PrivacyToggle from "@/components/PrivacyToggle";
import TwoFactorSettings from "@/components/TwoFactorSettings";
import BlockButton from "@/components/BlockButton";
import DeleteAccountSection from "@/components/DeleteAccountSection";
import type { BlockedAccount } from "@/lib/types";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, banner_url, is_private, is_admin")
    .eq("id", user!.id)
    .single();

  const { data: spotifyConnection } = await supabase
    .from("spotify_connections")
    .select("user_id")
    .eq("user_id", user!.id)
    .maybeSingle();

  const { data: blockedData } = await supabase.rpc("get_blocked_accounts");
  const blockedAccounts = (blockedData ?? []) as BlockedAccount[];

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Account Settings</h1>

      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <p className="mb-2 font-medium">Profile photo</p>
        <AvatarUpload avatarUrl={profile?.avatar_url ?? null} />
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <p className="mb-2 font-medium">Profile banner</p>
        <BannerUpload bannerUrl={profile?.banner_url ?? null} />
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <p className="mb-2 font-medium">Username</p>
        <UsernameForm initialUsername={profile?.username ?? ""} />
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <PrivacyToggle initialIsPrivate={profile?.is_private ?? false} />
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <TwoFactorSettings required={profile?.is_admin ?? false} />
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <p className="mb-1 font-medium">Spotify</p>
        {spotifyConnection ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-black/60 dark:text-white/60">Connected</p>
            <form action="/api/spotify/disconnect" method="post">
              <button type="submit" className="text-sm underline text-black/60 dark:text-white/60">
                Disconnect
              </button>
            </form>
          </div>
        ) : (
          // Spotify's Development Mode only lets allowlisted accounts finish
          // the login flow, so a Connect button would fail for nearly
          // everyone. Song/artist search uses the app's own token and is
          // unaffected. Restore the link to /api/spotify/login once Spotify
          // grants extended quota.
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-black/60 dark:text-white/60">
              See which of your artists are playing near you.
            </p>
            <span className="flex-shrink-0 rounded-md border border-black/10 px-3 py-1.5 text-sm text-black/50 dark:border-white/20 dark:text-white/50">
              Coming soon
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <p className="mb-1 font-medium">Blocked accounts</p>
        {blockedAccounts.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {blockedAccounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {account.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={account.avatar_url} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-black/5 text-xs dark:bg-white/5">
                      {(account.username ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate text-sm">{account.username ?? "Unnamed account"}</span>
                </div>
                <BlockButton
                  targetUserId={account.id}
                  username={account.username ?? "this account"}
                  initialIsBlocked
                  className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-black/60 dark:text-white/60">
            You haven&apos;t blocked anyone. You can block an account from its profile.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <p className="mb-2 font-medium">Password</p>
        <ChangePasswordForm email={user!.email!} />
      </div>

      {/* Phones only: the tab bar replaces the avatar menu and the footer is
          hidden (see MobileTabBar), so their links and Log out live here. */}
      <div className="mt-8 rounded-lg border border-black/10 sm:hidden dark:border-white/10">
        <ul className="divide-y divide-black/10 text-sm dark:divide-white/10">
          {[
            ...(profile?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact & support" },
            { href: "/terms", label: "Terms of Service" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/child-safety", label: "Child Safety" },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center justify-between px-4 py-3">
                {item.label}
                <span aria-hidden className="text-black/30 dark:text-white/30">
                  ›
                </span>
              </Link>
            </li>
          ))}
          <li>
            <form action="/auth/signout" method="post">
              <button type="submit" className="w-full px-4 py-3 text-left font-medium text-red-600">
                Log out
              </button>
            </form>
          </li>
        </ul>
      </div>

      <div className="mt-8 rounded-lg border border-red-200 p-4 dark:border-red-500/30">
        <DeleteAccountSection />
      </div>
    </div>
  );
}
