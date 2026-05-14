import { CommandCenterClient } from "@/components/mvp3/CommandCenterClient";
import { getBrainstormingSummary } from "@/lib/brainstorming";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function CommandCenterPage() {
  const [data, brainstormingSummary] = await Promise.all([getDashboardData(), getBrainstormingSummary()]);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Ahtesham Morning Screen</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Daily Command Center</h1>
      </div>
      <CommandCenterClient titles={data.titles} supervisorSummary={data.supervisorSummary} brainstormingSummary={brainstormingSummary} />
    </div>
  );
}
