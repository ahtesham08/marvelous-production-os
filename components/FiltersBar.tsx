"use client";

type FiltersBarProps = {
  channels: string[];
  supervisors: string[];
  channel: string;
  supervisor: string;
  search: string;
  onChannelChange: (value: string) => void;
  onSupervisorChange: (value: string) => void;
  onSearchChange: (value: string) => void;
};

export function FiltersBar({
  channels,
  supervisors,
  channel,
  supervisor,
  search,
  onChannelChange,
  onSupervisorChange,
  onSearchChange
}: FiltersBarProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-sm md:grid-cols-[1fr_180px_180px]">
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
    </div>
  );
}
