import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getAppMode } from "@/lib/appMode";
import { hasSupabaseAdminConfig, hasSupabasePublicConfig, createSupabaseAdminClient } from "@/lib/supabaseServer";
import type { UserRecord } from "@/lib/types";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export type AppUserContext = {
  mode: ReturnType<typeof getAppMode>;
  isAuthenticated: boolean;
  isApproved: boolean;
  authEmail: string | null;
  user: UserRecord | null;
  message?: string;
};

/**
 * Deduplicated per request: the root layout and the page both need the signed-in user.
 * Without cache() each call did its own Supabase Auth round trip + users lookup.
 */
export const getCurrentUserContext = cache(loadCurrentUserContext);

async function loadCurrentUserContext(): Promise<AppUserContext> {
  const mode = getAppMode();

  if (!hasSupabasePublicConfig()) {
    return {
      mode,
      isAuthenticated: mode !== "production",
      isApproved: mode !== "production",
      authEmail: null,
      user:
        mode === "production"
          ? null
          : {
              id: "demo-admin",
              name: "Ahtesham",
              email: null,
              role: "Admin",
              active: true,
              default_channel: null,
              default_supervisor: null,
              created_at: null,
              updated_at: null
            },
      message: mode === "production" ? "Supabase is required in production mode." : undefined
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot always persist refreshed auth cookies. Middleware/route handlers handle cookie writes.
          }
        }
      }
    }
  );

  const authResult = await supabase.auth.getUser().catch((error) => ({
    data: { user: null },
    error
  }));
  const authUser = authResult.data.user;

  if (!authUser?.email) {
    return {
      mode,
      isAuthenticated: false,
      isApproved: false,
      authEmail: null,
      user: null
    };
  }

  if (!hasSupabaseAdminConfig()) {
    return {
      mode,
      isAuthenticated: true,
      isApproved: false,
      authEmail: authUser.email,
      user: null,
      message: "Supabase service role key is required to approve users."
    };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("email", authUser.email)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    return {
      mode,
      isAuthenticated: true,
      isApproved: false,
      authEmail: authUser.email,
      user: null,
      message: error.message
    };
  }

  return {
    mode,
    isAuthenticated: true,
    isApproved: Boolean(data),
    authEmail: authUser.email,
    user: (data as UserRecord | null) ?? null,
    message: data ? undefined : "Your account is not approved. Ask Admin to add your email."
  };
}

export function canEditRole(role: string | null | undefined) {
  return role === "Admin" || role === "Supervisor" || role === "Operations Supervisor";
}

export function isAdmin(role: string | null | undefined) {
  return role === "Admin";
}
