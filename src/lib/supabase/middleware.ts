import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() refreshes an expiring session like getUser() does, but
  // verifies the JWT locally against the project's cached signing keys
  // (ES256) instead of a round trip to Supabase Auth on every request.
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  let user: unknown = claimsData?.claims ?? null;
  if (!user && claimsError) {
    // Fall back to the network check rather than bouncing a signed-in
    // user to /login if local verification ever fails (e.g. JWKS fetch).
    user = (await supabase.auth.getUser()).data.user;
  }

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  // /concerts/preview is a public artist/show detail page (top tracks, tour
  // date) so logged-out visitors can look before they sign up — everything
  // else under /concerts (a user's own saved list, adding a concert) stays
  // gated.
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/feed") ||
    (request.nextUrl.pathname.startsWith("/concerts") &&
      !request.nextUrl.pathname.startsWith("/concerts/preview")) ||
    request.nextUrl.pathname.startsWith("/profile") ||
    request.nextUrl.pathname.startsWith("/account");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
