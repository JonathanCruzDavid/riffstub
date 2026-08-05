import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, RATE_LIMITS, type RateLimitAction } from "@/lib/rateLimit";

// Lets client components (signup, login — both call Supabase's auth API
// directly, not through our own backend) ask "am I allowed to try this?"
// using the real IP from this request's own headers, before they actually
// attempt the action.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action as string | undefined;

  if (!action || !(action in RATE_LIMITS)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const supabase = await createClient();
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(supabase, action as RateLimitAction, ip);

  return NextResponse.json({ allowed });
}
