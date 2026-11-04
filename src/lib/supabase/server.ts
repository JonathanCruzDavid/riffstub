import { createServerClient } from "@supabase/ssr";
import { createClient as createTokenClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// For API routes the Android app also calls: the app has no browser cookie,
// so it sends its Supabase access token as `Authorization: Bearer …`. Queries
// then run under that user's RLS exactly as with the cookie session.
export async function createClientForRequest(
  request: Request,
): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];

  if (token) {
    const supabase = createTokenClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data } = await supabase.auth.getUser(token);
    return { supabase, user: data.user };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component; middleware refreshes
            // the session instead, so this can be safely ignored.
          }
        },
      },
    },
  );
}
