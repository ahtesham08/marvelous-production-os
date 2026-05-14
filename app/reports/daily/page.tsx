import { DailyReportBox } from "@/components/DailyReportBox";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function DailyReportPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Daily Report</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">WhatsApp Copy Report</h1>
        <p className="mt-2 text-sm text-black/60">
          Copy this into WhatsApp manually. Automation is intentionally not enabled.
        </p>
      </div>
      <DailyReportBox report={data.dailyReport} />
    </div>
  );
}
