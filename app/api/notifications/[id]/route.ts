import { NextResponse, type NextRequest } from "next/server";
import { markNotificationRead } from "@/lib/notifications";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function PATCH(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userContext = await getCurrentUserContext();

  try {
    await markNotificationRead(id, userContext.user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to mark notification read." },
      { status: 400 }
    );
  }
}
