import { getDashboardData } from "@/lib/dashboardData";
import { flattenActivity } from "@/lib/mvp3Views";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const data = await getDashboardData({ includeActivityLog: true });
  const activity = flattenActivity(data.titles);
  return (
    <div className="space-y-5">
      <div><p className="text-sm font-semibold uppercase text-moss">Accountability</p><h1 className="mt-1 text-3xl font-semibold text-ink">Activity Feed</h1></div>
      <div className="grid gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-sm md:grid-cols-4">
        <input className="field-input" placeholder="User filter" />
        <input className="field-input" placeholder="Channel filter" />
        <input className="field-input" placeholder="Action type" />
        <input className="field-input" placeholder="Date range" />
      </div>
      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <ol className="space-y-3">
          {activity.map((entry) => (
            <li key={entry.id} className="border-l-2 border-moss/30 pl-3">
              <div className="text-sm font-semibold text-ink">{entry.action} - {entry.title}</div>
              <div className="text-xs text-black/50">{entry.channel} | {entry.created_at ? new Date(entry.created_at).toLocaleString() : ""}</div>
              <div className="text-xs text-black/60">{entry.old_value ?? "Blank"} {"->"} {entry.new_value ?? "Blank"}</div>
            </li>
          ))}
        </ol>
        {activity.length === 0 ? <p className="text-sm text-black/50">No activity yet.</p> : null}
      </section>
    </div>
  );
}
