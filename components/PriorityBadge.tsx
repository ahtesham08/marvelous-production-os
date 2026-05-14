import clsx from "clsx";

export function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === "Urgent"
      ? "border-red-300 bg-red-50 text-red-800"
      : priority === "High"
        ? "border-orange-300 bg-orange-50 text-orange-800"
        : "border-black/10 bg-white text-black/65";

  return <span className={clsx("rounded-md border px-2 py-1 text-xs font-semibold", tone)}>{priority}</span>;
}
