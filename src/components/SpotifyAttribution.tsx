// Spotify's Developer Policy requires any use of their metadata (artist/track
// names, album art) to be accompanied by the actual Spotify logo — not a
// text-only credit — and a link back to Spotify. The SVG here is Spotify's
// official icon+wordmark mark, served from public/brand/spotify-logo.svg,
// sized to their stated 70px minimum for digital placements.
export default function SpotifyAttribution() {
  return (
    <a
      href="https://open.spotify.com"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex w-fit items-center gap-1.5 opacity-70 transition hover:opacity-100"
    >
      <span className="text-[10px] text-black/50 dark:text-white/50">Music data from</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/spotify-logo.svg" alt="Spotify" className="h-auto w-[70px]" />
    </a>
  );
}
