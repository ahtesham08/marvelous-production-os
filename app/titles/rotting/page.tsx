import { TitleTable } from "@/components/TitleTable";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function RottingTitlesPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-danger/25 bg-[#fff0ef] p-5">
        <p className="text-sm font-semibold uppercase text-danger">Titles That Are Rotting</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Approved titles that have not moved</h1>
        <p className="mt-2 text-sm text-black/65">
          Critical, delayed, and not-migrated titles are sorted by age so the next follow-up is obvious.
        </p>
      </div>
      <TitleTable titles={data.titles} rottingOnly />
    </div>
  );
}
