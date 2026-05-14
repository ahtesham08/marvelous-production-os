import clsx from "clsx";
import type { Severity } from "@/lib/types";

const classes: Record<Severity, string> = {
  Low: "border-slate-300 bg-slate-50 text-slate-700",
  Medium: "border-yellow-300 bg-yellow-50 text-yellow-800",
  High: "border-orange-300 bg-orange-50 text-orange-800",
  Critical: "border-red-300 bg-red-50 text-red-800"
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={clsx("inline-flex rounded-md border px-2 py-1 text-xs font-semibold", classes[severity])}>
      {severity}
    </span>
  );
}
