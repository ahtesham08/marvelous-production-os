import { SupervisorAttentionDashboard } from "@/components/SupervisorAttentionDashboard";
import { TitleTable } from "@/components/TitleTable";
import { getBrainstormingTitles } from "@/lib/brainstorming";
import { getDashboardData } from "@/lib/dashboardData";
import { getCurrentUserContext } from "@/lib/serverAuth";
import { buildSupervisorAttentionDashboard, getSupervisorDashboardReview } from "@/lib/supervisorAttention";

export const dynamic = "force-dynamic";

export default async function SupervisorPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  const [data, userContext, brainstormingTitles] = await Promise.all([
    getDashboardData(),
    getCurrentUserContext(),
    getBrainstormingTitles({ includeResurfaced: true })
  ]);
  const titles = data.titles.filter((title) => title.supervisor.toLowerCase().includes(name.toLowerCase()));
  const review = await getSupervisorDashboardReview(name);
  const attention = await buildSupervisorAttentionDashboard({ titles: data.titles, brainstormingTitles, supervisorName: name, review });
  const role = String(userContext.user?.role ?? "");
  const canMarkReviewed =
    role === "Admin" ||
    (role === "Supervisor" && userContext.user?.name && name.toLowerCase().includes(userContext.user.name.toLowerCase()));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Supervisor Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">{name}</h1>
        <p className="mt-2 text-sm text-black/60">Assigned titles, delayed scripts, missing writers, and missing help docs.</p>
      </div>
      <SupervisorAttentionDashboard attention={attention} canMarkReviewed={Boolean(canMarkReviewed)} />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="My Approved Titles" value={titles.length} />
        <Metric label="Missing Help Docs" value={titles.filter((title) => title.missingFields.includes("Help Doc")).length} />
        <Metric label="Without Writers" value={titles.filter((title) => title.missingFields.includes("Writer")).length} />
        <Metric label="Delayed Scripts" value={titles.filter((title) => title.ageDays >= 8).length} />
      </section>
      <TitleTable titles={titles} initialSupervisor={name} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-3xl font-semibold text-ink">{value}</div>
      <div className="mt-2 text-sm font-medium text-black/60">{label}</div>
    </section>
  );
}
