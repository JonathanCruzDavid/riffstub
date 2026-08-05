import { createClient } from "@/lib/supabase/server";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import AvatarUpload from "@/components/AvatarUpload";
import BannerUpload from "@/components/BannerUpload";
import UsernameForm from "@/components/UsernameForm";
import PrivacyToggle from "@/components/PrivacyToggle";
import TwoFactorSettings from "@/components/TwoFactorSettings";

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
          <div className="flex items-center justify-between">
            <p className="text-sm text-black/60 dark:text-white/60">
              See which of your artists are playing near you.
            </p>
            <a
              href="/api/spotify/login"
              className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background"
            >
              Connect
            </a>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <p className="mb-2 font-medium">Password</p>
        <ChangePasswordForm email={user!.email!} />
      </div>
    </div>
  );
}
