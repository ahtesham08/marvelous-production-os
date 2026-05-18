"use client";

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
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_160px_160px]">
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
      <select
        suppressHydrationWarning
        className="focus-ring rounded-md border border-black/15 px-3 py-2 text-sm"
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        <option value="All">All statuses</option>
        <option value="not-completed">All Except Completed</option>
        {[
          "Approved",
          "Assigned To Supervisor",
          "Help Doc Pending",
          "Help Doc Ready",
          "Writer Pending",
          "Writer Assigned",
          "Script In Progress",
          "Script Submitted",
          "Word Count Pending",
          "VO Pending",
          "VO Assigned",
          "Editing Pending",
          "Completed",
          "On Hold",
          "Cancelled"
        ].map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
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
