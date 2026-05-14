import { getAppMode, getAppUrl } from "@/lib/appMode";
import { hasGoogleSheetsConfig } from "@/lib/googleSheets";
import { hasSupabaseAdminConfig, hasSupabasePublicConfig } from "@/lib/supabaseServer";
import { getUsers } from "@/lib/users";

export async function getLaunchChecklist() {
  const users = await getUsers().catch(() => []);
  const appMode = getAppMode();
  const appUrl = getAppUrl();

  return [
    {
      label: "Supabase connected",
      ok: hasSupabasePublicConfig() && hasSupabaseAdminConfig(),
      detail: hasSupabaseAdminConfig() ? "Public and service-role credentials present." : "Missing Supabase env vars."
    },
    {
      label: "Auth configured",
      ok: hasSupabasePublicConfig(),
      detail: hasSupabasePublicConfig() ? "Supabase Auth can initialize." : "Missing Supabase public URL or anon key."
    },
    {
      label: "Users seeded",
      ok: ["Ahtesham", "Kamran", "Farhan", "Raktim", "Deepak"].every((name) =>
        users.some((user) => user.name.toLowerCase() === name.toLowerCase())
      ),
      detail: `${users.length} users visible.`
    },
    {
      label: "Demo mode disabled",
      ok: appMode !== "demo",
      detail: `Current mode: ${appMode}.`
    },
    {
      label: "Google Sheets write-back disabled",
      ok: process.env.GOOGLE_SHEETS_WRITEBACK_MODE !== "enabled",
      detail: `GOOGLE_SHEETS_WRITEBACK_MODE=${process.env.GOOGLE_SHEETS_WRITEBACK_MODE || "disabled"}`
    },
    {
      label: "Production URL configured",
      ok: Boolean(process.env.NEXT_PUBLIC_APP_URL && !appUrl.includes("localhost")),
      detail: appUrl
    },
    {
      label: "Archive import credentials optional",
      ok: true,
      detail: hasGoogleSheetsConfig() ? "Google archive import credentials present." : "No Google archive import credentials. Fine for fresh start."
    }
  ];
}
