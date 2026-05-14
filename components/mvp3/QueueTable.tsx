import Link from "next/link";
import { MissingFieldsBadge } from "@/components/MissingFieldsBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import type { EnrichedTitle } from "@/lib/types";

export function QueueTable({ titles, showOwner = true }: { titles: EnrichedTitle[]; showOwner?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-black/10 text-left text-sm">
          <thead className="bg-[#eef1eb] text-xs uppercase text-black/55">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Channel</th>
              {showOwner ? <th className="px-4 py-3">Owner</th> : null}
              <th className="px-4 py-3">Writer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Missing</th>
              <th className="px-4 py-3">Next Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {titles.map((title) => (
              <tr key={title.id} className="align-top">
                <td className="max-w-sm px-4 py-3 font-medium text-ink">
                  <Link href={`/titles/${title.id}`} className="hover:text-moss hover:underline">{title.title}</Link>
                </td>
                <td className="px-4 py-3">{title.channel}</td>
                {showOwner ? <td className="px-4 py-3">{title.supervisor}</td> : null}
                <td className="px-4 py-3">{title.writer}</td>
                <td className="px-4 py-3"><StatusBadge status={title.status} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={title.priority} /></td>
                <td className="px-4 py-3">{title.ageDays}d</td>
                <td className="px-4 py-3">{title.writerDueDate || "-"}</td>
                <td className="px-4 py-3"><MissingFieldsBadge fields={title.missingFields} /></td>
                <td className="px-4 py-3 font-medium text-moss">{title.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {titles.length === 0 ? <div className="px-4 py-8 text-center text-sm text-black/50">Nothing in this queue.</div> : null}
    </div>
  );
}
