import { NextResponse } from "next/server";
import { getCurrentUserContext, type AppUserContext } from "@/lib/serverAuth";
import type { UserRecord } from "@/lib/types";

/**
 * Server-side guard for API route handlers.
 *
 * Middleware only checks that a Supabase cookie *exists* (cheap, avoids timeouts),
 * so every handler must verify the session and the allowlisted user itself.
 * In demo/local mode without Supabase, getCurrentUserContext returns the demo Admin.
 */
export type ApiAuthResult =
  | { ok: true; context: AppUserContext; user: UserRecord }
  | { ok: false; response: NextResponse };

export async function requireApiUser(allowedRoles?: readonly string[]): Promise<ApiAuthResult> {
  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    return { ok: false, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  if (!context.isApproved || !context.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: context.message || "Your account is not approved." }, { status: 403 })
    };
  }

  if (allowedRoles && !allowedRoles.includes(String(context.user.role))) {
    return {
      ok: false,
      response: NextResponse.json({ error: "You do not have permission to do this." }, { status: 403 })
    };
  }

  return { ok: true, context, user: context.user };
}

export const EDITOR_ROLES = ["Admin", "Supervisor", "Operations Supervisor"] as const;
export const ADMIN_ONLY = ["Admin"] as const;
