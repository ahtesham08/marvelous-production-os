import { NextResponse, type NextRequest } from "next/server";
import { createBrainstormingSession, getBrainstormingSessions } from "@/lib/brainstorming";
import { getCurrentUserContext, isAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ sessions: await getBrainstormingSessions() });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const context = await getCurrentUserContext();
  if (!isAdmin(context.user?.role)) return NextResponse.json({ error: "Only Admin can create sessions." }, { status: 403 });

  try {
    const session = await createBrainstormingSession(await request.json(), context.user);
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Brainstorming session request failed.";
}
