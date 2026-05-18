import { TitleTable } from "@/components/TitleTable";
import { getDashboardData } from "@/lib/dashboardData";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function TitlesPage() {
  const [data, userContext] = await Promise.all([getDashboardData(), getCurrentUserContext()]);
  const canDelete = userContext.user?.role === "Admin" || userContext.user?.role === "Supervisor";
  const canFocus = ["Admin", "Supervisor", "Operations Supervisor"].includes(String(userContext.user?.role));
  const canEditInline = ["Admin", "Supervisor", "Operations Supervisor"].includes(String(userContext.user?.role));

  return (
    <div className="space-y-4">
      <div data-focus-chrome>
        <p className="text-sm font-semibold uppercase text-moss">All Titles</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Main Title Table</h1>
        <p className="mt-2 text-sm text-black/60">
          Filter by supervisor, channel, title, status, age, and missing fields.
        </p>
      </div>
      <TitleTable titles={data.titles} canDelete={canDelete} canFocus={canFocus} canEditInline={canEditInline} />
    </div>
  );
}
