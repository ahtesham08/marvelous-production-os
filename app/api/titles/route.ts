import { NextResponse, type NextRequest } from "next/server";
import { createFreshTitle, type FreshTitleInput } from "@/lib/freshTitles";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as FreshTitleInput;

  try {
    const title = await createFreshTitle(payload);
    return NextResponse.json({ title });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create title." },
      { status: 400 }
    );
  }
}
