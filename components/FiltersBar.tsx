"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STATUS_VALUES } from "@/lib/statusRules";

type FiltersBarProps = {
  channels: string[];
  supervisors: string[];
  channel: string;
  supervisor: string;
  status: string;
  priority: string;
  dateFilter: string;
  customStart: string;
  customEnd: string;
  sortBy: string;
  search: string;
  onChannelChange: (value: string) => void;
  onSupervisorChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onDateFilterChange: (value: string) => void;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
};

export function FiltersBar({
  channels,
  supervisors,
  channel,
  supervisor,
  status,
  priority,
  dateFilter,
  customStart,
  customEnd,
  sortBy,
  search,
  onChannelChange,
  onSupervisorChange,
  onStatusChange,
  onPriorityChange,
  onDateFilterChange,
  onCustomStartChange,
  onCustomEndChange,
  onSortByChange,
  onSearchChange,
  onClearFilters
}: FiltersBarProps) {
  const statusPopoverRef = useRef<HTMLDivElement>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const selectedStatusTokens = parseStatusTokens(status);
  const statusOptions = useMemo(() => ["not-completed", "proofreader-not-assigned", ...STATUS_VALUES, "Blocked"], []);
  const statusSummary = formatStatusSummary(selectedStatusTokens);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (!statusPopoverRef.current?.contains(event.target as Node)) setStatusOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setStatusOpen(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleStatusToken(token: string, checked: boolean) {
    const next = new Set(selectedStatusTokens);
    if (checked) next.add(token);
    else next.delete(token);
    onStatusChange(encodeStatusTokens(Array.from(next)));
  }

  function clearStatusToken(token: string) {
    onStatusChange(encodeStatusTokens(selectedStatusTokens.filter((item) => item !== token)));
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_220px_160px]">
      <input
        suppressHydrationWarning
        className="focus-ring rounded-md border border-black/15 px-3 py-2 text-sm"
        placeholder="Search title, writer, status, missing field"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <select
        suppressHydrationWarning
        className="focus-ring rounded-md border border-black/15 px-3 py-2 text-sm"
        value={supervisor}
        onChange={(event) => onSupervisorChange(event.target.value)}
      >
        <option value="All">All supervisors</option>
        {supervisors.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <select
        suppressHydrationWarning
        className="focus-ring rounded-md border border-black/15 px-3 py-2 text-sm"
        value={channel}
        onChange={(event) => onChannelChange(event.target.value)}
      >
        <option value="All">All channels</option>
        {channels.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <div ref={statusPopoverRef} className="relative">
        <button
          type="button"
          onClick={() => setStatusOpen((current) => !current)}
          className="focus-ring flex h-full min-h-[42px] w-full items-center justify-between gap-2 rounded-md border border-black/15 bg-white px-3 py-2 text-left text-sm"
          aria-expanded={statusOpen}
          aria-haspopup="listbox"
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase text-black/45">Status Filter</span>
            <span className="block truncate font-medium text-ink">{statusSummary}</span>
          </span>
          <span className="shrink-0 text-xs font-semibold uppercase text-black/45">{statusOpen ? "Close" : "Open"}</span>
        </button>

        {statusOpen ? (
          <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-black/10 bg-white p-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase text-black/45">Select statuses</div>
                <div className="mt-1 text-xs text-black/55">{selectedStatusTokens.length === 0 ? "Showing all statuses" : statusSummary}</div>
              </div>
              <button
                type="button"
                onClick={() => onStatusChange("All")}
                className="text-xs font-semibold text-moss hover:underline"
              >
                Clear
              </button>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto pr-1">
              <div className="space-y-1">
                {statusOptions.map((token) => (
                  <StatusCheckbox
                    key={token}
                    label={statusLabel(token)}
                    checked={selectedStatusTokens.includes(token)}
                    onChange={(checked) => toggleStatusToken(token, checked)}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 flex justify-end border-t border-black/10 pt-3">
              <button
                type="button"
                onClick={() => setStatusOpen(false)}
                className="focus-ring rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-moss"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <select
        suppressHydrationWarning
        className="focus-ring rounded-md border border-black/15 px-3 py-2 text-sm"
        value={priority}
        onChange={(event) => onPriorityChange(event.target.value)}
      >
        <option value="All">All priorities</option>
        {["Low", "Normal", "Urgent", "Ultra Urgent"].map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[180px_180px_180px_180px_1fr_160px]">
        <select
          suppressHydrationWarning
          className="focus-ring rounded-md border border-black/15 px-3 py-2 text-sm"
          value={dateFilter}
          onChange={(event) => onDateFilterChange(event.target.value)}
        >
          <option value="All">All dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="current-week">Current Week</option>
          <option value="last-week">Last Week</option>
          <option value="custom">Custom Date Range</option>
        </select>
        <input
          suppressHydrationWarning
          type="date"
          className="focus-ring rounded-md border border-black/15 px-3 py-2 text-sm disabled:opacity-50"
          value={customStart}
          disabled={dateFilter !== "custom"}
          onChange={(event) => onCustomStartChange(event.target.value)}
        />
        <input
          suppressHydrationWarning
          type="date"
          className="focus-ring rounded-md border border-black/15 px-3 py-2 text-sm disabled:opacity-50"
          value={customEnd}
          disabled={dateFilter !== "custom"}
          onChange={(event) => onCustomEndChange(event.target.value)}
        />
        <select
          suppressHydrationWarning
          className="focus-ring rounded-md border border-black/15 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value)}
        >
          <option value="age">Sort: Age</option>
          <option value="priority">Sort: Priority</option>
          <option value="newest">Sort: Newest</option>
          <option value="due-date">Sort: Due Date</option>
        </select>
        <div className="rounded-md bg-[#eef1eb] px-3 py-2 text-sm font-semibold text-moss">
          Date filter: {formatDateFilter(dateFilter, customStart, customEnd)} | {formatSort(sortBy)}
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}

function StatusCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-black/70 hover:bg-[#f6f4ee]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function parseStatusTokens(value: string) {
  if (!value || value === "All") return [];
  return value
    .split(",")
    .map((item) => decodeURIComponent(item).trim())
    .filter(Boolean);
}

function encodeStatusTokens(tokens: string[]) {
  const unique = Array.from(new Set(tokens.filter(Boolean)));
  return unique.length > 0 ? unique.map(encodeURIComponent).join(",") : "All";
}

function statusLabel(token: string) {
  if (token === "not-completed") return "All Except Completed";
  if (token === "proofreader-not-assigned") return "Proofreader Not Assigned";
  return token;
}

function formatStatusSummary(tokens: string[]) {
  if (tokens.length === 0) return "All statuses";
  const labels = tokens.map(statusLabel);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
}

function formatSort(sortBy: string) {
  if (sortBy === "priority") return "Urgency first";
  if (sortBy === "newest") return "Newest first";
  if (sortBy === "due-date") return "Due date first";
  return "Oldest age first";
}

function formatDateFilter(dateFilter: string, start: string, end: string) {
  if (dateFilter === "All") return "All dates";
  if (dateFilter === "today") return "Today";
  if (dateFilter === "yesterday") return "Yesterday";
  if (dateFilter === "current-week") return "Current week";
  if (dateFilter === "last-week") return "Last week";
  return `${start || "Start"} to ${end || "End"}`;
}
