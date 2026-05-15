import { NextResponse, type NextRequest } from "next/server";
import {
  addBrainstormingNote,
  convertBrainstormingTitle,
  decideBrainstormingTitle,
  getBrainstormingTitle,
  updateBrainstormingProposal,
  updateBrainstormingTitleNotes
} from "@/lib/brainstorming";
import { getCurrentUserContext, isAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const userContext = await getCurrentUserContext();
  const payload = await request.json();

  try {
    if (payload.action === "decision") {
      if (!isAdmin(userContext.user?.role)) return NextResponse.json({ error: "Only Admin can decide titles." }, { status: 403 });
      await decideBrainstormingTitle(id, payload.decision, payload.reason, userContext.user, {
        urgency: payload.urgency,
        dueDate: payload.dueDate
      });
      return NextResponse.json({ ok: true, title: await getBrainstormingTitle(id) });
    }

    if (payload.action === "note") {
      if (!["Admin", "Supervisor"].includes(String(userContext.user?.role))) {
        return NextResponse.json({ error: "Only Admin and Supervisors can add notes." }, { status: 403 });
      }
      await addBrainstormingNote(id, payload.noteText, userContext.user);
      return NextResponse.json({ ok: true, title: await getBrainstormingTitle(id) });
    }

    if (payload.action === "meeting-notes") {
      if (!isAdmin(userContext.user?.role)) return NextResponse.json({ error: "Only Admin can edit meeting notes." }, { status: 403 });
      await updateBrainstormingTitleNotes(id, payload.ahteshamNotes, payload.discussionSummary);
      return NextResponse.json({ ok: true, title: await getBrainstormingTitle(id) });
    }

    if (payload.action === "proposal") {
      if (!["Admin", "Supervisor"].includes(String(userContext.user?.role))) {
        return NextResponse.json({ error: "Only Admin and Supervisors can edit proposed ideas." }, { status: 403 });
      }
      await updateBrainstormingProposal(id, payload);
      return NextResponse.json({ ok: true, title: await getBrainstormingTitle(id) });
    }

    if (payload.action === "convert") {
      if (!isAdmin(userContext.user?.role)) return NextResponse.json({ error: "Only Admin can convert titles." }, { status: 403 });
      const title = await convertBrainstormingTitle(id, userContext.user);
      return NextResponse.json({ title, brainstormingTitle: await getBrainstormingTitle(id) });
    }

    return NextResponse.json({ error: "Unknown brainstorming action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update brainstorming title." }, { status: 400 });
  }
}
