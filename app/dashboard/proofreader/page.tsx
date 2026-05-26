import Link from "next/link";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getDashboardData } from "@/lib/dashboardData";
import { getCurrentUserContext } from "@/lib/serverAuth";
import type { EnrichedTitle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProofreaderDashboard() {
  const [data, userContext] = await Promise.all([getDashboardData(), getCurrentUserContext()]);
  const role = userContext.user?.role ?? "Viewer";
  const name = userContext.user?.name ?? "";
  const titles = data.titles.filter((title) => {
    if (role === "Admin") return title.proofreader;
    if (role === "Supervisor") return title.supervisor.toLowerCase().includes(name.toLowerCase());
    if (role === "Proofreader") return String(title.proofreader ?? "").toLowerCase().includes(name.toLowerCase());
    return false;
  });
  const activeTitles = titles.filter((title) => !["Completed", "Cancelled"].includes(title.status));
  const sections = [
    { title: "Scripts Waiting For Proofreading", titles: activeTitles.filter((title) => ["Not Started", "Not Assigned"].includes(title.proofreadingStatus) || title.status === "Proofreading Pending") },
    { title: "Scripts In Review", titles: activeTitles.filter((title) => title.proofreadingStatus === "In Review") },
    { title: "Scripts Blocked By Me", titles: activeTitles.filter((title) => title.proofreadingStatus === "Blocked By Proofreader" || title.proofreadingBlocked) },
    { title: "Scripts Waiting For Supervisor Fix", titles: activeTitles.filter((title) => title.proofreadingBlocked || title.proofreadingStatus === "Changes Requested") },
    { title: "Scripts Fixed And Ready For Recheck", titles: activeTitles.filter((title) => ["Fixed By Supervisor", "Ready For Recheck"].includes(title.proofreadingStatus)) },
    { title: "Scripts Approved By Me", titles: titles.filter((title) => title.proofreadingStatus === "Approved By Proofreader") }
  ];

  if (!["Admin", "Supervisor", "Proofreader"].includes(String(role))) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-moss">Proofreader Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Proofreading Queue</h1>
        <p className="mt-3 text-sm text-black/60">This dashboard is available to Admin, Supervisor, and Proofreader roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Proofreader Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Proofreading Queue</h1>
        <p className="mt-2 text-sm text-black/60">
          {role === "Proofreader" ? `Showing titles assigned to ${name}.` : role === "Supervisor" ? `Showing proofreading work for ${name}'s titles.` : "Admin view across all proofreading work."}
        </p>
      </div>
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-2xl font-semibold text-ink">{section.titles.length}</div>
            <div className="mt-1 text-sm text-black/60">{section.title}</div>
          </div>
        ))}
      </section>
      {sections.map((section) => (
        <ProofreadingSection key={section.title} title={section.title} titles={section.titles} />
      ))}
    </div>
  );
}

function ProofreadingSection({ title, titles }: { title: string; titles: EnrichedTitle[] }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 p-4">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] divide-y divide-black/10 text-left text-sm">
          <thead className="bg-[#eef1eb] text-xs uppercase text-black/55">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Supervisor</th>
              <th className="px-4 py-3">Writer</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Proofreading Status</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {titles.map((title) => (
              <tr key={title.id} className="align-top hover:bg-[#faf9f5]">
                <td className="max-w-sm px-4 py-3 font-semibold text-ink">{title.title}</td>
                <td className="px-4 py-3 text-black/65">{title.channel}</td>
                <td className="px-4 py-3 text-black/65">{title.supervisor}</td>
                <td className="px-4 py-3 text-black/65">{title.writer}</td>
                <td className="px-4 py-3"><PriorityBadge priority={title.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={title.status} /></td>
                <td className="px-4 py-3">
                  <span className={title.proofreadingBlocked ? "rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-danger" : "rounded-md border border-black/10 bg-[#f6f4ee] px-2 py-1 text-xs font-semibold text-moss"}>
                    {title.proofreadingStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-black/65">{title.writerDueDate || "Not set"}</td>
                <td className="px-4 py-3 text-black/65">{title.lastUpdatedAt ? new Date(title.lastUpdatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}</td>
                <td className="px-4 py-3"><Link href={`/titles/${title.id}`} className="font-semibold text-moss hover:underline">Open Title</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {titles.length === 0 ? <div className="px-4 py-8 text-center text-sm text-black/50">Nothing in this queue.</div> : null}
    </section>
  );
}
