import { flattenActivity } from "@/lib/mvp3Views";
import type { EnrichedTitle, UserRecord } from "@/lib/types";

export function exportCsv(kind: string, titles: EnrichedTitle[], users: UserRecord[]) {
  if (kind === "users") {
    return toCsv(["name", "email", "role", "active", "default_channel", "default_supervisor"], users);
  }
  if (kind === "activity") {
    return toCsv(["title", "channel", "action", "old_value", "new_value", "created_at"], flattenActivity(titles));
  }
  if (kind === "production") {
    return toCsv(
      ["title", "channel", "wordCount", "voArtist", "clipFinder", "editor", "proofreader", "productionStatus"],
      titles
    );
  }
  return toCsv(
    ["title", "channel", "supervisor", "writer", "priority", "status", "ageDays", "writerDueDate", "nextAction"],
    titles
  );
}

function toCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => quote(row[header])).join(","))
  ].join("\n");
}

function quote(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
