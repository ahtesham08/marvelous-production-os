import { NextResponse, type NextRequest } from "next/server";
import {
  addProofreadingMessage,
  blockScript,
  getProofreadingBundle,
  recheckProofreading,
  submitSupervisorFix
} from "@/lib/proofreading";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ titleId: string }> }) {
  const { titleId } = await context.params;
  try {
    const bundle = await getProofreadingBundle(titleId);
    return NextResponse.json(bundle);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load proofreading." }, { status: 400 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ titleId: string }> }) {
  const { titleId } = await context.params;
  const userContext = await getCurrentUserContext();

  try {
    const form = await request.formData();
    const action = String(form.get("action") ?? "message");
    const attachmentValue = form.get("attachment");
    const attachment = attachmentValue instanceof File && attachmentValue.size > 0 ? attachmentValue : null;

    if (action === "message") {
      const message = await addProofreadingMessage({
        titleId,
        user: userContext.user,
        messageText: String(form.get("messageText") ?? ""),
        attachment
      });
      return NextResponse.json({ message });
    }

    if (action === "block") {
      const review = await blockScript({
        titleId,
        user: userContext.user,
        blockCategory: String(form.get("blockCategory") ?? ""),
        blockReason: String(form.get("blockReason") ?? ""),
        detailedFeedback: String(form.get("detailedFeedback") ?? ""),
        whatNeedsFixing: String(form.get("whatNeedsFixing") ?? ""),
        scriptQualityRating: clean(form.get("scriptQualityRating")),
        attachment
      });
      return NextResponse.json({ review });
    }

    if (action === "fix") {
      const review = await submitSupervisorFix({
        titleId,
        user: userContext.user,
        response: String(form.get("response") ?? ""),
        correctedBySupervisor: form.get("correctedBySupervisor") === "true",
        sentBackForRewrite: form.get("sentBackForRewrite") === "true",
        changesMade: String(form.get("changesMade") ?? ""),
        readyForRecheck: form.get("readyForRecheck") === "true"
      });
      return NextResponse.json({ review });
    }

    if (action === "approve" || action === "request_changes") {
      const review = await recheckProofreading({
        titleId,
        user: userContext.user,
        action,
        message: String(form.get("messageText") ?? "")
      });
      return NextResponse.json({ review });
    }

    return NextResponse.json({ error: "Unknown proofreading action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save proofreading update." }, { status: 400 });
  }
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}
