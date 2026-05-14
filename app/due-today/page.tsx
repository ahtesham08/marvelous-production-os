import { QueueTable } from "@/components/mvp3/QueueTable";
import { getDashboardData } from "@/lib/dashboardData";
import { isDueToday } from "@/lib/mvp3Views";

export const dynamic = "force-dynamic";

export default async function DueTodayPage() {
  const data = await getDashboardData();
  return (
    <div className="space-y-5">
      <div><p className="text-sm font-semibold uppercase text-moss">Due Dates</p><h1 className="mt-1 text-3xl font-semibold text-ink">Due Today</h1></div>
      <QueueTable titles={data.titles.filter(isDueToday)} />
    </div>
  );
}
