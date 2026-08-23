export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Terms of Service</h1>
      <p className="mb-8 text-sm text-black/50 dark:text-white/50">Last updated: July 31, 2026</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-black/70 dark:text-white/70">
        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            1. Acceptance of these terms
          </h2>
          <p>
            By creating an account or using Riffstub ("Riffstub," "we," "us"),
            you agree to these Terms of Service and our{" "}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>
            . If you don't agree, please don't use the app.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            2. What Riffstub is
          </h2>
          <p>
            Riffstub is a personal tool for tracking concerts you're going to
            and concerts you've been to, with some social features layered on
            top — following other users, a feed, and posting your own
            updates. It surfaces upcoming show listings from third-party
            ticketing platforms and, if you connect your Spotify account,
            uses your listening data to personalize what you see. Riffstub is
            not a ticket seller — every ticket purchase happens on the
            third-party site you're sent to, and Riffstub is never involved
            in that transaction.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            3. Who can use Riffstub
          </h2>
          <p>
            You must be at least 13 years old to create an account. By
            signing up, you confirm the information you provide (like your
            email and username) is accurate and that you're responsible for
            keeping your login credentials secure. You're responsible for
            activity that happens under your account.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            4. Your content
          </h2>
          <p className="mb-2">
            You keep ownership of everything you add — concert photos, notes,
            ratings, your bio, feed posts, and so on ("your content"). By
            posting it, you give Riffstub a limited license to store and
            display it back to you, and to display it to other users where
            it's meant to be seen (your feed posts and activity to your
            followers; your public profile fields to anyone who looks up
            your profile), as part of running the app.
          </p>
          <p className="mb-2">
            Your concert history (upcoming shows, past shows, ratings, notes,
            photos) is private to your account and isn't shown to other
            users. Public profile search only surfaces the profile fields
            you've explicitly filled in — username, avatar, bio, favorite
            artist, favorite song, and songs you like — plus feed posts and
            activity if your profile is public or the viewer follows you.
          </p>
          <p>
            Don't upload anything you don't have the right to share, and
            don't upload anything illegal, harassing, or infringing on
            someone else's rights. We can remove content or suspend accounts
            that violate this.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            5. Following, private accounts, and your feed
          </h2>
          <p className="mb-2">
            You can follow other users to see their activity (shows they add,
            ratings, favorite picks) and posts on your feed. By default,
            following is instant. If you set your account to private in
            account settings, new followers need your approval first — you'll
            see their request and can accept or decline it. Whether your
            account is public or private, the fact that you follow someone
            or someone follows you is visible to anyone who looks (follow
            relationships aren't private), even though your profile content
            can be.
          </p>
          <p>
            Anything you post to the feed is visible to your followers (and
            to you). If your account is private, that also means anyone you've
            approved as a follower can see it, even if you later go back to
            public or private again — approval doesn't automatically expire.
            You can delete your own posts and unfollow or remove followers at
            any time.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            6. Content rules and moderation
          </h2>
          <p className="mb-2">
            Don't post anything illegal, hateful, harassing, or that targets
            someone based on race, ethnicity, religion, gender, sexual
            orientation, or disability. Feed posts, bios, and usernames are
            checked by an automated filter that blocks severe slurs and hate
            speech before they're posted — it's a narrow, best-effort filter,
            not a guarantee that all violating content is caught.
          </p>
          <p>
            Any user can report a post or an account they think violates
            these terms. Reports are reviewed by an administrator, who can
            remove violating posts or take other action on the account. If
            you file a report, your identity and the reason you gave are
            visible to the administrator reviewing it — not to the person
            you reported.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            7. Third-party data and services
          </h2>
          <p className="mb-2">
            Riffstub displays data from services it doesn't control, and isn't
            responsible for its accuracy:
          </p>
          <ul className="mb-2 list-disc pl-5">
            <li>
              <strong>Ticketmaster and SeatGeek</strong> — event listings,
              venues, dates, and ticket links. Show details can change,
              shows can be postponed or cancelled, and prices/availability
              shown may not be current. Always confirm on the ticket
              seller's own site before you buy.
            </li>
            <li>
              <strong>Spotify</strong> — if you connect your account, Riffstub
              reads your top artists, followed artists, and lets you search
              tracks/artists, using Spotify's API under your authorization.
              You can disconnect Spotify at any time from your account
              settings, which revokes Riffstub' access.
            </li>
          </ul>
          <p>
            Riffstub is not affiliated with, endorsed by, or sponsored by
            Ticketmaster, SeatGeek, or Spotify. All trademarks, artist names,
            and images belong to their respective owners.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            8. Account security and two-factor authentication
          </h2>
          <p>
            You're responsible for keeping your password, and your
            authenticator app or device if you enable two-factor
            authentication, secure. If you lose access to your
            authenticator, contact us to help recover your account. We
            don't have access to your two-factor codes or authenticator
            secret — that's managed by our authentication provider, not
            stored in a form we can read.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            9. Acceptable use
          </h2>
          <p className="mb-2">Please don't:</p>
          <ul className="list-disc pl-5">
            <li>Scrape, bulk-download, or resell data from Riffstub or the third-party APIs it uses</li>
            <li>Try to bypass rate limits, security measures, or reverse-engineer the app</li>
            <li>Impersonate another person or misuse the public profile/username search</li>
            <li>Use Riffstub for anything illegal or to harass another user</li>
            <li>File false or bad-faith reports against another user's content or account</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            10. No warranty
          </h2>
          <p>
            Riffstub is provided "as is," without warranties of any kind. We
            don't guarantee the app will be error-free, uninterrupted, or
            that event listings, dates, or prices shown are accurate or
            up to date. Use it at your own judgment, and double-check
            important details (especially dates and venues) before making
            plans or purchases.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            11. Limitation of liability
          </h2>
          <p>
            To the fullest extent permitted by law, Riffstub and its operator
            aren't liable for indirect, incidental, or consequential damages
            arising from your use of the app — including missed events,
            incorrect listings, or issues with a third-party ticket purchase.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            12. Account termination
          </h2>
          <p>
            You can delete your account at any time. We may suspend or
            terminate accounts that violate these terms, including in
            response to a report.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            13. Changes to these terms
          </h2>
          <p>
            We may update these terms as Riffstub changes. We'll update the
            "Last updated" date above when we do. Continuing to use Riffstub
            after a change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">
            14. Contact
          </h2>
          <p>
            Questions about these terms?{" "}
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
