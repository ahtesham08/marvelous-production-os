import type { EnrichedTitle } from "@/lib/types";

export function calculateNextAction(title: Pick<EnrichedTitle,
  | "blocked"
  | "supervisor"
  | "writer"
  | "helpDocUrl"
  | "status"
  | "wordCount"
  | "voArtist"
  | "editor"
  | "proofreader"
  | "ageDays"
  | "writerDueDate"
>) {
  if (title.blocked) return "Resolve blocked issue";
  if (title.supervisor === "Missing") return "Assign supervisor";
  if (!title.helpDocUrl) return "Add help doc";
  if (title.writer === "Missing") return "Assign writer";
  if (title.status === "Approved" || title.status === "Writer Assigned") return "Wait for script";
  if (title.writerDueDate && isOverdue(title.writerDueDate) && !["Script Submitted", "Completed"].includes(title.status)) {
    return "Follow up with writer";
  }
  if (title.status === "Script Submitted" && !title.wordCount) return "Add word count";
  if (title.wordCount && !title.voArtist) return "Assign VO";
  if (title.wordCount && title.voArtist && !title.editor) return "Assign editor";
  if (title.wordCount && title.voArtist && title.editor && !title.proofreader) return "Assign proofreader";
  if (title.wordCount && title.voArtist && title.editor && title.proofreader && title.status !== "Completed") {
    return "Mark completed";
  }
  if (title.ageDays >= 8 && title.status !== "Completed") return "Check latest status";
  return "Monitor";
}

function isOverdue(dateValue: string) {
  const due = new Date(`${dateValue}T23:59:59`);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < Date.now();
}
