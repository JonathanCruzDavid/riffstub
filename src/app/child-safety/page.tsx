export const metadata = {
  title: "Child Safety Standards",
};

// Published standards against child sexual abuse and exploitation (CSAE).
// Google Play requires social apps to link a page like this in Play Console.
export default function ChildSafetyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Child Safety Standards</h1>
      <p className="mb-8 text-sm text-black/50 dark:text-white/50">Last updated: November 3, 2026</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-black/70 dark:text-white/70">
        <section>
          <p>
            Riffstub has zero tolerance for child sexual abuse and exploitation (CSAE), including child
            sexual abuse material (CSAM). This applies to every part of the app — feed posts, photos,
            profile images, usernames, and bios.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">What&apos;s prohibited</h2>
          <ul className="list-disc pl-5">
            <li>Any content that depicts, promotes, or links to the sexual abuse or exploitation of a minor</li>
            <li>Sexualized content involving anyone under 18, including drawn or AI-generated imagery</li>
            <li>Grooming, or contacting or pursuing a minor for sexual purposes</li>
            <li>Sextortion, or soliciting sexual images from anyone under 18</li>
            <li>Trafficking, or advertising or soliciting a minor for sexual purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">Who can use Riffstub</h2>
          <p>
            Riffstub isn&apos;t directed at children. You must be at least 13 to create an account, and
            everyone agrees to our{" "}
            <a href="/terms" className="underline">
              Terms of Service
            </a>{" "}
            and content rules when they sign up.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">How to report it</h2>
          <ul className="list-disc pl-5">
            <li>
              <strong>In the app:</strong> use <strong>Report</strong> on any post or profile. Reports go
              straight to our moderation queue. You can also block the account so it can&apos;t see your
              profile or follow you.
            </li>
            <li>
              <strong>Directly:</strong>{" "}
              <a href="/contact" className="underline">
                contact us
              </a>{" "}
              and include &quot;child safety&quot; in your message. Child safety reports are reviewed
              first.
            </li>
            <li>
              <strong>To authorities:</strong> you can report to the{" "}
              <a href="https://report.cybertip.org" className="underline" target="_blank" rel="noreferrer">
                NCMEC CyberTipline
              </a>
              . If a child is in immediate danger, call your local emergency number.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">What we do</h2>
          <ul className="list-disc pl-5">
            <li>Remove the content as soon as we become aware of it.</li>
            <li>Permanently ban the account responsible.</li>
            <li>
              Report apparent CSAM to the National Center for Missing &amp; Exploited Children (NCMEC), as
              required by U.S. law, and cooperate with law enforcement.
            </li>
            <li>Preserve related records as the law requires, even if the account has been deleted.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-black dark:text-white">Contact</h2>
          <p>
            Riffstub&apos;s designated child safety contact can be reached through our{" "}
            <a href="/contact" className="underline">
              contact form
            </a>
            . We follow all applicable child safety laws.
          </p>
        </section>
      </div>
    </div>
  );
}
