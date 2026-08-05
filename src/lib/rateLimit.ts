import type { SupabaseClient } from "@supabase/supabase-js";
import { logEvent } from "@/lib/logflare";

// Vercel (and most proxies) set x-forwarded-for to "client, proxy1, proxy2"
// — the first entry is the original client. Falls back to x-real-ip, then a
// constant so local dev (no proxy headers at all) still buckets consistently
// instead of every request looking like a different, unlimited IP.
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export const RATE_LIMITS = {
  signup: { max: 5, windowMinutes: 60 },
  login: { max: 10, windowMinutes: 15 },
  contact: { max: 5, windowMinutes: 15 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

// Fails open (allows the request) if the check itself errors — a transient
// DB hiccup shouldn't lock out real users. Rate limiting is a courtesy
// layer on top of Supabase's own auth rate limits, not the last line of
// defense, so erring toward availability here is the right tradeoff.
export async function checkRateLimit(
  supabase: SupabaseClient,
  action: RateLimitAction,
  ip: string,
): Promise<boolean> {
  const { max, windowMinutes } = RATE_LIMITS[action];
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: `${action}:${ip}`,
    p_max_attempts: max,
    p_window_minutes: windowMinutes,
  });

  if (error) {
    console.error(`[rate-limit] check failed for ${action}`, error);
    await logEvent("rate-limit check failed", { action, error: error.message });
    return true;
  }

  return data === true;
}
