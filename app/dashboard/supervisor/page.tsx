import { SectionList } from "@/components/mvp3/SectionList";
import { SupervisorAttentionDashboard } from "@/components/SupervisorAttentionDashboard";
import { getBrainstormingTitles } from "@/lib/brainstorming";
import { getDashboardData } from "@/lib/dashboardData";
import { supervisorQueue } from "@/lib/mvp3Views";
import { getCurrentUserContext } from "@/lib/serverAuth";
import { buildSupervisorAttentionDashboard, getSupervisorDashboardReview } from "@/lib/supervisorAttention";

export const dynamic = "force-dynamic";

const supervisors = ["Kamran", "Farhan", "Raktim"];

export default async function SupervisorDashboard({
  searchParams
}: {
  searchParams: Promise<{ supervisor?: string }>;
}) {
  const [data, userContext, brainstormingTitles] = await Promise.all([
    getDashboardData(),
    getCurrentUserContext(),
    getBrainstormingTitles({ includeResurfaced: true })
  ]);
  const { supervisor: querySupervisor } = await searchParams;
  const role = String(userContext.user?.role ?? "");
  const supervisorName = role === "Supervisor" ? userContext.user?.name ?? "" : querySupervisor || "Kamran";
  const allowed = role === "Admin" || role === "Supervisor";

  if (!allowed || !supervisorName) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-moss">Supervisor Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Supervisor Attention Command Center</h1>
        <p className="mt-3 text-sm text-black/60">This dashboard is available to Admin and Supervisor roles.</p>
      </div>
    );
  }

  const review = await getSupervisorDashboardReview(supervisorName);
  const attention = await buildSupervisorAttentionDashboard({ titles: data.titles, brainstormingTitles, supervisorName, review });
  const queue = supervisorQueue(data.titles, supervisorName);
  const canMarkReviewed = role === "Admin" || (role === "Supervisor" && supervisorName.toLowerCase().includes(String(userContext.user?.name).toLowerCase()));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Supervisor Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">{supervisorName} Daily Work Queue</h1>
        {role === "Admin" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {supervisors.map((name) => (
              <a
                key={name}
                href={`/dashboard/supervisor?supervisor=${encodeURIComponent(name)}`}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${name === supervisorName ? "border-moss bg-[#eef1eb] text-moss" : "border-black/10 bg-white text-ink"}`}
              >
                {name}
              </a>
            ))}
          </div>
        ) : null}
      </div>
      <SupervisorAttentionDashboard attention={attention} canMarkReviewed={canMarkReviewed} />
      <SectionList sections={[
        { title: "Titles Assigned To Me", titles: queue.assigned },
        { title: "Titles Missing Writer", titles: queue.missingWriter },
        { title: "Titles Missing Help Doc", titles: queue.missingHelpDoc },
        { title: "Due Date Today", titles: queue.dueToday },
        { title: "Overdue", titles: queue.overdue },
        { title: "Blocked", titles: queue.blocked },
        { title: "Script Submitted", titles: queue.scriptSubmitted },
        { title: "Needs Next Action", titles: queue.nextAction }
      ]} />
    </div>
  );
}
