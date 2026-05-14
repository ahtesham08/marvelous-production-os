import { QueueTable } from "@/components/mvp3/QueueTable";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function BlockedPage() {
  const data = await getDashboardData();
  const titles = data.titles.filter((title) => title.blocked);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-danger">Blocked Workflow</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Blocked Titles</h1>
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        {titles.map((title) => (
          <article key={title.id} className="rounded-lg border border-danger/20 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-ink">{title.title}</h2>
            <p className="mt-2 text-sm text-black/60">Owner: {title.blockedBy || title.supervisor}</p>
            <p className="text-sm text-black/60">Category: {title.blockedCategory || "Other"}</p>
            <p className="mt-2 text-sm font-medium text-danger">{title.blockedReason || "No reason recorded."}</p>
          </article>
        ))}
      </section>
      <QueueTable titles={titles} />
    </div>
  );
}
