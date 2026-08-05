// Sends a structured event to Logflare (docs.logflare.app/concepts/ingestion).
// Fails silently and never throws — logging itself going down should never
// break the actual request it's trying to describe. No-ops safely if the
// source/key aren't configured yet.
export async function logEvent(message: string, metadata?: Record<string, unknown>) {
  const apiKey = process.env.LOGFLARE_API_KEY;
  const sourceId = process.env.LOGFLARE_SOURCE_ID;

  if (!apiKey || !sourceId) return;

  try {
    await fetch(`https://api.logflare.app/api/logs?source=${sourceId}`, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, metadata }),
    });
  } catch {
    // Best-effort — a failed log call is never worth surfacing to the user
    // or the caller.
  }
}
