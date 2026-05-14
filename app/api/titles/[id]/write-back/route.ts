import { NextResponse, type NextRequest } from "next/server";
import { getTitleRecord, writeTitleBackToSheets } from "@/lib/titleUpdates";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (process.env.GOOGLE_SHEETS_WRITEBACK_MODE !== "enabled") {
    return NextResponse.json(
      { error: "Google Sheets write-back is disabled. Old sheets are archive/reference only." },
      { status: 403 }
    );
  }

  const { id } = await context.params;

  try {
    const title = await getTitleRecord(id);
    const result = await writeTitleBackToSheets(title);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to write back to Google Sheets." },
      { status: 400 }
    );
  }
}
