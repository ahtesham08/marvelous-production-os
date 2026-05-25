import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { priorityRank } from "@/lib/sharedConstants";
import { toIndiaDateKey } from "@/lib/statusRules";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import type { BrainstormingTitle, EnrichedTitle, UserRecord } from "@/lib/types";

export type SupervisorSeverity = "critical" | "high" | "medium" | "low";

export type SupervisorAttentionItem = {
  id: string;
  source: "production" | "brainstorming";
  title: string;
  channel: string;
  writer: string;
  priority: string;
  status: string;
  dueDate: string | null;
  daysLate: number;
  lastUpdated: string;
  nextAction: string;
  problem: string;
  severity: SupervisorSeverity;
  href: string;
  missingFields: string[];
};

export type SupervisorAttentionCard = {
  key: string;
  label: string;
  count: number;
  description: string;
  severity: SupervisorSeverity;
  items: SupervisorAttentionItem[];
};

export type SupervisorActionItem = {
  label: string;
  count: number;
  severity: SupervisorSeverity;
  cardKey: string;
};

export type WriterFollowUp = {
  writer: string;
  activeTitles: number;
  dueToday: number;
  overdueTitles: number;
  oldestPendingTitle: string;
  followUpNeeded: boolean;
  items: SupervisorAttentionItem[];
};

export type MissingSetupItem = {
  item: SupervisorAttentionItem;
  missing: string[];
};

export type SupervisorDashboardReview = {
  supervisorName: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

export type SupervisorAttentionDashboard = {
  supervisorName: string;
  scopedTitleCount: number;
  cards: SupervisorAttentionCard[];
  topDangerousTitles: Array<SupervisorAttentionItem & { score: number }>;
  writerFollowUpQueue: WriterFollowUp[];
  missingSetupQueue: MissingSetupItem[];
  waitingForAhteshamQueue: SupervisorAttentionItem[];
  todaysActionChecklist: SupervisorActionItem[];
  copyableSupervisorReport: string;
  review: SupervisorDashboardReview;
};

const completedStatuses = new Set(["Completed", "Cancelled"]);
const reviewStorePath = path.join(process.cwd(), ".data", "supervisor-dashboard-reviews.json");

export async function buildSupervisorAttentionDashboard(input: {
  titles: EnrichedTitle[];
  brainstormingTitles: BrainstormingTitle[];
  supervisorName: string;
  review: SupervisorDashboardReview;
}): Promise<SupervisorAttentionDashboard> {
  const scopedTitles = input.titles.filter((title) => samePerson(title.supervisor, input.supervisorName));
  const productionItems = scopedTitles.map(toProductionItem);
  const brainstormingItems = input.brainstormingTitles
    .filter((title) => samePerson(title.supervisor || title.submitted_by_name || "", input.supervisorName))
    .map(toBrainstormingItem);

  const ultraUrgent = productionItems.filter((item) => item.priority === "Ultra Urgent" && !isCompletedItem(item));
  const urgent = productionItems.filter((item) => item.priority === "Urgent" && !isCompletedItem(item));
  const dueToday = productionItems.filter((item) => item.dueDate === todayKey() && !isCompletedItem(item));
  const overdue = productionItems.filter((item) => item.daysLate > 0 && !isCompletedItem(item));
  const missingWriter = productionItems.filter((item) => item.missingFields.includes("Writer"));
  const missingHelpDoc = productionItems.filter((item) => item.missingFields.includes("Help Doc"));
  const noDueDate = productionItems.filter((item) => !item.dueDate && !isCompletedItem(item));
  const stale = productionItems.filter((item) => item.problem.includes("No update") && !isCompletedItem(item));
  const blocked = productionItems.filter((item) => item.status === "Blocked" || item.problem.includes("Blocked"));
  const waitingForAhtesham = [...productionItems.filter(isWaitingForAhteshamItem), ...brainstormingItems.filter(isBrainstormingOwnerDecision)];
  const submittedNotMoved = productionItems.filter((item) => item.status === "Script Submitted" && hasProductionGap(item));
  const approvedNotStarted = productionItems.filter((item) => ["Approved", "Writer Pending"].includes(item.status));
  const rework = brainstormingItems.filter((item) => ["Needs Better Angle", "Needs Research"].includes(item.status));
  const heldResurfaced = brainstormingItems.filter((item) => item.status === "Hold" && item.dueDate && item.dueDate <= todayKey());

  const cards = [
    card("ultraUrgent", "Ultra Urgent Titles", ultraUrgent, "These are your highest-priority titles. Handle them first.", "critical"),
    card("urgent", "Urgent Titles", urgent, "Important titles that should not drift today.", "high"),
    card("dueToday", "Titles Due Today", dueToday, "These titles need same-day follow-up.", "medium"),
    card("overdue", "Overdue Scripts", overdue, "Due date has passed or script is late.", "critical"),
    card("missingWriter", "Titles Missing Writer", missingWriter, "Assign writers so approved titles can start moving.", "high"),
    card("missingHelpDoc", "Titles Missing Help Doc", missingHelpDoc, "Help docs are missing and can block writing.", "medium"),
    card("noDueDate", "Titles With No Due Date", noDueDate, "These titles need due dates so they do not rot silently.", "medium"),
    card("stale", "Titles With No Update In 48 Hours", stale, "These have not moved recently and need follow-up.", "high"),
    card("blocked", "Blocked Titles", blocked, "Blocked titles need unblock action or escalation.", "critical"),
    card("waitingForAhtesham", "Titles Waiting For Ahtesham Decision", waitingForAhtesham, "These need owner input or approval.", "high"),
    card("submittedNotMoved", "Scripts Submitted But Not Moved Forward", submittedNotMoved, "Scripts were submitted but production is not fully updated.", "high"),
    card("approvedNotStarted", "Titles Approved But Not Started", approvedNotStarted, "Approved titles still need setup or writer movement.", "medium"),
    card("rework", "Rework Titles From Brainstorming", rework, "Brainstorming ideas that need a better angle or research.", "medium"),
    card("heldResurfaced", "Held Titles Resurfaced Today", heldResurfaced, "Held ideas are active again and should be reviewed.", "medium")
  ];

  const topDangerousTitles = productionItems
    .filter((item) => !isCompletedItem(item))
    .filter((item) => item.status !== "Editing In Progress")
    .map((item) => ({ ...item, score: dangerScore(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    supervisorName: input.supervisorName,
    scopedTitleCount: scopedTitles.length,
    cards,
    topDangerousTitles,
    writerFollowUpQueue: buildWriterFollowUp(productionItems),
    missingSetupQueue: buildMissingSetup(productionItems),
    waitingForAhteshamQueue: waitingForAhtesham,
    todaysActionChecklist: buildActionChecklist(cards),
    copyableSupervisorReport: buildReport(input.supervisorName, cards),
    review: input.review
  };
}

export async function getSupervisorDashboardReview(supervisorName: string): Promise<SupervisorDashboardReview> {
  if (!hasSupabaseAdminConfig()) {
    const store = await readReviewStore();
    const review = store.filter((item) => samePerson(item.supervisorName, supervisorName)).sort((a, b) => String(b.reviewedAt).localeCompare(String(a.reviewedAt)))[0];
    return review ?? { supervisorName, reviewedAt: null, reviewedBy: null };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("created_at,new_value")
    .eq("action", "Supervisor dashboard reviewed")
    .eq("old_value", supervisorName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { supervisorName, reviewedAt: null, reviewedBy: null };
  return {
    supervisorName,
    reviewedAt: data?.created_at ?? null,
    reviewedBy: data?.new_value ?? null
  };
}

export async function markSupervisorDashboardReviewed(supervisorName: string, user: UserRecord | null) {
  const now = new Date().toISOString();
  const reviewedBy = user?.name ?? supervisorName;
  if (!hasSupabaseAdminConfig()) {
    const store = await readReviewStore();
    const review = { supervisorName, reviewedAt: now, reviewedBy };
    store.push(review);
    await writeReviewStore(store);
    return review;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("activity_log").insert({
    title_id: null,
    action: "Supervisor dashboard reviewed",
    old_value: supervisorName,
    new_value: reviewedBy,
    performed_by: user?.id?.startsWith("demo-") ? null : user?.id ?? null,
    created_at: now
  });
  if (error) throw error;
  return { supervisorName, reviewedAt: now, reviewedBy };
}

function toProductionItem(title: EnrichedTitle): SupervisorAttentionItem {
  const daysLate = overdueDays(title.writerDueDate);
  const problem = productionProblem(title, daysLate);
  return {
    id: title.id,
    source: "production",
    title: title.title,
    channel: title.channel,
    writer: title.writer,
    priority: title.priority,
    status: title.blocked ? "Blocked" : title.status,
    dueDate: title.writerDueDate,
    daysLate,
    lastUpdated: freshnessLabel(title.lastUpdatedAt, title.ageDays),
    nextAction: title.nextAction,
    problem,
    severity: severityForTitle(title, daysLate),
    href: `/titles/${title.id}?return=${encodeURIComponent("/dashboard/supervisor")}`,
    missingFields: title.missingFields
  };
}

function toBrainstormingItem(title: BrainstormingTitle): SupervisorAttentionItem {
  const href = title.session_id ? `/brainstorming/live/${title.session_id}` : "/brainstorming/title-bank";
  return {
    id: title.id,
    source: "brainstorming",
    title: title.title,
    channel: title.channel || "MV N",
    writer: title.suggested_writer || "Not assigned",
    priority: title.urgency || title.priority || "Normal",
    status: title.status,
    dueDate: title.hold_until_date || title.approved_due_date,
    daysLate: 0,
    lastUpdated: freshnessLabel(title.updated_at, 0),
    nextAction: title.status === "Hold" ? "Review resurfaced held title" : "Improve angle or research and resubmit",
    problem: title.status === "Hold" ? "Held title resurfaced" : title.status,
    severity: title.status === "Hold" ? "medium" : "high",
    href,
    missingFields: []
  };
}

function card(key: string, label: string, items: SupervisorAttentionItem[], description: string, fallback: SupervisorSeverity) {
  return { key, label, count: items.length, description, severity: maxSeverity(items, fallback), items };
}

function buildActionChecklist(cards: SupervisorAttentionCard[]) {
  const byKey = new Map(cards.map((card) => [card.key, card]));
  return [
    action("Assign writers to approved titles.", byKey.get("missingWriter"), "high"),
    action("Add help docs to titles that need setup.", byKey.get("missingHelpDoc"), "medium"),
    action("Follow up with writers whose scripts are overdue.", byKey.get("overdue"), "critical"),
    action("Resolve blocked titles.", byKey.get("blocked"), "critical"),
    action("Send titles to Ahtesham for decision.", byKey.get("waitingForAhtesham"), "high"),
    action("Update due dates for titles with no due date.", byKey.get("noDueDate"), "medium"),
    action("Review scripts submitted today or pending production.", byKey.get("submittedNotMoved"), "high")
  ].filter((item) => item.count > 0);
}

function buildWriterFollowUp(items: SupervisorAttentionItem[]): WriterFollowUp[] {
  const grouped = new Map<string, SupervisorAttentionItem[]>();
  for (const item of items) {
    if (item.writer === "Missing" || item.writer === "Not assigned") continue;
    grouped.set(item.writer, [...(grouped.get(item.writer) ?? []), item]);
  }
  return Array.from(grouped.entries())
    .map(([writer, writerItems]) => {
      const activeItems = writerItems.filter((item) => !isCompletedItem(item));
      const overdue = activeItems.filter((item) => item.daysLate > 0);
      const dueToday = activeItems.filter((item) => item.dueDate === todayKey());
      const oldest = [...activeItems].sort((a, b) => b.daysLate - a.daysLate)[0] ?? activeItems[0];
      return {
        writer,
        activeTitles: activeItems.length,
        dueToday: dueToday.length,
        overdueTitles: overdue.length,
        oldestPendingTitle: oldest?.title ?? "None",
        followUpNeeded: overdue.length > 0 || dueToday.length > 0 || activeItems.some((item) => item.lastUpdated.includes("48 hours") || item.lastUpdated.includes("5 days")),
        items: activeItems
      };
    })
    .filter((item) => item.activeTitles > 0)
    .sort((a, b) => Number(b.followUpNeeded) - Number(a.followUpNeeded) || b.overdueTitles - a.overdueTitles || b.dueToday - a.dueToday);
}

function buildMissingSetup(items: SupervisorAttentionItem[]): MissingSetupItem[] {
  return items
    .map((item) => {
      const missing = [
        ...item.missingFields.filter((field) => ["Writer", "Help Doc"].includes(field)),
        ...(!item.dueDate ? ["Due Date"] : []),
        ...(item.priority === "Normal" ? [] : []),
        ...(item.channel === "Unassigned" ? ["Channel"] : [])
      ];
      return { item, missing };
    })
    .filter((entry) => entry.missing.length > 0)
    .slice(0, 25);
}

function buildReport(supervisorName: string, cards: SupervisorAttentionCard[]) {
  const get = (key: string) => cards.find((card) => card.key === key)?.items ?? [];
  const sections = [
    ["Ultra Urgent", get("ultraUrgent")],
    ["Urgent", get("urgent")],
    ["Overdue", get("overdue")],
    ["Missing Writer", get("missingWriter")],
    ["Missing Help Doc", get("missingHelpDoc")],
    ["Blocked", get("blocked")],
    ["Waiting For Ahtesham", get("waitingForAhtesham")],
    ["Due Today", get("dueToday")]
  ] as const;
  return [
    `${supervisorName} Pending Work Report`,
    "",
    ...sections.flatMap(([label, items]) => [
      `${label}:`,
      ...(items.length > 0 ? items.slice(0, 10).map((item, index) => `${index + 1}. ${item.title} - ${item.problem}`) : ["None"]),
      ""
    ])
  ].join("\n");
}

function action(label: string, card: SupervisorAttentionCard | undefined, fallback: SupervisorSeverity): SupervisorActionItem {
  return { label, count: card?.count ?? 0, severity: card?.severity ?? fallback, cardKey: card?.key ?? "" };
}

function productionProblem(title: EnrichedTitle, daysLate: number) {
  const hours = hoursSinceUpdate(title.lastUpdatedAt, title.ageDays);
  if (title.priority === "Ultra Urgent" && daysLate > 0) return "Ultra Urgent and overdue";
  if (title.blocked) return title.blockedCategory ? `Blocked: ${title.blockedCategory}` : "Blocked title";
  if (title.missingFields.includes("Writer")) return "Writer not assigned";
  if (title.missingFields.includes("Help Doc")) return "Help doc missing";
  if (daysLate > 0) return `Script late by ${daysLate} day${daysLate === 1 ? "" : "s"}`;
  if (hours >= 120) return `No update in ${Math.floor(hours / 24)} days`;
  if (hours >= 48) return "No update in 48 hours";
  if (!title.writerDueDate && !isCompletedTitle(title)) return "No due date set";
  if (isWaitingForAhteshamTitle(title)) return "Waiting for Ahtesham decision";
  if (title.status === "Script Submitted" && ["Word Count", "VO", "Editor", "Proofreader"].some((field) => title.missingFields.includes(field))) {
    return "Script submitted but production not moved forward";
  }
  return title.nextAction || "Needs review";
}

function severityForTitle(title: EnrichedTitle, daysLate: number): SupervisorSeverity {
  const hours = hoursSinceUpdate(title.lastUpdatedAt, title.ageDays);
  if (title.priority === "Ultra Urgent" && (daysLate > 0 || title.blocked || title.missingFields.includes("Writer") || hours > 24)) return "critical";
  if (daysLate > 3) return "critical";
  if (title.priority === "Urgent" && (daysLate > 0 || title.missingFields.includes("Writer") || title.missingFields.includes("Help Doc"))) return "high";
  if (hours >= 48) return "high";
  if (!title.writerDueDate || title.missingFields.includes("Writer") || title.missingFields.includes("Help Doc")) return "medium";
  return "low";
}

function dangerScore(item: SupervisorAttentionItem) {
  const priorityScore = 400 - priorityRank(item.priority) * 80;
  const lateScore = item.daysLate * 25;
  const blockedScore = item.problem.includes("Blocked") ? 90 : 0;
  const missingWriterScore = item.missingFields.includes("Writer") ? 70 : 0;
  const missingHelpDocScore = item.missingFields.includes("Help Doc") ? 45 : 0;
  const noDueScore = item.dueDate ? 0 : 35;
  const severityScore = item.severity === "critical" ? 120 : item.severity === "high" ? 80 : item.severity === "medium" ? 40 : 0;
  return priorityScore + lateScore + blockedScore + missingWriterScore + missingHelpDocScore + noDueScore + severityScore;
}

function hasProductionGap(item: SupervisorAttentionItem) {
  return ["Word Count", "VO", "Editor", "Proofreader"].some((field) => item.missingFields.includes(field));
}

function isWaitingForAhteshamItem(item: SupervisorAttentionItem) {
  const text = [item.status, item.nextAction, item.problem].join(" ").toLowerCase();
  return text.includes("ahtesham") || text.includes("owner") || text.includes("approval") || text.includes("decision") || text.includes("waiting for ahtesham");
}

function isBrainstormingOwnerDecision(item: SupervisorAttentionItem) {
  return ["Needs Better Angle", "Needs Research", "Hold"].includes(item.status);
}

function isWaitingForAhteshamTitle(title: EnrichedTitle) {
  const text = [title.status, title.nextAction, title.blockedReason, title.notes].join(" ").toLowerCase();
  return text.includes("ahtesham") || text.includes("owner") || text.includes("approval") || text.includes("decision");
}

function maxSeverity(items: SupervisorAttentionItem[], fallback: SupervisorSeverity) {
  if (items.some((item) => item.severity === "critical")) return "critical";
  if (items.some((item) => item.severity === "high")) return "high";
  if (items.some((item) => item.severity === "medium")) return "medium";
  return fallback;
}

function isCompletedTitle(title: EnrichedTitle) {
  return completedStatuses.has(title.status);
}

function isCompletedItem(item: SupervisorAttentionItem) {
  return completedStatuses.has(item.status);
}

function overdueDays(value: string | null) {
  if (!value || value >= todayKey()) return 0;
  const due = parseDate(value);
  const today = parseDate(todayKey());
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
}

function freshnessLabel(value: string | null, fallbackAgeDays: number) {
  const hours = hoursSinceUpdate(value, fallbackAgeDays);
  if (hours < 24) return "Updated today";
  const days = Math.floor(hours / 24);
  if (days >= 10) return "No update in 10 days";
  if (days >= 5) return "No update in 5 days";
  if (hours >= 48) return "No update in 48 hours";
  return "Updated yesterday";
}

function hoursSinceUpdate(value: string | null, fallbackAgeDays: number) {
  if (!value) return fallbackAgeDays * 24;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return fallbackAgeDays * 24;
  return Math.max(0, (Date.now() - time) / 3_600_000);
}

function todayKey() {
  return toIndiaDateKey(new Date()) ?? new Date().toISOString().slice(0, 10);
}

function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00+05:30`);
}

function samePerson(value: string, name: string) {
  return value.toLowerCase().includes(name.toLowerCase());
}

async function readReviewStore(): Promise<SupervisorDashboardReview[]> {
  try {
    return JSON.parse(await readFile(reviewStorePath, "utf8")) as SupervisorDashboardReview[];
  } catch {
    return [];
  }
}

async function writeReviewStore(store: SupervisorDashboardReview[]) {
  await mkdir(path.dirname(reviewStorePath), { recursive: true });
  await writeFile(reviewStorePath, JSON.stringify(store, null, 2), "utf8");
}
