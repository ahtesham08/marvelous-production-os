import { TitleTable } from "@/components/TitleTable";
import { getDashboardData } from "@/lib/dashboardData";
import { getCurrentUserContext } from "@/lib/serverAuth";
import Link from "next/link";

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
        {["Admin", "Supervisor"].includes(String(userContext.user?.role)) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/titles/new" className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss">
              Create Approved Title
            </Link>
            <Link href="/titles/import-approved" className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-moss">
              Import Approved Titles
            </Link>
          </div>
        ) : null}
      </div>
      <TitleTable titles={data.titles} canDelete={canDelete} canFocus={canFocus} canEditInline={canEditInline} />
    </div>
  );
}
