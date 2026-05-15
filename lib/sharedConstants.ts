import type { BrainstormingSession, BrainstormingTitle } from "@/lib/types";

export const FRESH_START_CHANNELS = ["MV N", "LL", "Gamers", "Anime", "Long Reads"] as const;
export const PRIORITIES = ["Low", "Normal", "Urgent", "ULTRA URGENT"] as const;

export const BRAINSTORMING_DECISIONS = [
  "Approve",
  "Reject",
  "Hold",
  "Needs Better Angle",
  "Needs Research",
  "Duplicate"
] as const;

export function buildBrainstormingReport(session: BrainstormingSession, titles: BrainstormingTitle[]) {
  const approved = titles.filter((title) => title.status === "Approved" || title.status === "Converted To Production");
  const rejected = titles.filter((title) => title.status === "Rejected" || title.status === "Duplicate");
  const rework = titles.filter((title) => ["Needs Better Angle", "Needs Research", "Hold"].includes(title.status));
  const supervisors = Array.from(new Set(titles.map((title) => title.supervisor || title.submitted_by_name || "Unassigned"))).sort();
  const lines = [
    `Brainstorming Report: ${session.name}`,
    `Date: ${session.session_date}`,
    "",
    `Approved: ${approved.length}`,
    ...approved.map((title) => `- ${title.title} (${title.supervisor || "Unassigned"})`),
    "",
    `Rejected/Duplicate: ${rejected.length}`,
    ...rejected.map((title) => `- ${title.title}${title.decision_reason ? ` - ${title.decision_reason}` : ""}`),
    "",
    `Needs Rework/Hold: ${rework.length}`,
    ...rework.map((title) => `- ${title.title} [${title.status}]`),
    "",
    "Supervisor Counts:",
    ...supervisors.map((name) => {
      const scoped = titles.filter((title) => (title.supervisor || title.submitted_by_name || "Unassigned") === name);
      const approvedCount = scoped.filter((title) => title.status === "Approved" || title.status === "Converted To Production").length;
      return `- ${name}: ${scoped.length} submitted, ${approvedCount} approved`;
    })
  ];
  return lines.join("\n");
}
