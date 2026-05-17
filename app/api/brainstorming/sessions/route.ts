import { NextResponse, type NextRequest } from "next/server";
import {
  createBrainstormingSession,
  deleteBrainstormingSession,
  getBrainstormingSessionsWithDailyEnsure,
  updateBrainstormingSession
} from "@/lib/brainstorming";
import { getCurrentUserContext, isAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ sessions: await getBrainstormingSessionsWithDailyEnsure() });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const context = await getCurrentUserContext();
  if (!canCreateSession(context.user?.role)) {
    return NextResponse.json({ error: "Only Admin and Supervisors can create sessions." }, { status: 403 });
  }

  try {
    const session = await createBrainstormingSession(await request.json(), context.user);
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const context = await getCurrentUserContext();
  if (!isAdmin(context.user?.role)) return NextResponse.json({ error: "Only Admin can edit sessions." }, { status: 403 });

  try {
    const payload = await request.json();
    if (!payload.id) return NextResponse.json({ error: "Session id is required." }, { status: 400 });
    const session = await updateBrainstormingSession(payload.id, payload);
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const context = await getCurrentUserContext();
  if (!isAdmin(context.user?.role)) return NextResponse.json({ error: "Only Admin can delete sessions." }, { status: 403 });

  try {
    const payload = await request.json();
    if (!payload.id) return NextResponse.json({ error: "Session id is required." }, { status: 400 });
    await deleteBrainstormingSession(payload.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Brainstorming session request failed.";
}

function canCreateSession(role: string | null | undefined) {
  return role === "Admin" || role === "Supervisor";
}
