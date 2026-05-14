"use client";

import { useState } from "react";
import { USER_ROLES } from "@/lib/roles";
import type { UserRecord } from "@/lib/types";

export function UserManager({ initialUsers }: { initialUsers: UserRecord[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    role: "Viewer",
    active: true,
    default_channel: "",
    default_supervisor: ""
  });
  const [message, setMessage] = useState<string | null>(null);

  async function saveUser() {
    setMessage(null);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Unable to save user.");
      return;
    }
    setUsers((current) => [...current.filter((user) => user.id !== payload.user.id), payload.user].sort((a, b) => a.name.localeCompare(b.name)));
    setForm({ id: "", name: "", email: "", role: "Viewer", active: true, default_channel: "", default_supervisor: "" });
    setMessage("User saved.");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">{form.id ? "Edit User" : "Create User"}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="field-input" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="field-input" placeholder="Email optional" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <select className="field-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <input className="field-input" placeholder="Default channel optional" value={form.default_channel} onChange={(event) => setForm({ ...form, default_channel: event.target.value })} />
          <input className="field-input" placeholder="Default supervisor optional" value={form.default_supervisor} onChange={(event) => setForm({ ...form, default_supervisor: event.target.value })} />
          <label className="flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm font-medium">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            Active
          </label>
        </div>
        <button type="button" onClick={saveUser} className="focus-ring mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss">
          Save User
        </button>
        {message ? <p className="mt-3 text-sm font-medium text-moss">{message}</p> : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10 text-sm">
            <thead className="bg-[#eef1eb] text-left text-xs uppercase text-black/55">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Default Channel</th>
                <th className="px-4 py-3">Default Supervisor</th>
                <th className="px-4 py-3">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-ink">{user.name}</td>
                  <td className="px-4 py-3 text-black/60">{user.email || "-"}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3">{user.default_channel || "-"}</td>
                  <td className="px-4 py-3">{user.default_supervisor || "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          id: user.id,
                          name: user.name,
                          email: user.email ?? "",
                          role: user.role,
                          active: user.active,
                          default_channel: user.default_channel ?? "",
                          default_supervisor: user.default_supervisor ?? ""
                        })
                      }
                      className="rounded-md border border-black/10 px-2 py-1 text-xs font-semibold text-moss hover:border-moss"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
