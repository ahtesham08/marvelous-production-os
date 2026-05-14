import Link from "next/link";
import { BrainstormingStatusBadge } from "@/components/brainstorming/BrainstormingStatusBadge";
import type { BrainstormingTitle } from "@/lib/types";

export function BrainstormingTitleList({ titles }: { titles: BrainstormingTitle[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-black/10 text-left text-sm">
          <thead className="bg-[#eef1eb] text-xs uppercase text-black/55">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Supervisor</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {titles.map((title) => (
              <tr key={title.id}>
                <td className="max-w-lg px-4 py-3">
                  <div className="font-medium text-ink">{title.title}</div>
                  {title.session_id ? <Link href={`/brainstorming/live/${title.session_id}`} className="text-xs font-semibold text-moss hover:underline">Open session</Link> : null}
                  {title.duplicate_warning ? <div className="mt-1 text-xs font-semibold text-amberline">{title.duplicate_warning}</div> : null}
                </td>
                <td className="px-4 py-3 text-black/70">{title.supervisor || title.submitted_by_name || "Unassigned"}</td>
                <td className="px-4 py-3 text-black/70">{title.channel || "MV N"}</td>
                <td className="px-4 py-3 text-black/70">{title.priority || "Normal"}</td>
                <td className="px-4 py-3"><BrainstormingStatusBadge status={title.status} /></td>
                <td className="max-w-xs px-4 py-3 text-black/60">{title.decision_reason || title.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {titles.length === 0 ? <div className="px-4 py-10 text-center text-sm text-black/55">Nothing here yet.</div> : null}
    </section>
  );
}
