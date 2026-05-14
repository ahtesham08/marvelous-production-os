import { QueueTable } from "@/components/mvp3/QueueTable";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function VoDashboard() {
  const data = await getDashboardData();
  const titles = data.titles.filter((title) => title.voArtist && title.status !== "Completed");
  return (
    <div className="space-y-5">
      <div><p className="text-sm font-semibold uppercase text-moss">VO Manager Dashboard</p><h1 className="mt-1 text-3xl font-semibold text-ink">VO Queue</h1></div>
      <QueueTable titles={titles} />
    </div>
  );
}
