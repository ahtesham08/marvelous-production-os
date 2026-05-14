import { NextResponse, type NextRequest } from "next/server";
import { getTitleRecord, updateTitle, type TitleUpdatePayload } from "@/lib/titleUpdates";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const title = await getTitleRecord(id);
    return NextResponse.json({ title });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Title not found." }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = (await request.json()) as TitleUpdatePayload;

  try {
    const result = await updateTitle(id, payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update title." },
      { status: 400 }
    );
  }
}
