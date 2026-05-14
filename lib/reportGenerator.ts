import type { DashboardData, EnrichedTitle, OperationsQueue, SupervisorSummary } from "@/lib/types";

export function generateDailyReport(data: Pick<DashboardData, "titles" | "supervisorSummary" | "operationsQueue" | "completedThisWeek">) {
  const critical = data.titles
    .filter((title) => title.severity === "Critical")
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 10);

  return [
    "Daily Marvelous Production Alert",
    "",
    "Critical Delays:",
    formatCriticalTitles(critical),
    "",
    "Supervisor Bottlenecks:",
    formatSupervisorSummary(data.supervisorSummary),
    "",
    "Deepak Pending:",
    formatOperationsQueue(data.operationsQueue),
    "",
    "Completed This Week:",
    `${data.completedThisWeek.length} titles`
  ].join("\n");
}

function formatCriticalTitles(titles: EnrichedTitle[]) {
  if (titles.length === 0) return "No critical delays right now.";

  return titles
    .map(
      (title, index) => `${index + 1}. ${title.title}
   Supervisor: ${title.supervisor}
   Age: ${title.ageDays} days
   Problem: ${title.missingFields.join(", ") || title.nextAction}`
    )
    .join("\n\n");
}

function formatSupervisorSummary(summary: SupervisorSummary[]) {
  if (summary.length === 0) return "No supervisor bottlenecks found.";
  return summary.map((item) => `${item.name}: ${item.overdueTitles} delayed titles`).join("\n");
}

function formatOperationsQueue(queue: OperationsQueue) {
  return [
    `Word Count Missing: ${queue.wordCountMissing.length}`,
    `VO Missing: ${queue.voMissing.length}`,
    `Editor Missing: ${queue.editorMissing.length}`,
    `Proofreader Missing: ${queue.proofreaderMissing.length}`,
    `Title Bank Rows Missing From Production: ${queue.notMigrated.length}`,
    `Production Rows Missing From Title Bank: ${queue.productionOnly.length}`
  ].join("\n");
}
