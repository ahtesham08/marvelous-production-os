import { NextResponse, type NextRequest } from "next/server";
import { exportCsv } from "@/lib/csvExport";
import { getDashboardData } from "@/lib/dashboardData";
import { getUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  const data = await getDashboardData({ includeActivityLog: kind === "activity" });
  const users = await getUsers();
  const csv = exportCsv(kind, data.titles, users);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${kind}.csv"`
    }
  });
}
