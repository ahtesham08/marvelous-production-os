import clsx from "clsx";

const tones: Record<string, string> = {
  Draft: "border-black/10 bg-white text-black/65",
  Live: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Completed: "border-moss/25 bg-[#eef1eb] text-moss",
  Archived: "border-black/10 bg-[#f6f4ee] text-black/55",
  Proposed: "border-black/10 bg-white text-black/65",
  Approved: "border-emerald-300 bg-emerald-50 text-emerald-800",
  Rejected: "border-red-300 bg-red-50 text-red-800",
  Hold: "border-yellow-300 bg-yellow-50 text-yellow-800",
  "Needs Better Angle": "border-orange-300 bg-orange-50 text-orange-800",
  "Needs Research": "border-yellow-300 bg-yellow-50 text-yellow-800",
  Duplicate: "border-red-300 bg-red-50 text-red-800",
  "Converted To Production": "border-moss/25 bg-[#eef1eb] text-moss"
};

export function BrainstormingStatusBadge({ status }: { status: string | null | undefined }) {
  const value = status || "Proposed";
  return <span className={clsx("inline-flex rounded-md border px-2 py-1 text-xs font-semibold", tones[value] ?? tones.Proposed)}>{value}</span>;
}
