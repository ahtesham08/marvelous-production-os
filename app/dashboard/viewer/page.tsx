import { TitleTable } from "@/components/TitleTable";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function ViewerDashboard() {
  const data = await getDashboardData();
  return (
    <div className="space-y-5">
      <div><p className="text-sm font-semibold uppercase text-moss">Viewer Dashboard</p><h1 className="mt-1 text-3xl font-semibold text-ink">Production Overview</h1></div>
      <TitleTable titles={data.titles} />
    </div>
  );
}
