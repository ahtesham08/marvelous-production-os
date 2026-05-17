"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FiltersBar } from "@/components/FiltersBar";
import { MissingFieldsBadge } from "@/components/MissingFieldsBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { priorityRank } from "@/lib/sharedConstants";
import { toIndiaDateKey } from "@/lib/statusRules";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = usePersistentFilter("q", "", searchParams);
  const [supervisor, setSupervisor] = usePersistentFilter("supervisor", initialSupervisor, searchParams);
  const [channel, setChannel] = usePersistentFilter("channel", initialChannel, searchParams);
  const [status, setStatus] = usePersistentFilter("status", "All", searchParams);
  const [priority, setPriority] = usePersistentFilter("priority", "All", searchParams);
  const [dateFilter, setDateFilter] = usePersistentFilter("date", "All", searchParams);
  const [customStart, setCustomStart] = usePersistentFilter("start", "", searchParams);
  const [customEnd, setCustomEnd] = usePersistentFilter("end", "", searchParams);
  const [sortBy, setSortBy] = usePersistentFilter("sort", "age", searchParams);

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
    const range = getDateRange(dateFilter, customStart, customEnd);
    return titles
      .filter((title) => !rottingOnly || title.severity === "Critical" || title.ageDays >= 8 || title.matchStatus === "Not Migrated")
      .filter((title) => supervisor === "All" || title.supervisor === supervisor)
      .filter((title) => channel === "All" || title.channel === channel)
      .filter((title) => status === "All" || (status === "not-completed" ? title.status !== "Completed" : title.status === status))
      .filter((title) => priority === "All" || title.priority === priority)
      .filter((title) => {
        if (!range) return true;
        const value = title.approvedDate || title.createdDate;
        return Boolean(value && value >= range.start && value <= range.end);
      })
      .filter((title) => {
        if (!query) return true;
        return [
          title.title,
          title.channel,
          title.supervisor,
          title.writer,
          title.priority,
          title.status,
          title.expectedWordCount,
          title.wordCount,
          title.voArtist,
          title.editor,
          title.proofreader,
          title.matchStatus,
          title.missingFields.join(" ")
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => compareTitles(a, b, sortBy));
  }, [channel, customEnd, customStart, dateFilter, priority, rottingOnly, search, sortBy, status, supervisor, titles]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    updateParam(next, "q", search, "");
    updateParam(next, "supervisor", supervisor, initialSupervisor);
    updateParam(next, "channel", channel, initialChannel);
    updateParam(next, "status", status, "All");
    updateParam(next, "priority", priority, "All");
    updateParam(next, "date", dateFilter, "All");
    updateParam(next, "start", customStart, "");
    updateParam(next, "end", customEnd, "");
    updateParam(next, "sort", sortBy, "age");
    const query = next.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams}` : pathname;
    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false });
  }, [channel, customEnd, customStart, dateFilter, initialChannel, initialSupervisor, pathname, priority, router, search, searchParams, sortBy, status, supervisor]);

  const returnPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

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
        status={status}
        priority={priority}
        dateFilter={dateFilter}
        customStart={customStart}
        customEnd={customEnd}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onDateFilterChange={setDateFilter}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onSearchChange={setSearch}
      />

      <div className="rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto pb-2">
          <table className="min-w-[1680px] divide-y divide-black/10 text-left text-sm">
            <thead className="bg-[#eef1eb] text-xs uppercase text-black/55">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">Writer</th>
                <th className="px-4 py-3">Expected WC</th>
                <th className="px-4 py-3">Actual WC</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">VO</th>
                <th className="px-4 py-3">Editor</th>
                <th className="px-4 py-3">Proofreader</th>
                <th className="px-4 py-3">Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredTitles.map((title) => (
                <tr key={title.id} className="align-top hover:bg-[#faf9f5]">
                  <td className="max-w-sm px-4 py-3 font-medium text-ink">
                    <Link href={`/titles/${title.id}?return=${encodeURIComponent(returnPath)}`} className="transition hover:text-moss hover:underline">
                      {title.title}
                    </Link>
                    {title.blocked ? <div className="mt-1 text-xs font-semibold text-danger">Blocked</div> : null}
                  </td>
                  <td className="px-4 py-3 text-black/70">{title.channel}</td>
                  <td className="px-4 py-3 text-black/70">{title.supervisor}</td>
                  <td className="px-4 py-3 text-black/70">{title.writer}</td>
                  <td className="px-4 py-3 text-black/70">{formatNumber(title.expectedWordCount)}</td>
                  <td className="px-4 py-3 text-black/70">{formatNumber(title.wordCount)}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={title.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={title.status} />
                  </td>
                  <td className="px-4 py-3 text-black/70">{title.writerDueDate || "Not set"}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{title.ageDays}d</div>
                    <div className="text-xs text-black/50">{title.ageBucket}</div>
                  </td>
                  <td className="px-4 py-3 text-black/70">{title.voArtist || "Not assigned"}</td>
                  <td className="px-4 py-3 text-black/70">{title.editor || "Not assigned"}</td>
                  <td className="px-4 py-3 text-black/70">{title.proofreader || "Not assigned"}</td>
                  <td className="px-4 py-3">
                    <MissingFieldsBadge fields={title.missingFields} />
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

function usePersistentFilter(key: string, fallback: string, searchParams: ReturnType<typeof useSearchParams>) {
  const storageKey = `marvelous-title-table-${key}`;
  const initial = searchParams.get(key) || fallback;
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (searchParams.get(key)) return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setValue(stored);
  }, [key, searchParams, storageKey]);
  useEffect(() => {
    window.localStorage.setItem(storageKey, value);
  }, [storageKey, value]);
  return [value, setValue] as const;
}

function updateParam(params: URLSearchParams, key: string, value: string, fallback: string) {
  if (!value || value === fallback) params.delete(key);
  else params.set(key, value);
}

function getDateRange(filter: string, customStart: string, customEnd: string) {
  const todayKey = toIndiaDateKey(new Date()) ?? new Date().toISOString().slice(0, 10);
  const today = parseDateKey(todayKey);
  if (filter === "today") return singleDate(today);
  if (filter === "yesterday") {
    const yesterday = addDays(today, -1);
    return singleDate(yesterday);
  }
  if (filter === "current-week") {
    const start = addDays(today, -today.getDay());
    return { start: toDateKey(start), end: toDateKey(addDays(start, 6)) };
  }
  if (filter === "last-week") {
    const currentStart = addDays(today, -today.getDay());
    const start = addDays(currentStart, -7);
    return { start: toDateKey(start), end: toDateKey(addDays(start, 6)) };
  }
  if (filter === "custom" && customStart && customEnd) return { start: customStart, end: customEnd };
  return null;
}

function singleDate(date: Date) {
  const key = toDateKey(date);
  return { start: key, end: key };
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateKey(date: Date) {
  return toIndiaDateKey(date) ?? date.toISOString().slice(0, 10);
}

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function compareTitles(a: EnrichedTitle, b: EnrichedTitle, sortBy: string) {
  if (sortBy === "priority") {
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
    if (byPriority !== 0) return byPriority;
    return b.ageDays - a.ageDays;
  }
  if (sortBy === "newest") return newestDateValue(b.approvedDate || b.createdDate) - newestDateValue(a.approvedDate || a.createdDate);
  if (sortBy === "due-date") return dateValue(a.writerDueDate) - dateValue(b.writerDueDate);
  return b.ageDays - a.ageDays;
}

function dateValue(value: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function newestDateValue(value: string | null) {
  if (!value) return 0;
  const time = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatNumber(value: number | null) {
  return value === null || value === undefined ? "Not set" : value.toLocaleString("en-IN");
}
