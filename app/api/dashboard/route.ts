import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/apiAuth";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const data = await getDashboardData();
  return NextResponse.json(data);
}
