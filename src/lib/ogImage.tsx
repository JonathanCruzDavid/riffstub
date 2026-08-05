// Shared visual for opengraph-image.tsx and twitter-image.tsx — Next.js
// requires each as its own file-convention route, so this factors out the
// actual design (matching the nav bar's gradient + ticket mark) to avoid
// keeping two copies of the same JSX in sync.
export function SocialCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 92, fontWeight: 700 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "rgba(255, 255, 255, 0.15)",
            fontSize: 64,
          }}
        >
          🎫
        </span>
        <span>Houselights</span>
      </div>
      <div style={{ display: "flex", marginTop: 32, fontSize: 34, opacity: 0.9 }}>
        Every concert you&apos;re going to. One place.
      </div>
    </div>
  );
}

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };
