import type { AgeBucket, EnrichedTitle, Severity, StatusValue } from "@/lib/types";

export const STATUS_VALUES: StatusValue[] = [
  "Approved",
  "Assigned To Supervisor",
  "Help Doc Pending",
  "Help Doc Ready",
  "Writer Pending",
  "Writer Assigned",
  "Script In Progress",
  "Script Submitted",
  "Word Count Pending",
  "Proofreading Pending",
  "Proofreading Done",
  "VO Pending",
  "VO Assigned",
  "VO Done",
  "Editing Pending",
  "Editing In Progress",
  "Editing Done",
  "Completed",
  "On Hold",
  "Cancelled"
];

export function calculateAgeDays(approvedDate: string | null, fallbackDate: string | null) {
  const rawDate = approvedDate || fallbackDate;
  if (!rawDate) return 0;

  const start = new Date(rawDate);
  if (Number.isNaN(start.getTime())) return 0;

  const today = new Date();
  const diffMs = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

export function getAgeBucket(ageDays: number): AgeBucket {
  if (ageDays >= 30) return "Critical";
  if (ageDays >= 15) return "Serious Delay";
  if (ageDays >= 8) return "Delayed";
  if (ageDays >= 4) return "Needs Attention";
  return "Fresh";
}

export function maxSeverity(values: Severity[]): Severity {
  if (values.includes("Critical")) return "Critical";
  if (values.includes("High")) return "High";
  if (values.includes("Medium")) return "Medium";
  return "Low";
}

export function nextActionForTitle(title: Pick<EnrichedTitle, "missingFields" | "matchStatus" | "ageDays">) {
  if (title.matchStatus === "Not Migrated") return "Move into the production sheet";
  if (title.matchStatus === "Production Only") return "Confirm approval in the title bank";
  if (title.missingFields.includes("Supervisor")) return "Assign a supervisor";
  if (title.missingFields.includes("Writer")) return "Assign writer immediately";
  if (title.missingFields.includes("Help Doc")) return "Create or paste help doc";
  if (title.missingFields.includes("Word Count")) return "Deepak to add word count";
  if (title.missingFields.includes("VO")) return "Deepak to assign VO";
  if (title.missingFields.includes("Editor")) return "Deepak to assign editor";
  if (title.missingFields.includes("Proofreader")) return "Deepak to assign proofreader";
  if (title.ageDays >= 15) return "Ask owner for latest status";
  return "Monitor";
}
