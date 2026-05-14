import { NextResponse, type NextRequest } from "next/server";
import { createBrainstormingTitle, getBrainstormingTitles } from "@/lib/brainstorming";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const titles = await getBrainstormingTitles({
      sessionId: searchParams.get("sessionId") ?? undefined,
      status: searchParams.get("status") ?? undefined
    });
    return NextResponse.json({ titles });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const context = await getCurrentUserContext();
  const role = context.user?.role;
  if (!["Admin", "Supervisor"].includes(String(role))) {
    return NextResponse.json({ error: "Only Admin and Supervisors can submit title ideas." }, { status: 403 });
  }

  try {
    const title = await createBrainstormingTitle(await request.json(), context.user);
    return NextResponse.json({ title });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Brainstorming title request failed.";
}
