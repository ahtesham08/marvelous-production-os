import { isCompletedThisWeek, isOverdue, operationsSections } from "@/lib/mvp3Views";
import type { DashboardData, EnrichedTitle } from "@/lib/types";

export function buildReports(data: DashboardData) {
  const ops = operationsSections(data.titles);
  return [
    {
      id: "daily-owner",
      name: "Daily owner report",
      text: [
        "Daily Marvelous Production OS Report",
        "",
        `Approved today: ${data.titles.filter((title) => title.approvedDate === new Date().toISOString().slice(0, 10)).length}`,
        `Critical delays: ${data.titles.filter((title) => title.severity === "Critical").length}`,
        `Missing writers: ${data.titles.filter((title) => title.missingFields.includes("Writer")).length}`,
        `Missing help docs: ${data.titles.filter((title) => title.missingFields.includes("Help Doc")).length}`,
        `Blocked titles: ${data.titles.filter((title) => title.blocked).length}`
      ].join("\n")
    },
    {
      id: "supervisors",
      name: "Supervisor-wise report",
      text: data.supervisorSummary
        .map((item) => `${item.name}: ${item.total} titles, ${item.missingWriters} missing writers, ${item.missingHelpDocs} missing help docs, ${item.criticalDelays} critical`)
        .join("\n")
    },
    {
      id: "deepak",
      name: "Deepak operations report",
      text: [
        "Deepak Pending Operations",
        `Word count missing: ${ops.wordCountMissing.length}`,
        `VO missing: ${ops.voMissing.length}`,
        `Editor missing: ${ops.editorMissing.length}`,
        `Proofreader missing: ${ops.proofreaderMissing.length}`,
        `Ready to complete: ${ops.readyToComplete.length}`
      ].join("\n")
    },
    { id: "blocked", name: "Blocked titles report", text: formatTitles(data.titles.filter((title) => title.blocked)) },
    { id: "overdue", name: "Overdue titles report", text: formatTitles(data.titles.filter(isOverdue)) },
    { id: "completed-week", name: "Completed this week report", text: formatTitles(data.titles.filter(isCompletedThisWeek)) }
  ];
}

function formatTitles(titles: EnrichedTitle[]) {
  if (titles.length === 0) return "None.";
  return titles
    .map((title, index) => `${index + 1}. ${title.title}\n   Owner: ${title.supervisor}\n   Writer: ${title.writer}\n   Status: ${title.status}\n   Next: ${title.nextAction}`)
    .join("\n\n");
}
