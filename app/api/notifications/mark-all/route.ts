import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "@/lib/notifications";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const userContext = await getCurrentUserContext();

  try {
    await markAllNotificationsRead(userContext.user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to mark notifications read." },
      { status: 400 }
    );
  }
}
