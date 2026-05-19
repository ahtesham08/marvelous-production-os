import { NextResponse, type NextRequest } from "next/server";
import { deleteTitles, getTitleRecord, updateTitle, type TitleUpdatePayload } from "@/lib/titleUpdates";
import { getCurrentUserContext } from "@/lib/serverAuth";

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
  const userContext = await getCurrentUserContext();

  try {
    const result = await updateTitle(id, payload, userContext.user);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update title." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userContext = await getCurrentUserContext();

  try {
    const result = await deleteTitles([id], userContext.user);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete title." },
      { status: 400 }
    );
  }
}
