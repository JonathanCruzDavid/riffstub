import { ImageResponse } from "next/og";

// Launcher icons for the web app manifest / Android app, drawn the same way
// as app/icon.tsx (ticket on the brand gradient) at the sizes Android needs.
// "maskable" is full-bleed with the ticket inside the central safe zone, since
// Android crops launcher icons to circles/squircles.
const ICONS: Record<string, { size: number; maskable: boolean }> = {
  "icon-192.png": { size: 192, maskable: false },
  "icon-512.png": { size: 512, maskable: false },
  "maskable-512.png": { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const icon = ICONS[name];
  if (!icon) {
    return new Response("Not found", { status: 404 });
  }

  const { size, maskable } = icon;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
          borderRadius: maskable ? 0 : size * 0.22,
          fontSize: size * (maskable ? 0.45 : 0.62),
        }}
      >
        🎫
      </div>
    ),
    { width: size, height: size },
  );
}
