import clsx from "clsx";
import { normalizePriorityLabel } from "@/lib/sharedConstants";

export function PriorityBadge({ priority }: { priority: string }) {
  const label = normalizePriorityLabel(priority);
  const tone =
    label === "Ultra Urgent"
      ? "border-red-500 bg-red-100 text-red-900"
      : label === "Urgent"
      ? "border-red-300 bg-red-50 text-red-800"
      : label === "Normal"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-black/10 bg-white text-black/65";

  return <span className={clsx("rounded-md border px-2 py-1 text-xs font-semibold", tone)}>{label}</span>;
}
