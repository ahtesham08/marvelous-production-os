import { TeamDirectory } from "@/components/mvp3/TeamDirectory";
import { getUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const users = await getUsers();
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Team Rollout</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Team Directory</h1>
      </div>
      <TeamDirectory users={users} />
    </div>
  );
}
