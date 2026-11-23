import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/apiAuth";
import { getUsers, saveUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load users." }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(["Admin"]);
  if (!auth.ok) return auth.response;
  try {
    const user = await saveUser(await request.json());
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save user." }, { status: 400 });
  }
}
