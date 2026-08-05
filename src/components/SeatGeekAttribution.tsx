// SeatGeek's platform terms require attribution "in the form of the
// SeatGeek logo," not text alone — no specific minimum size is documented
// (unlike Spotify's confirmed 70px floor), so this is sized just large
// enough to stay clearly legible. The SVG is SeatGeek's official wordmark,
// served from public/brand/seatgeek-logo.svg. This badge only renders when
// a SeatGeek-sourced listing is actually present in the current results.
export default function SeatGeekAttribution() {
  return (
    <a
      href="https://seatgeek.com"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex w-fit items-center gap-1.5 opacity-70 transition hover:opacity-100"
    >
      <span className="text-[10px] text-black/50 dark:text-white/50">Some listings from</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/seatgeek-logo.svg" alt="SeatGeek" className="h-auto w-9" />
    </a>
  );
}
