import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/auth/callback", "/not-approved"];

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function middleware(request: NextRequest) {
  const appMode = process.env.NEXT_PUBLIC_APP_MODE;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (appMode !== "production" && !supabaseUrl) {
    return NextResponse.next();
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    if (appMode === "production" && !isPublicPath) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", "production-env-missing");
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (appMode === "production" && user?.email && !isPublicPath) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/not-approved";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    const approved = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(user.email)}&active=eq.true&select=id`, {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`
      }
    })
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);

    if (!Array.isArray(approved) || approved.length === 0) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/not-approved";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
