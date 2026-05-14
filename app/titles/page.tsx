import { TitleTable } from "@/components/TitleTable";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function TitlesPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">All Titles</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Main Title Table</h1>
        <p className="mt-2 text-sm text-black/60">
          Filter by supervisor, channel, title, status, age, and missing fields.
        </p>
      </div>
      <TitleTable titles={data.titles} />
    </div>
  );
}
