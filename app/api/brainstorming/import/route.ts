import { NextResponse, type NextRequest } from "next/server";
import {
  attachBrainstormingTitlesToSession,
  createBrainstormingTitles,
  getBrainstormingTitles,
  previewWhatsAppImport
} from "@/lib/brainstorming";
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
    if (titles.length === 0) {
      return NextResponse.json({ error: "Preview at least one title before importing." }, { status: 400 });
    }
    if (titles.some((title) => !title.sessionId)) {
      return NextResponse.json({ error: "Choose a brainstorming session before importing titles." }, { status: 400 });
    }
    const sessionIds = Array.from(new Set(titles.map((title) => title.sessionId).filter(Boolean)));
    if (sessionIds.length !== 1) {
      return NextResponse.json({ error: "Imported rows must all target the same brainstorming session." }, { status: 400 });
    }
    const created = await createBrainstormingTitles(titles, context.user);
    const sessionId = sessionIds[0] as string;
    const createdIds = created.map((title) => title.id);
    const attached =
      sessionId && createdIds.length > 0
        ? await attachBrainstormingTitlesToSession(sessionId, createdIds)
        : created;
    const sessionTitles = await getBrainstormingTitles({ sessionId, includeResurfaced: true });
    const visibleCreatedCount = sessionTitles.filter((title) => createdIds.includes(title.id)).length;
    if (createdIds.length > 0 && visibleCreatedCount !== createdIds.length) {
      return NextResponse.json(
        {
          error: `Import created ${createdIds.length} title(s), but only ${visibleCreatedCount} appeared in the selected Live Review session. Please retry once; if it repeats, send this exact message to Codex.`,
          createdCount: createdIds.length,
          visibleCreatedCount,
          sessionId
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ created: attached, createdCount: attached.length, visibleCreatedCount, sessionId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "WhatsApp import failed." }, { status: 400 });
  }
}
