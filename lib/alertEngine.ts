import type { EnrichedTitle, TitleAlert } from "@/lib/types";

export function generateAlerts(title: Omit<EnrichedTitle, "alerts" | "severity" | "nextAction">) {
  const alerts: TitleAlert[] = [];

  if (!title.supervisor || title.supervisor === "Missing") {
    alerts.push({
      type: "Missing Supervisor",
      severity: title.ageDays > 3 ? "High" : "Medium",
      message: "No supervisor is assigned."
    });
  }

  if ((!title.writer || title.writer === "Missing") && title.ageDays > 5) {
    alerts.push({
      type: "Missing Writer",
      severity: title.ageDays > 15 ? "Critical" : "High",
      message: "Writer is not assigned after the approved title aged beyond the allowed limit."
    });
  }

  if (!title.helpDocUrl && title.ageDays > 5) {
    alerts.push({
      type: "Missing Help Doc",
      severity: title.ageDays > 15 ? "Critical" : "High",
      message: "Help doc is missing."
    });
  }

  if (title.matchStatus === "Not Migrated") {
    alerts.push({
      type: "Not Found In Production Sheet",
      severity: title.ageDays > 15 ? "Critical" : "High",
      message: "Approved title is not found in the production tracker."
    });
  }

  if (title.matchStatus === "Production Only") {
    alerts.push({
      type: "Not Found In Title Bank",
      severity: "Medium",
      message: "Production tracker row is not found in the title bank."
    });
  }

  if (
    !title.wordCount &&
    ["Script Submitted", "Word Count Pending", "VO Pending", "VO Assigned", "Editing Pending", "Editing In Progress", "Completed"].includes(
      title.status
    )
  ) {
    alerts.push({
      type: "Word Count Missing",
      severity: "High",
      message: "Production row exists but word count is missing."
    });
  }

  if (title.wordCount && !title.voArtist) {
    alerts.push({
      type: "VO Missing",
      severity: "Medium",
      message: "Word count exists but VO is not assigned."
    });
  }

  if (title.wordCount && !title.editor) {
    alerts.push({
      type: "Editor Missing",
      severity: "Medium",
      message: "Word count exists but editor is not assigned."
    });
  }

  if (title.wordCount && !title.proofreader) {
    alerts.push({
      type: "Proofreader Missing",
      severity: "Medium",
      message: "Word count exists but proofreader is not assigned."
    });
  }

  if (title.ageDays >= 30 && title.status !== "Completed") {
    alerts.push({
      type: "Stale Title",
      severity: "Critical",
      message: "Title has aged beyond 30 days without completion."
    });
  }

  return alerts;
}
