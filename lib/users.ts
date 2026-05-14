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
  { name: "Deepak", role: "Operations Supervisor" }
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
  const supabase = createSupabaseAdminClient();
  for (const user of seedUsers) {
    const { data } = await supabase.from("users").select("id").eq("name", user.name).maybeSingle();
    if (!data) {
      await supabase.from("users").insert({
        name: user.name,
        email: null,
        role: user.role,
        active: true
      });
    }
  }
}

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}
