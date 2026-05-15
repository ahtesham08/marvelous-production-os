import { NextResponse, type NextRequest } from "next/server";
import { ensureDailyBrainstormingSession } from "@/lib/brainstorming";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await ensureDailyBrainstormingSession();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Daily brainstorming session creation failed." },
      { status: 500 }
    );
  }
}
