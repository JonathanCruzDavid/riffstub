import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Spotify's OAuth requires a loopback IP (127.0.0.1) rather than
  // "localhost" for redirect URIs; allow the dev server's HMR socket to
  // accept requests from that origin too, or the client JS breaks there.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
