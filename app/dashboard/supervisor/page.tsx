import { SectionList } from "@/components/mvp3/SectionList";
import { getDashboardData } from "@/lib/dashboardData";
import { supervisorQueue } from "@/lib/mvp3Views";

export const dynamic = "force-dynamic";

export default async function SupervisorDashboard() {
  const data = await getDashboardData();
  const queue = supervisorQueue(data.titles);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Supervisor Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Daily Work Queue</h1>
      </div>
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
