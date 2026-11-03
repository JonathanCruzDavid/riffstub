import Link from "next/link";

export const metadata = {
  title: "Delete Your Account",
};

// Public on purpose (not behind the /account auth gate): Google Play requires
// a web page explaining how to delete an account that works for people who
// no longer have the app installed. Also where a completed deletion lands.
export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;

  if (deleted === "1") {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Your account has been deleted</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Your profile and everything attached to it has been removed. Thanks for using Riffstub.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-block !px-4 !py-1.5 text-sm">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Delete your Riffstub account</h1>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-black/70 dark:text-white/70">
        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">How to delete it</h2>
          <ol className="list-decimal pl-5">
            <li>
              <Link href="/login" className="underline">
                Sign in
              </Link>{" "}
              on the website or in the app.
            </li>
            <li>
              Open{" "}
              <Link href="/account" className="underline">
                Account settings
              </Link>
              .
            </li>
            <li>
              Scroll to <strong>Delete account</strong>, type DELETE to confirm, and select{" "}
              <strong>Permanently delete</strong>.
            </li>
          </ol>
          <p className="mt-2">
            If two-factor authentication is on, you&apos;ll need to be signed in with your code. Can&apos;t sign in?{" "}
            <Link href="/contact" className="underline">
              Contact us
            </Link>{" "}
            from the email on your account and we&apos;ll delete it for you.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">What gets deleted</h2>
          <p>
            Deletion is immediate and permanent: your login, profile, bio, avatar and banner, concerts,
            setlists, notes, photos, ratings, favorite and liked songs and artists, follows and follow
            requests, feed posts and activity, notifications, blocks, reports you&apos;ve filed, and your
            Spotify connection.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">What may be kept</h2>
          <ul className="list-disc pl-5">
            <li>
              Reports other people filed about your account or posts, so moderation decisions stay on
              record.
            </li>
            <li>
              Error logs, which can include your account ID, kept by our logging provider for a limited
              time.
            </li>
            <li>Any messages you sent through the contact form, which arrive as email.</li>
          </ul>
          <p className="mt-2">
            If you connected Spotify, you can also remove Riffstub&apos;s access from your Spotify account
            settings.
          </p>
        </section>
      </div>
    </div>
  );
}
