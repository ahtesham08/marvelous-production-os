import { NextResponse, type NextRequest } from "next/server";
import { createFreshTitle, type FreshTitleInput } from "@/lib/freshTitles";
import { getCurrentUserContext } from "@/lib/serverAuth";
import { deleteTitles } from "@/lib/titleUpdates";

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

export async function DELETE(request: NextRequest) {
  const userContext = await getCurrentUserContext();
  const payload = (await request.json()) as { ids?: string[] };

  try {
    const result = await deleteTitles(payload.ids ?? [], userContext.user);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete selected titles." },
      { status: 400 }
    );
  }
}
