import { NextResponse, type NextRequest } from "next/server";
import { createBrainstormingTitles, previewWhatsAppImport } from "@/lib/brainstorming";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const context = await getCurrentUserContext();
  const role = context.user?.role;
  if (!["Admin", "Supervisor"].includes(String(role))) {
    return NextResponse.json({ error: "Only Admin and Supervisors can import title ideas." }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as { text?: string; sessionId?: string | null; titles?: unknown[]; previewOnly?: boolean };
    if (payload.previewOnly) {
      const preview = await previewWhatsAppImport(payload.text ?? "", payload.sessionId);
      return NextResponse.json({ preview });
    }
    const titles = (payload.titles ?? []) as Parameters<typeof createBrainstormingTitles>[0];
    const created = await createBrainstormingTitles(titles, context.user);
    return NextResponse.json({ created });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "WhatsApp import failed." }, { status: 400 });
  }
}
