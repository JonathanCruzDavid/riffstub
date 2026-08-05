export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">About Houselights</h1>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-black/70 dark:text-white/70">
        <p>
          Houselights is a personal concert tracker — one place to keep every show
          you're going to, and a record of every one you've been to. Search
          for an artist, see their upcoming tour dates and where they rank
          against your Spotify listening, and log the shows you've already
          caught with a photo, a rating, and whatever you want to remember
          about the night.
        </p>
        <p>
          It's also a little social — follow other people to see what shows
          they're going to on your feed, get a heads-up when someone you
          follow is headed to the same concert as you, and post your own
          updates. You can make your profile private if you'd rather keep it
          approval-only, and two-factor authentication is available for
          anyone who wants extra login security.
        </p>
        <p>
          It started as a way to stop losing track of concerts across
          Ticketmaster, SeatGeek, group chats, and a phone full of screenshots
          — and turned into a small, independent project built by one person
          who likes going to shows.
        </p>
        <p>
          Houselights pulls upcoming show listings from{" "}
          <a
            href="https://www.ticketmaster.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Ticketmaster
          </a>{" "}
          and{" "}
          <a
            href="https://seatgeek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            SeatGeek
          </a>
          , and music data — top artists, favorite songs, artist art — from{" "}
          <a
            href="https://www.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Spotify
          </a>{" "}
          when you choose to connect your account. Houselights isn't affiliated
          with, endorsed by, or sponsored by any of them — see the{" "}
          <a href="/terms" className="underline">
            Terms
          </a>{" "}
          for details.
        </p>
        <p>
          Have feedback or run into a bug? It's a one-person project, so
          reports genuinely help — reach out through the contact info in the{" "}
          <a href="/terms" className="underline">
            Terms
          </a>{" "}
          page.
        </p>
      </div>
    </div>
  );
}
