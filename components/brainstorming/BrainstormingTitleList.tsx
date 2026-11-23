import { BrainstormingTitleListClient, type BankRow } from "@/components/brainstorming/BrainstormingTitleListClient";
import type { BrainstormingTitle } from "@/lib/types";

/**
 * Server wrapper: the title bank has thousands of ideas. Send only what the table
 * shows (the full rows made /brainstorming/title-bank an ~8 MB page).
 */
export function BrainstormingTitleList({ titles }: { titles: BrainstormingTitle[] }) {
  const rows: BankRow[] = titles.map((title) => ({
    id: title.id,
    title: title.title,
    sessionId: title.session_id ?? null,
    duplicateWarning: title.duplicate_warning ?? null,
    supervisor: title.supervisor || title.submitted_by_name || "Unassigned",
    channel: title.channel || "MV N",
    priority: title.priority || "Normal",
    status: title.status,
    reason: truncate(title.decision_reason || title.notes || "-", 280)
  }));
  return <BrainstormingTitleListClient rows={rows} />;
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
