import { NextResponse } from "next/server";

// Digital Asset Links: proves to Android that the Riffstub app and
// riffstub.com belong together, which is what lets the Trusted Web Activity
// open full-screen without a browser address bar. The fingerprint comes from
// Play Console (Setup -> App signing -> "SHA-256 certificate fingerprint"), so
// it's config, not code. Comma-separate several (e.g. Play's app signing key
// plus your local upload key for testing sideloaded builds).
export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME ?? "com.riffstub.app";
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  if (fingerprints.length === 0) {
    return NextResponse.json([]);
  }

  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
}
