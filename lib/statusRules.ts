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
  const startKey = toIndiaDateKey(approvedDate || fallbackDate);
  if (!startKey) return 0;
  const todayKey = toIndiaDateKey(new Date()) ?? startKey;
  const start = Date.UTC(Number(startKey.slice(0, 4)), Number(startKey.slice(5, 7)) - 1, Number(startKey.slice(8, 10)));
  const today = Date.UTC(Number(todayKey.slice(0, 4)), Number(todayKey.slice(5, 7)) - 1, Number(todayKey.slice(8, 10)));
  return Math.max(0, Math.floor((today - start) / 86_400_000));
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

export function toIndiaDateKey(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const text = String(value);
    return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
