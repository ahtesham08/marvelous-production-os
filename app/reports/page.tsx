import { ReportsHub } from "@/components/mvp3/ReportsHub";
import { getDashboardData } from "@/lib/dashboardData";
import { buildReports } from "@/lib/mvp3Reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getDashboardData();
  const reports = buildReports(data);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Copyable Reports</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Reports</h1>
      </div>
      <ReportsHub reports={reports} />
    </div>
  );
}
