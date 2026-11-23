"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { BrainstormingStatusBadge } from "@/components/brainstorming/BrainstormingStatusBadge";

export type BankRow = {
  id: string;
  title: string;
  sessionId: string | null;
  duplicateWarning: string | null;
  supervisor: string;
  channel: string;
  priority: string;
  status: string;
  reason: string;
};

const BATCH = 200;

export function BrainstormingTitleListClient({ rows }: { rows: BankRow[] }) {
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(BATCH);
  const deferred = useDeferredValue(search);

  const filtered = useMemo(() => {
    const words = deferred.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return rows;
    return rows.filter((row) => {
      const haystack = `${row.title} ${row.supervisor} ${row.channel} ${row.status} ${row.priority}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [deferred, rows]);

  const shown = filtered.slice(0, visible);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="field-input sm:max-w-md"
          placeholder="Search title, supervisor, channel, status"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setVisible(BATCH);
          }}
        />
        <div className="text-sm text-black/60">
          <span className="font-semibold text-ink">{filtered.length.toLocaleString("en-IN")}</span>
          {filtered.length === rows.length ? " ideas" : ` of ${rows.length.toLocaleString("en-IN")} ideas match`}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
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
              {shown.map((row) => (
                <tr key={row.id}>
                  <td className="max-w-lg px-4 py-3">
                    <div className="font-medium text-ink">{row.title}</div>
                    {row.sessionId ? (
                      <Link href={`/brainstorming/live/${row.sessionId}`} className="text-xs font-semibold text-moss hover:underline">
                        Open session
                      </Link>
                    ) : null}
                    {row.duplicateWarning ? <div className="mt-1 text-xs font-semibold text-amberline">{row.duplicateWarning}</div> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-black/70">{row.supervisor}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-black/70">{row.channel}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-black/70">{row.priority}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <BrainstormingStatusBadge status={row.status} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-black/60">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <div className="px-4 py-10 text-center text-sm text-black/55">Nothing here yet.</div> : null}
        {filtered.length > visible ? (
          <div className="flex items-center justify-center gap-3 border-t border-black/10 px-4 py-4 text-sm text-black/55">
            <span>
              Showing {shown.length.toLocaleString("en-IN")} of {filtered.length.toLocaleString("en-IN")}
            </span>
            <button
              type="button"
              onClick={() => setVisible((count) => count + BATCH * 5)}
              className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 font-semibold text-ink hover:border-moss hover:text-moss"
            >
              Show more
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
