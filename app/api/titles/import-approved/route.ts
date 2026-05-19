import { NextResponse, type NextRequest } from "next/server";
import {
  createApprovedImportedTitles,
  parseApprovedTitlePaste,
  previewApprovedTitleImport,
  type ApprovedImportRow
} from "@/lib/approvedTitleImport";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userContext = await getCurrentUserContext();
  const role = String(userContext.user?.role ?? "");
  if (!["Admin", "Supervisor"].includes(role)) {
    return NextResponse.json({ error: "Only Admin and Supervisors can import approved production titles." }, { status: 403 });
  }

  const payload = await request.json();

  try {
    if (payload.previewOnly) {
      const rows = Array.isArray(payload.rows)
        ? (payload.rows as ApprovedImportRow[])
        : parseApprovedTitlePaste(String(payload.text ?? ""));
      const preview = await previewApprovedTitleImport(rows);
      return NextResponse.json({ preview });
    }

    const rows = (payload.rows ?? []) as ApprovedImportRow[];
    const titles = await createApprovedImportedTitles({
      rows,
      user: userContext.user,
      allowDuplicates: Boolean(payload.allowDuplicates)
    });
    return NextResponse.json({ titles, createdCount: titles.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import approved titles." },
      { status: 400 }
    );
  }
}
