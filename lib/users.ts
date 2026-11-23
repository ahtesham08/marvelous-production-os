import { getLocalUsers, upsertLocalUser } from "@/lib/localStore";
import { isProductionMode } from "@/lib/appMode";
import { USER_ROLES } from "@/lib/roles";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import type { UserRecord } from "@/lib/types";

export { USER_ROLES };

const seedUsers = [
  { name: "Ahtesham", role: "Admin" },
  { name: "Kamran", role: "Supervisor" },
  { name: "Farhan", role: "Supervisor" },
  { name: "Raktim", role: "Supervisor" },
  { name: "Deepak", role: "Operations Supervisor" },
  { name: "Rubai", role: "Proofreader" },
  { name: "Ashmita", role: "Proofreader" },
  { name: "Mehek", role: "Proofreader" },
  { name: "Mansi", role: "Proofreader" }
];

export async function getUsers() {
  if (!hasSupabaseAdminConfig()) {
    if (isProductionMode()) throw new Error("Production mode requires Supabase user storage.");
    return getLocalUsers();
  }

  const supabase = createSupabaseAdminClient();
  await seedSupabaseUsers();
  const { data, error } = await supabase.from("users").select("*").order("role").order("name");
  if (error) throw error;
  return (data ?? []) as UserRecord[];
}

export async function saveUser(input: Partial<UserRecord> & { name: string; role: string }) {
  if (!hasSupabaseAdminConfig()) {
    if (isProductionMode()) throw new Error("Production mode requires Supabase user storage.");
    return upsertLocalUser(input);
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const payload = {
    name: input.name,
    email: clean(input.email),
    role: input.role,
    active: input.active ?? true,
    default_channel: clean(input.default_channel),
    default_supervisor: clean(input.default_supervisor),
    updated_at: now
  };

  const query = input.id
    ? supabase.from("users").update(payload).eq("id", input.id).select("*").single()
    : supabase.from("users").insert({ ...payload, created_at: now }).select("*").single();
  const { data, error } = await query;
  if (error) throw error;
  return data as UserRecord;
}

async function seedSupabaseUsers() {
  // One lookup for all seed names instead of one query per person on every page load.
  // (maybeSingle() also errored when a name existed twice, which could insert duplicates.)
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("name")
    .in(
      "name",
      seedUsers.map((user) => user.name)
    );
  if (error) return;
  const existing = new Set((data ?? []).map((row) => String(row.name)));
  const missing = seedUsers.filter((user) => !existing.has(user.name));
  if (missing.length === 0) return;
  await supabase.from("users").insert(missing.map((user) => ({ name: user.name, email: null, role: user.role, active: true })));
}

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}
