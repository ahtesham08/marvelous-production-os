import { NextResponse } from "next/server";
import { hasGoogleSheetsConfig } from "@/lib/googleSheets";
import { hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import { syncGoogleSheets } from "@/lib/sync/syncSheets";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({ error: "Supabase environment variables are missing." }, { status: 400 });
  }

  if (!hasGoogleSheetsConfig()) {
    return NextResponse.json({ error: "Google service account environment variables are missing." }, { status: 400 });
  }

  try {
    const result = await syncGoogleSheets();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Archive import failed." },
      { status: 500 }
    );
  }
}
