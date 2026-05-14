import { NextResponse, type NextRequest } from "next/server";
import { createFreshTitles, parseBrainstormingText, type FreshTitleInput } from "@/lib/freshTitles";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { text?: string; titles?: FreshTitleInput[] };
  const titles = payload.titles ?? parseBrainstormingText(payload.text ?? "");

  try {
    const created = await createFreshTitles(titles);
    return NextResponse.json({ created });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create brainstorming titles." },
      { status: 400 }
    );
  }
}
