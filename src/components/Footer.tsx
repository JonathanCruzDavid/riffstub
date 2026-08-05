import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/[.06] dark:border-white/[.08]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center text-xs text-black/50 dark:text-white/50 sm:flex-row sm:justify-between sm:text-left">
        <p>© {year} Houselights. Not affiliated with Ticketmaster, SeatGeek, or Spotify.</p>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-black dark:hover:text-white">
            About
          </Link>
          <Link href="/terms" className="hover:text-black dark:hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-black dark:hover:text-white">
            Privacy
          </Link>
          <Link href="/contact" className="hover:text-black dark:hover:text-white">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
