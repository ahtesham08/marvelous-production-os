import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/auth/callback", "/not-approved"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isCronPath = pathname.startsWith("/api/cron/");
  const isApiPath = pathname.startsWith("/api/");
  const appMode = process.env.NEXT_PUBLIC_APP_MODE;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isCronPath) return NextResponse.next();

  if (appMode === "production" && (!supabaseUrl || !supabaseAnonKey) && !isPublicPath) {
    if (isApiPath) {
      return NextResponse.json({ error: "Production Supabase environment variables are missing." }, { status: 503 });
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "production-env-missing");
    return NextResponse.redirect(redirectUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-mpos-pathname", pathname);

  if (appMode === "production" && !isPublicPath && !hasSupabaseSessionCookie(request)) {
    if (isApiPath) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token") && Boolean(cookie.value));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
