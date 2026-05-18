import { priorityRank } from "@/lib/sharedConstants";
import { toIndiaDateKey } from "@/lib/statusRules";
import type { EnrichedTitle, UserRecord } from "@/lib/types";

export type AttentionSeverity = "critical" | "high" | "medium" | "low";

export type AttentionTitle = {
  title: EnrichedTitle;
  problem: string;
  delayInfo: string;
  freshness: string;
  severity: AttentionSeverity;
  daysDelayed: number;
};

export type AttentionCard = {
  key: string;
  label: string;
  count: number;
  description: string;
  severity: AttentionSeverity;
  titles: AttentionTitle[];
  titleHref: string;
};

export type DangerousItem = AttentionTitle & {
  score: number;
};

export type SupervisorRisk = {
  name: string;
  total: number;
  ultraUrgent: number;
  delayed: number;
  overdueScripts: number;
  blocked: number;
  stale48: number;
  missingWriter: number;
  missingHelpDoc: number;
};

export type RequiredAction = {
  label: string;
  count: number;
  severity: AttentionSeverity;
  cardKey: string;
};

export type AdminAttentionDashboard = {
  scopedTitleCount: number;
  roleView: "admin" | "supervisor" | "operations" | "viewer";
  cards: AttentionCard[];
  topDangerousItems: DangerousItem[];
  supervisorRiskSnapshot: SupervisorRisk[];
  todaysRequiredActions: RequiredAction[];
};

const supervisorNames = ["Kamran", "Farhan", "Raktim"];
const completedStatuses = new Set(["Completed", "Cancelled"]);

export function buildAdminAttentionDashboard(titles: EnrichedTitle[], user: UserRecord | null): AdminAttentionDashboard {
  const role = String(user?.role ?? "Viewer");
  const roleView = role === "Admin" ? "admin" : role === "Supervisor" ? "supervisor" : role === "Operations Supervisor" ? "operations" : "viewer";
  const scopedTitles =
    roleView === "supervisor" && user?.name
      ? titles.filter((title) => samePerson(title.supervisor, user.name))
      : titles;

  const attentionTitles = scopedTitles.map(toAttentionTitle);
  const ultraUrgentTitles = attentionTitles.filter((item) => item.title.priority === "Ultra Urgent" && !isCompleted(item.title));
  const urgentTitles = attentionTitles.filter((item) => item.title.priority === "Urgent" && !isCompleted(item.title));
  const delayedScripts = attentionTitles.filter((item) => isDelayedScript(item.title));
  const overdueTitles = attentionTitles.filter((item) => isOverdue(item.title));
  const dueTodayTitles = attentionTitles.filter((item) => isDueToday(item.title));
  const blockedTitles = attentionTitles.filter((item) => item.title.blocked);
  const waitingForAhteshamTitles = attentionTitles.filter((item) => isWaitingForAhtesham(item.title));
  const staleTitles = attentionTitles.filter((item) => hoursSinceUpdate(item.title) >= 48 && !isCompleted(item.title));
  const submittedButProductionMissing = attentionTitles.filter((item) => isSubmittedButProductionMissing(item.title));

  const cards =
    roleView === "operations"
      ? [
          card("submittedButProductionMissing", "Scripts Submitted But Production Not Updated", submittedButProductionMissing, "Scripts are submitted, but production fields still need Deepak's update.", "high", "/titles?status=Script+Submitted"),
          card("wordCountMissing", "Word Count Missing", attentionTitles.filter((item) => item.title.missingFields.includes("Word Count")), "Scripts need word count before VO and editing can move.", "high", "/titles?q=Word+Count"),
          card("voMissing", "VO Missing", attentionTitles.filter((item) => item.title.missingFields.includes("VO")), "Word count exists but VO is not assigned yet.", "medium", "/titles?q=VO"),
          card("editorMissing", "Editor Missing", attentionTitles.filter((item) => item.title.missingFields.includes("Editor")), "Production needs an editor assignment.", "medium", "/titles?q=Editor"),
          card("proofreaderMissing", "Proofreader Missing", attentionTitles.filter((item) => item.title.missingFields.includes("Proofreader")), "Production needs proofreader assignment.", "medium", "/titles?q=Proofreader"),
          card("blockedTitles", "Blocked Production Items", blockedTitles, "Blocked titles need owner follow-up before production can continue.", "critical", "/blocked")
        ]
      : [
          card("ultraUrgentTitles", "Ultra Urgent Titles", ultraUrgentTitles, "These titles have the highest priority and need immediate tracking.", "critical", "/titles?priority=Ultra+Urgent"),
          card("urgentTitles", "Urgent Titles", urgentTitles, "High-priority titles that should not drift today.", "high", "/titles?priority=Urgent"),
          card("delayedScripts", "Delayed Scripts", delayedScripts, "Titles with missed due dates, stale movement, or writer/script delay.", "critical", "/titles?sort=priority"),
          card("overdueTitles", "Overdue Titles", overdueTitles, "Due date has passed and the title is not completed.", "high", "/overdue"),
          card("dueTodayTitles", "Titles Due Today", dueTodayTitles, "These need same-day review before they become overdue.", "medium", "/due-today"),
          card("blockedTitles", "Blocked Titles", blockedTitles, "Blocked titles need a direct unblock decision.", "critical", "/blocked"),
          card("waitingForAhteshamTitles", "Waiting For Ahtesham Decision", waitingForAhteshamTitles, "Titles appear to need owner approval, hold resolution, or direction.", "high", "/titles?q=Ahtesham"),
          card("staleTitles", "Titles With No Update In 48 Hours", staleTitles, "These have not been touched recently and may be quietly slipping.", "medium", "/titles?sort=age"),
          card("submittedButProductionMissing", "Scripts Submitted But Production Not Updated", submittedButProductionMissing, "Scripts are submitted, but word count/VO/editor/proofreader work is not fully updated.", "high", "/titles?status=Script+Submitted")
        ];

  const topDangerousItems = attentionTitles
    .filter((item) => !isCompleted(item.title))
    .map((item) => ({ ...item, score: dangerScore(item.title, item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    scopedTitleCount: scopedTitles.length,
    roleView,
    cards,
    topDangerousItems,
    supervisorRiskSnapshot: buildSupervisorRisk(scopedTitles),
    todaysRequiredActions: buildActions(cards, scopedTitles)
  };
}

function card(
  key: string,
  label: string,
  titles: AttentionTitle[],
  description: string,
  severity: AttentionSeverity,
  titleHref: string
): AttentionCard {
  return { key, label, count: titles.length, description, severity: maxSeverity(titles, severity), titles, titleHref };
}

function toAttentionTitle(title: EnrichedTitle): AttentionTitle {
  const daysDelayed = overdueDays(title);
  return {
    title,
    problem: problemLabel(title),
    delayInfo: delayInfo(title, daysDelayed),
    freshness: getTitleFreshnessLabel(title),
    severity: severityForTitle(title, daysDelayed),
    daysDelayed
  };
}

function buildSupervisorRisk(titles: EnrichedTitle[]) {
  return supervisorNames.map((name) => {
    const scoped = titles.filter((title) => samePerson(title.supervisor, name));
    return {
      name,
      total: scoped.length,
      ultraUrgent: scoped.filter((title) => title.priority === "Ultra Urgent" && !isCompleted(title)).length,
      delayed: scoped.filter(isDelayedScript).length,
      overdueScripts: scoped.filter(isOverdue).length,
      blocked: scoped.filter((title) => title.blocked).length,
      stale48: scoped.filter((title) => hoursSinceUpdate(title) >= 48 && !isCompleted(title)).length,
      missingWriter: scoped.filter((title) => title.missingFields.includes("Writer")).length,
      missingHelpDoc: scoped.filter((title) => title.missingFields.includes("Help Doc")).length
    };
  });
}

function buildActions(cards: AttentionCard[], titles: EnrichedTitle[]): RequiredAction[] {
  const byKey = new Map(cards.map((item) => [item.key, item]));
  const delayedBySupervisor = supervisorNames
    .map((name) => ({ name, count: titles.filter((title) => samePerson(title.supervisor, name) && isOverdue(title)).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)[0];

  const actions: RequiredAction[] = [
    action("Review Ultra Urgent titles.", byKey.get("ultraUrgentTitles"), "critical"),
    action("Decide titles waiting for owner direction.", byKey.get("waitingForAhteshamTitles"), "high"),
    action("Check delayed scripts.", byKey.get("delayedScripts"), "critical"),
    action("Ask Deepak to update submitted scripts.", byKey.get("submittedButProductionMissing"), "high"),
    action("Resolve blocked titles.", byKey.get("blockedTitles"), "critical")
  ].filter((item) => item.count > 0);

  if (delayedBySupervisor) {
    actions.splice(3, 0, {
      label: `Ask ${delayedBySupervisor.name} about overdue titles.`,
      count: delayedBySupervisor.count,
      severity: "high",
      cardKey: "overdueTitles"
    });
  }

  return actions;
}

function action(label: string, source: AttentionCard | undefined, fallbackSeverity: AttentionSeverity): RequiredAction {
  return {
    label,
    count: source?.count ?? 0,
    severity: source?.severity ?? fallbackSeverity,
    cardKey: source?.key ?? ""
  };
}

function isDelayedScript(title: EnrichedTitle) {
  if (isCompleted(title)) return false;
  if (isOverdue(title)) return true;
  if (isScriptDueMissed(title)) return true;
  if (["Urgent", "Ultra Urgent"].includes(title.priority) && hoursSinceUpdate(title) > 24) return true;
  if (hoursSinceUpdate(title) >= 48) return true;
  if (title.missingFields.includes("Writer") && title.ageDays >= 1) return true;
  return Boolean(title.writer !== "Missing" && !title.scriptSubmittedAt && isPastDate(title.writerDueDate));
}

function isOverdue(title: EnrichedTitle) {
  return !isCompleted(title) && isPastDate(title.writerDueDate);
}

function isScriptDueMissed(title: EnrichedTitle) {
  return !isCompleted(title) && !title.scriptSubmittedAt && isPastDate(title.writerDueDate);
}

function isDueToday(title: EnrichedTitle) {
  return !isCompleted(title) && Boolean(title.writerDueDate && toIndiaDateKey(title.writerDueDate) === todayKey());
}

function isSubmittedButProductionMissing(title: EnrichedTitle) {
  const submitted = title.status === "Script Submitted" || Boolean(title.scriptSubmittedAt);
  return submitted && ["Word Count", "VO", "Editor", "Proofreader"].some((field) => title.missingFields.includes(field));
}

function isWaitingForAhtesham(title: EnrichedTitle) {
  const text = [title.status, title.nextAction, title.blockedCategory, title.blockedReason, title.notes].join(" ").toLowerCase();
  return text.includes("ahtesham") || text.includes("approval") || text.includes("decision") || title.status === "On Hold";
}

function problemLabel(title: EnrichedTitle) {
  const staleDays = Math.floor(hoursSinceUpdate(title) / 24);
  if (title.priority === "Ultra Urgent" && isOverdue(title)) return "Ultra Urgent and overdue";
  if (title.blocked) return title.blockedCategory ? `Blocked: ${title.blockedCategory}` : "Blocked";
  if (isScriptDueMissed(title)) return `Script late by ${Math.max(1, overdueDays(title))} day${Math.max(1, overdueDays(title)) === 1 ? "" : "s"}`;
  if (title.missingFields.includes("Writer")) return "Writer not assigned";
  if (staleDays >= 5) return `No update in ${staleDays} days`;
  if (hoursSinceUpdate(title) >= 48) return "No update in 48 hours";
  if (title.missingFields.includes("Help Doc")) return "Help doc missing";
  if (isSubmittedButProductionMissing(title)) return "Script submitted, production not updated";
  return title.nextAction || "Needs review";
}

function delayInfo(title: EnrichedTitle, daysDelayed: number) {
  if (daysDelayed > 0) return `${daysDelayed} day${daysDelayed === 1 ? "" : "s"} late`;
  if (title.missingFields.includes("Writer")) return "No writer assigned";
  if (hoursSinceUpdate(title) >= 48) return getTitleFreshnessLabel(title);
  if (isDueToday(title)) return "Due today";
  return "On watch";
}

export function getTitleFreshnessLabel(title: Pick<EnrichedTitle, "lastUpdatedAt" | "ageDays">) {
  const hours = hoursSinceUpdate(title);
  if (hours < 24) return "Updated today";
  const days = Math.floor(hours / 24);
  if (days >= 10) return "No update in 10 days";
  if (days >= 5) return "No update in 5 days";
  if (hours >= 48) return "No update in 48 hours";
  return "Updated yesterday";
}

function severityForTitle(title: EnrichedTitle, daysDelayed: number): AttentionSeverity {
  const staleDays = Math.floor(hoursSinceUpdate(title) / 24);
  if ((title.priority === "Ultra Urgent" && (daysDelayed > 0 || title.blocked)) || daysDelayed > 3 || staleDays > 5) return "critical";
  if ((title.priority === "Urgent" && daysDelayed > 0) || isPastDate(title.writerDueDate)) return "high";
  if ((["Urgent", "Ultra Urgent"].includes(title.priority) && title.missingFields.includes("Writer")) || title.missingFields.includes("Writer")) return "high";
  if (isDueToday(title) || title.missingFields.includes("Help Doc") || hoursSinceUpdate(title) >= 48) return "medium";
  return "low";
}

function maxSeverity(titles: AttentionTitle[], fallback: AttentionSeverity) {
  if (titles.some((item) => item.severity === "critical")) return "critical";
  if (titles.some((item) => item.severity === "high")) return "high";
  if (titles.some((item) => item.severity === "medium")) return "medium";
  return fallback;
}

function dangerScore(title: EnrichedTitle, attention: AttentionTitle) {
  const priorityScore = 400 - priorityRank(title.priority) * 80;
  const overdueScore = attention.daysDelayed * 20;
  const blockedScore = title.blocked ? 70 : 0;
  const staleScore = Math.min(120, Math.floor(hoursSinceUpdate(title) / 12) * 10);
  const missingOwnerScore = title.missingFields.includes("Supervisor") || title.missingFields.includes("Writer") ? 55 : 0;
  const severityScore = attention.severity === "critical" ? 120 : attention.severity === "high" ? 80 : attention.severity === "medium" ? 40 : 0;
  return priorityScore + overdueScore + blockedScore + staleScore + missingOwnerScore + severityScore;
}

function overdueDays(title: EnrichedTitle) {
  if (!title.writerDueDate || !isPastDate(title.writerDueDate)) return 0;
  const due = parseDateKey(toIndiaDateKey(title.writerDueDate) ?? title.writerDueDate.slice(0, 10));
  const today = parseDateKey(todayKey());
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
}

function hoursSinceUpdate(title: Pick<EnrichedTitle, "lastUpdatedAt" | "ageDays">) {
  if (!title.lastUpdatedAt) return title.ageDays * 24;
  const updated = new Date(title.lastUpdatedAt).getTime();
  if (!Number.isFinite(updated)) return title.ageDays * 24;
  return Math.max(0, (Date.now() - updated) / 3_600_000);
}

function isPastDate(value: string | null) {
  if (!value) return false;
  return String(toIndiaDateKey(value) ?? value.slice(0, 10)) < todayKey();
}

function todayKey() {
  return toIndiaDateKey(new Date()) ?? new Date().toISOString().slice(0, 10);
}

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00+05:30`);
}

function samePerson(value: string, name: string) {
  return value.toLowerCase().includes(name.toLowerCase());
}

function isCompleted(title: EnrichedTitle) {
  return completedStatuses.has(title.status);
}
