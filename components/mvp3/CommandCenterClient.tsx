"use client";

import { useMemo, useState } from "react";
import { SectionList } from "@/components/mvp3/SectionList";
import { isCompletedThisWeek, isCompletedToday, isOverdue, operationsSections } from "@/lib/mvp3Views";
import type { EnrichedTitle, SupervisorSummary } from "@/lib/types";

export function CommandCenterClient({
  titles,
  supervisorSummary
}: {
  titles: EnrichedTitle[];
  supervisorSummary: SupervisorSummary[];
}) {
  const [channel, setChannel] = useState("All");
  const [supervisor, setSupervisor] = useState("All");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");
  const [ageBucket, setAgeBucket] = useState("All");

  const filtered = useMemo(
    () =>
      titles.filter((title) => {
        if (channel !== "All" && title.channel !== channel) return false;
        if (supervisor !== "All" && title.supervisor !== supervisor) return false;
        if (priority !== "All" && title.priority !== priority) return false;
        if (status !== "All" && title.status !== status) return false;
        if (ageBucket !== "All" && title.ageBucket !== ageBucket) return false;
        return true;
      }),
    [ageBucket, channel, priority, status, supervisor, titles]
  );
  const ops = operationsSections(filtered);
  const channels = Array.from(new Set(titles.map((title) => title.channel))).sort();
  const supervisors = Array.from(new Set(titles.map((title) => title.supervisor))).sort();
  const priorities = Array.from(new Set(titles.map((title) => title.priority))).sort();
  const statuses = Array.from(new Set(titles.map((title) => title.status))).sort();
  const ageBuckets = Array.from(new Set(titles.map((title) => title.ageBucket))).sort();

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-sm md:grid-cols-5">
        <Filter label="Channel" value={channel} options={channels} onChange={setChannel} />
        <Filter label="Supervisor" value={supervisor} options={supervisors} onChange={setSupervisor} />
        <Filter label="Priority" value={priority} options={priorities} onChange={setPriority} />
        <Filter label="Status" value={status} options={statuses} onChange={setStatus} />
        <Filter label="Age" value={ageBucket} options={ageBuckets} onChange={setAgeBucket} />
      </div>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Supervisor Bottlenecks</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {supervisorSummary.map((item) => (
            <div key={item.name} className="rounded-md bg-[#f6f4ee] p-3 text-sm">
              <div className="font-semibold text-ink">{item.name}</div>
              <div className="text-black/60">Missing writers: {item.missingWriters}</div>
              <div className="text-black/60">Missing help docs: {item.missingHelpDocs}</div>
              <div className="text-black/60">Critical delays: {item.criticalDelays}</div>
            </div>
          ))}
        </div>
      </section>

      <SectionList
        sections={[
          { title: "Approved Today", titles: filtered.filter((title) => title.approvedDate === new Date().toISOString().slice(0, 10)) },
          { title: "Approved This Week", titles: filtered.filter((title) => title.ageDays <= 7) },
          { title: "Critical Delayed Titles", titles: filtered.filter((title) => title.severity === "Critical") },
          { title: "Deepak Pending Operations", titles: [...ops.wordCountMissing, ...ops.voMissing, ...ops.editorMissing, ...ops.proofreaderMissing] },
          { title: "Missing Writers", titles: filtered.filter((title) => title.missingFields.includes("Writer")) },
          { title: "Missing Help Docs", titles: filtered.filter((title) => title.missingFields.includes("Help Doc")) },
          { title: "Overdue Scripts", titles: filtered.filter(isOverdue) },
          { title: "Blocked Titles", titles: filtered.filter((title) => title.blocked) },
          { title: "Completed Today", titles: filtered.filter(isCompletedToday) },
          { title: "Completed This Week", titles: filtered.filter(isCompletedThisWeek) }
        ]}
      />
    </div>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-black/50">{label}</span>
      <select className="field-input mt-1" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="All">All</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
