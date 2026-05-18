import clsx from "clsx";

export function FreshnessBadge({ label }: { label: string }) {
  const tone = label.includes("10 days") || label.includes("5 days")
    ? "border-red-300 bg-red-50 text-red-800"
    : label.includes("48 hours")
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : label.includes("today")
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-black/10 bg-white text-black/60";

  return <span className={clsx("inline-flex rounded-md border px-2 py-1 text-xs font-semibold", tone)}>{label}</span>;
}
