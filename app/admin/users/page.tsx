import { UserManager } from "@/components/mvp3/UserManager";
import { getUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getUsers();
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Admin</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">User Management</h1>
        <p className="mt-2 text-sm text-black/60">Create team members, assign roles, and keep inactive users out of daily workflow.</p>
      </div>
      <UserManager initialUsers={users} />
    </div>
  );
}
