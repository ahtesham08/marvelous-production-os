"use client";

import { useMemo, useState } from "react";
import { USER_ROLES } from "@/lib/roles";
import type { UserRecord } from "@/lib/types";

export function TeamDirectory({ users }: { users: UserRecord[] }) {
  const [role, setRole] = useState("All");
  const [active, setActive] = useState("Active");
  const filtered = useMemo(
    () =>
      users.filter((user) => {
        if (role !== "All" && user.role !== role) return false;
        if (active === "Active" && !user.active) return false;
        if (active === "Inactive" && user.active) return false;
        return true;
      }),
    [active, role, users]
  );
  const grouped = USER_ROLES.map((roleName) => ({
    role: roleName,
    users: filtered.filter((user) => user.role === roleName)
  })).filter((group) => group.users.length > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-sm sm:grid-cols-2">
        <select className="field-input" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="All">All roles</option>
          {USER_ROLES.map((roleName) => (
            <option key={roleName} value={roleName}>{roleName}</option>
          ))}
        </select>
        <select className="field-input" value={active} onChange={(event) => setActive(event.target.value)}>
          <option value="Active">Active only</option>
          <option value="Inactive">Inactive only</option>
          <option value="All">All statuses</option>
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {grouped.map((group) => (
          <section key={group.role} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">{roleLabel(group.role)}</h2>
            <ul className="mt-3 space-y-2">
              {group.users.map((user) => (
                <li key={user.id} className="rounded-md bg-[#f6f4ee] p-3 text-sm">
                  <div className="font-semibold text-ink">{user.name}</div>
                  <div className="text-black/55">{user.email || "No email"} | {user.active ? "Active" : "Inactive"}</div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function roleLabel(role: string) {
  if (role === "Supervisor") return "Supervisors";
  if (role === "Operations Supervisor") return "Operations";
  if (role === "VO Manager") return "VO Artists";
  return `${role}s`;
}
