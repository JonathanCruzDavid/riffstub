export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-black/50 dark:text-white/50">Last updated: July 31, 2026</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-black/70 dark:text-white/70">
        <section>
          <p>
            This explains what Riffstub collects, why, and what you can do
            about it. Riffstub is a small, independently-run app — your data is
            used to run the app for you, not sold or handed to advertisers.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            What we collect
          </h2>
          <ul className="list-disc pl-5">
            <li>
              <strong>Account info</strong> — your email address and
              password (handled securely by our authentication provider, not
              stored by us in plain text), and the username, bio, avatar, and
              banner photo you choose to set.
            </li>
            <li>
              <strong>Concert data you enter</strong> — artists, venues,
              dates, photos, notes, and ratings for shows you add, whether
              upcoming or past.
            </li>
            <li>
              <strong>Spotify data</strong> — only if you connect your
              Spotify account: your top artists, followed artists, and the
              access tokens needed to keep that connection working. You can
              disconnect at any time from account settings, which deletes
              those tokens.
            </li>
            <li>
              <strong>Location</strong> — to show concerts near you, we use
              either your device's location (with your browser's permission)
              or a ZIP code you enter. This is used to query nearby shows and
              is kept in your browser, not saved on our servers tied to your
              account.
            </li>
            <li>
              <strong>Social activity</strong> — who you follow and who
              follows you, feed posts you write, and reports you file
              (including the reason you gave).
            </li>
            <li>
              <strong>Two-factor authentication status</strong> — whether
              you've enabled it. The authenticator secret itself is managed
              by Supabase, our authentication provider — Riffstub' own code
              never sees or stores it.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            How we use it
          </h2>
          <p>
            To run the app: show your concerts, find shows near you, match
            nearby shows against artists you listen to on Spotify, show your
            feed and the activity of people you follow, and let other users
            find your public profile by username. Reports you file (or that
            are filed against your content) are used to review and, if
            warranted, remove content or restrict accounts. We don't use
            your data for advertising, and we don't sell it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            What's shared with third parties, and with whom
          </h2>
          <ul className="list-disc pl-5">
            <li>
              Your approximate location (coordinates or ZIP-derived
              coordinates) is sent to Ticketmaster and SeatGeek's public
              search APIs to look up nearby shows — not your name, email, or
              account details.
            </li>
            <li>
              If connected, your Spotify data is fetched directly from
              Spotify using your own authorization — Riffstub doesn't share
              your Spotify data with anyone else.
            </li>
            <li>
              Your account data (email, profile, concerts, photos) is stored
              with Supabase, our database and file storage provider.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            What's public
          </h2>
          <p className="mb-2">
            If your account is public (the default), your username, avatar,
            bio, favorite artist, favorite song, songs you like, feed posts,
            and activity (shows added, ratings, favorite picks) are visible
            to anyone who looks up your profile. Your concert history —
            upcoming shows, past shows, notes, ratings, and photos — is
            always private and only visible to you, regardless of this
            setting.
          </p>
          <p className="mb-2">
            If you set your account to private in account settings, that
            same profile content, feed posts, and activity are only visible
            to followers you've approved, plus you. New followers need your
            approval first.
          </p>
          <p>
            One exception either way: follow relationships themselves (who
            follows whom) are visible to anyone, even for private accounts —
            it's only the profile content and activity that privacy
            controls.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            Content moderation and reports
          </h2>
          <p>
            If you or your content is reported, an administrator reviews the
            report — including the reason given and who filed it — to decide
            whether to remove content or take other action. Feed posts,
            bios, and usernames also pass through an automated filter that
            blocks severe slurs and hate speech before they're posted.
            Administrator access is itself protected by two-factor
            authentication, which we require for that role specifically.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            Your choices
          </h2>
          <ul className="list-disc pl-5">
            <li>Edit or remove your profile info, bio, and photos at any time.</li>
            <li>Make your account private, or switch back to public, at any time.</li>
            <li>Unfollow anyone, or remove one of your own followers.</li>
            <li>Delete a feed post you've written.</li>
            <li>Enable or disable two-factor authentication from account settings.</li>
            <li>Disconnect Spotify at any time from account settings.</li>
            <li>Delete individual concerts you've added.</li>
            <li>
              Delete your account by{" "}
              <a href="/contact" className="underline">
                contacting us
              </a>{" "}
              — this removes your profile, concerts, photos, follows, feed
              posts, and connections.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            Children's privacy
          </h2>
          <p>
            Riffstub isn't directed at children under 13, and we don't
            knowingly collect data from anyone under 13.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            Changes to this policy
          </h2>
          <p>
            If this policy changes, we'll update the date at the top of this
            page.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            Contact
          </h2>
          <p>
            Questions about your data?{" "}
            <a href="/contact" className="underline">
              Get in touch
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
