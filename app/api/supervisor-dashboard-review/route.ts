import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserContext } from "@/lib/serverAuth";
import { markSupervisorDashboardReviewed } from "@/lib/supervisorAttention";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userContext = await getCurrentUserContext();
  const payload = await request.json();
  const supervisorName = String(payload.supervisorName ?? "").trim();

  if (!supervisorName) {
    return NextResponse.json({ error: "Supervisor name is required." }, { status: 400 });
  }

  const role = String(userContext.user?.role ?? "");
  const canReview =
    role === "Admin" ||
    (role === "Supervisor" && userContext.user?.name && supervisorName.toLowerCase().includes(userContext.user.name.toLowerCase()));

  if (!canReview) {
    return NextResponse.json({ error: "You do not have permission to mark this dashboard reviewed." }, { status: 403 });
  }

  try {
    const review = await markSupervisorDashboardReviewed(supervisorName, userContext.user);
    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to mark dashboard reviewed." },
      { status: 400 }
    );
  }
}
