"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiltersBar } from "@/components/FiltersBar";
import { MissingFieldsBadge } from "@/components/MissingFieldsBadge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import type { EnrichedTitle } from "@/lib/types";

type TitleTableProps = {
  titles: EnrichedTitle[];
  initialSupervisor?: string;
  initialChannel?: string;
  rottingOnly?: boolean;
};

export function TitleTable({
  titles,
  initialSupervisor = "All",
  initialChannel = "All",
  rottingOnly = false
}: TitleTableProps) {
  const [search, setSearch] = useState("");
  const [supervisor, setSupervisor] = useState(initialSupervisor);
  const [channel, setChannel] = useState(initialChannel);

  const supervisors = useMemo(
    () =>
      Array.from(
        new Set(["Kamran", "Farhan", "Raktim", "Deepak", ...titles.map((title) => title.supervisor).filter(Boolean)])
      ).sort(),
    [titles]
  );
  const channels = useMemo(() => Array.from(new Set(titles.map((title) => title.channel).filter(Boolean))).sort(), [titles]);

  const filteredTitles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return titles
      .filter((title) => !rottingOnly || title.severity === "Critical" || title.ageDays >= 8 || title.matchStatus === "Not Migrated")
      .filter((title) => supervisor === "All" || title.supervisor === supervisor)
      .filter((title) => channel === "All" || title.channel === channel)
      .filter((title) => {
        if (!query) return true;
        return [
          title.title,
          title.channel,
          title.supervisor,
          title.writer,
          title.status,
          title.matchStatus,
          title.missingFields.join(" ")
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => b.ageDays - a.ageDays);
  }, [channel, rottingOnly, search, supervisor, titles]);

  return (
    <div className="space-y-3">
      <FiltersBar
        channels={channels}
        supervisors={supervisors}
        channel={channel}
        supervisor={supervisor}
        search={search}
        onChannelChange={setChannel}
        onSupervisorChange={setSupervisor}
        onSearchChange={setSearch}
      />

      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10 text-left text-sm">
            <thead className="bg-[#eef1eb] text-xs uppercase text-black/55">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">Writer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Missing</th>
                <th className="px-4 py-3">Action Needed</th>
                <th className="px-4 py-3">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredTitles.map((title) => (
                <tr key={title.id} className="align-top hover:bg-[#faf9f5]">
                  <td className="max-w-sm px-4 py-3 font-medium text-ink">
                    <Link href={`/titles/${title.id}`} className="transition hover:text-moss hover:underline">
                      {title.title}
                    </Link>
                    {title.blocked ? <div className="mt-1 text-xs font-semibold text-danger">Blocked</div> : null}
                  </td>
                  <td className="px-4 py-3 text-black/70">{title.channel}</td>
                  <td className="px-4 py-3 text-black/70">{title.supervisor}</td>
                  <td className="px-4 py-3 text-black/70">{title.writer}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={title.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{title.ageDays}d</div>
                    <div className="text-xs text-black/50">{title.ageBucket}</div>
                  </td>
                  <td className="px-4 py-3">
                    <MissingFieldsBadge fields={title.missingFields} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-black/70">{title.nextAction}</td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={title.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTitles.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-black/55">No titles match this view yet.</div>
        ) : null}
      </div>
    </div>
  );
}
