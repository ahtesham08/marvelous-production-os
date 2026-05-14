import { NextResponse, type NextRequest } from "next/server";
import { getUsers, saveUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load users." }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await saveUser(await request.json());
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save user." }, { status: 400 });
  }
}
