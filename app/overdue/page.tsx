import { getDashboardData } from "@/lib/dashboardData";
import { daysOverdue, isOverdue } from "@/lib/mvp3Views";

export const dynamic = "force-dynamic";

export default async function OverduePage() {
  const data = await getDashboardData();
  const titles = data.titles.filter(isOverdue);
  return (
    <div className="space-y-5">
      <div><p className="text-sm font-semibold uppercase text-danger">Due Dates</p><h1 className="mt-1 text-3xl font-semibold text-ink">Overdue Titles</h1></div>
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10 text-left text-sm">
            <thead className="bg-[#eef1eb] text-xs uppercase text-black/55">
              <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Writer</th><th className="px-4 py-3">Due Date</th><th className="px-4 py-3">Days Overdue</th><th className="px-4 py-3">Last Update</th><th className="px-4 py-3">Next Action</th></tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {titles.map((title) => (
                <tr key={title.id}>
                  <td className="px-4 py-3 font-medium text-ink">{title.title}</td>
                  <td className="px-4 py-3">{title.supervisor}</td>
                  <td className="px-4 py-3">{title.writer}</td>
                  <td className="px-4 py-3">{title.writerDueDate}</td>
                  <td className="px-4 py-3">{daysOverdue(title)}</td>
                  <td className="px-4 py-3">{title.lastUpdatedAt ? new Date(title.lastUpdatedAt).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3 font-medium text-moss">{title.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
