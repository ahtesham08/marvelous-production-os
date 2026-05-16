import { generateAlerts } from "@/lib/alertEngine";
import { generateDailyReport } from "@/lib/reportGenerator";
import { getLocalTitleRecords } from "@/lib/localStore";
import { calculateNextAction } from "@/lib/nextActionEngine";
import { calculateAgeDays, getAgeBucket, maxSeverity, toIndiaDateKey } from "@/lib/statusRules";
import { normalizePriorityLabel } from "@/lib/sharedConstants";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import type {
  DashboardData,
  EnrichedTitle,
  OperationsQueue,
  ProductionDetail,
  SupervisorSummary,
  TitleRecord
} from "@/lib/types";

export async function getDashboardData(): Promise<DashboardData> {
  if (!hasSupabaseAdminConfig()) {
    const titles = (await getLocalTitleRecords()).map(enrichTitle);
    return buildDashboard(
      titles,
      "Local dev storage is active because Supabase is not configured. Add Supabase env vars for production."
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("titles")
    .select(
      `
      *,
      channels(name),
      production_details(*),
      activity_log(*)
    `
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return emptyDashboard(error.message);
  }

  const titles = ((data ?? []) as TitleRecord[]).map(enrichTitle);
  return buildDashboard(titles);
}

function buildDashboard(titles: EnrichedTitle[], setupWarning?: string): DashboardData {
  const operationsQueue = buildOperationsQueue(titles);
  const supervisorSummary = buildSupervisorSummary(titles);
  const completedThisWeek = titles.filter((title) => title.status === "Completed" && isThisWeek(title.lastUpdatedAt));
  const dashboard: Omit<DashboardData, "dailyReport"> = {
    setupWarning,
    titles,
    cards: [
      {
        label: "Approved Today",
        value: titles.filter((title) => isToday(title.approvedDate)).length,
        tone: "success"
      },
      {
        label: "Approved This Week",
        value: titles.filter((title) => isThisWeekDate(title.approvedDate)).length,
        tone: "neutral"
      },
      {
        label: "Not Assigned Yet",
        value: titles.filter((title) => title.supervisor === "Missing").length,
        tone: "warning"
      },
      {
        label: "Approved But Not Started",
        value: titles.filter((title) => title.status === "Approved" || title.status === "Writer Pending").length,
        tone: "neutral"
      },
      {
        label: "Missing Help Docs",
        value: titles.filter((title) => title.missingFields.includes("Help Doc")).length,
        tone: "warning"
      },
      {
        label: "Missing Writers",
        value: titles.filter((title) => title.missingFields.includes("Writer")).length,
        tone: "warning"
      },
      {
        label: "Scripts Submitted But Word Count Missing",
        value: operationsQueue.wordCountMissing.length,
        tone: "danger"
      },
      {
        label: "Critical Delays",
        value: titles.filter((title) => title.severity === "Critical").length,
        tone: "danger"
      },
      {
        label: "Urgent Titles",
        value: titles.filter((title) => title.priority === "Urgent" || title.severity === "Critical").length,
        tone: "danger"
      },
      {
        label: "Completed This Week",
        value: completedThisWeek.length,
        tone: "success"
      }
    ],
    supervisorSummary,
    operationsQueue,
    completedThisWeek,
    lastSyncAt: titles[0]?.lastUpdatedAt ?? null
  };

  return {
    ...dashboard,
    dailyReport: generateDailyReport(dashboard)
  };
}

function isToday(value: string | null) {
  if (!value) return false;
  return toIndiaDateKey(value) === toIndiaDateKey(new Date());
}

function isThisWeekDate(value: string | null) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  return date >= start;
}

function enrichTitle(record: TitleRecord): EnrichedTitle {
  const detail = firstDetail(record.production_details);
  const ageDays = calculateAgeDays(record.approved_date, record.created_at);
  const channel = record.channels?.name || record.production_sheet_tab || "Unassigned";
  const supervisor = cleanName(record.imported_supervisor_name) || "Missing";
  const writer = cleanName(record.imported_writer_name) || "Missing";
  const wordCount = detail?.word_count ?? null;
  const voArtist = cleanName(detail?.vo_artist) || null;
  const editor = cleanName(detail?.editor_text) || null;
  const proofreader = cleanName(detail?.proofreader_text) || null;
  const clipFinder = cleanName(detail?.clip_finder) || null;
  const productionStatus = cleanName(detail?.production_status) || cleanName(detail?.final_status) || null;
  const status = record.current_status || "Approved";
  const matchStatus = record.match_status || "Unmatched";
  const missingFields = getMissingFields({
    supervisor,
    writer,
    helpDocUrl: record.help_doc_url,
    wordCount,
    voArtist,
    editor,
    proofreader,
    matchStatus,
    status
  });

  const base = {
    id: record.id,
    title: record.title,
    channel,
    supervisor,
    writer,
    status,
    priority: normalizePriorityLabel(record.priority),
    expectedWordCount: record.expected_word_count ?? null,
    approvedDate: record.approved_date,
    createdDate: toIndiaDateKey(record.created_at),
    ageDays,
    ageBucket: getAgeBucket(ageDays),
    missingFields,
    lastUpdatedAt: record.updated_at,
    sourceRow: record.source_sheet_tab && record.source_row_number ? `${record.source_sheet_tab} #${record.source_row_number}` : "Missing",
    productionRow:
      record.production_sheet_tab && record.production_row_number
        ? `${record.production_sheet_tab} #${record.production_row_number}`
        : "Missing",
    matchStatus,
    wordCount,
    voArtist,
    editor,
    proofreader,
    clipFinder,
    productionStatus,
    helpDocUrl: record.help_doc_url,
    scriptDocUrl: record.script_doc_url,
    writerDueDate: record.writer_due_date,
    writerAssignedAt: record.writer_assigned_at,
    helpDocReadyAt: record.help_doc_ready_at,
    scriptSubmittedAt: record.script_submitted_at,
    blocked: Boolean(record.blocked),
    blockedReason: record.blocked_reason,
    blockedBy: record.blocked_by,
    blockedAt: record.blocked_at,
    blockedCategory: record.blocked_category,
    completedAt: record.completed_at,
    notes: record.notes,
    ahteshamDirectives: record.ahtesham_directives,
    sheetWriteBackStatus: record.sheet_write_back_status,
    sheetWriteBackAt: record.sheet_write_back_at,
    activityLog: (record.activity_log ?? []).sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    })
  };

  const alerts = generateAlerts(base);

  return {
    ...base,
    alerts,
    severity: maxSeverity(alerts.map((alert) => alert.severity)),
    nextAction: calculateNextAction(base)
  };
}

function firstDetail(details: ProductionDetail | ProductionDetail[] | null | undefined) {
  if (Array.isArray(details)) return details[0] ?? null;
  return details ?? null;
}

function getMissingFields(input: {
  supervisor: string;
  writer: string;
  helpDocUrl: string | null;
  wordCount: number | null;
  voArtist: string | null;
  editor: string | null;
  proofreader: string | null;
  matchStatus: string;
  status: string;
}) {
  const missing: string[] = [];

  if (input.supervisor === "Missing") missing.push("Supervisor");
  if (input.writer === "Missing") missing.push("Writer");
  if (!input.helpDocUrl) missing.push("Help Doc");
  if (
    !input.wordCount &&
    ["Script Submitted", "Word Count Pending", "VO Pending", "VO Assigned", "Editing Pending", "Editing In Progress", "Completed"].includes(
      input.status
    )
  ) {
    missing.push("Word Count");
  }
  if (input.wordCount && !input.voArtist) missing.push("VO");
  if (input.wordCount && !input.editor) missing.push("Editor");
  if (input.wordCount && !input.proofreader) missing.push("Proofreader");
  if (input.matchStatus === "Not Migrated") missing.push("Production Row");
  if (input.matchStatus === "Production Only") missing.push("Title Bank Row");

  return missing;
}

function buildOperationsQueue(titles: EnrichedTitle[]): OperationsQueue {
  return {
    wordCountMissing: titles.filter((title) => title.missingFields.includes("Word Count")),
    voMissing: titles.filter((title) => title.missingFields.includes("VO")),
    editorMissing: titles.filter((title) => title.missingFields.includes("Editor")),
    proofreaderMissing: titles.filter((title) => title.missingFields.includes("Proofreader")),
    notMigrated: titles.filter((title) => title.matchStatus === "Not Migrated"),
    productionOnly: titles.filter((title) => title.matchStatus === "Production Only")
  };
}

function buildSupervisorSummary(titles: EnrichedTitle[]): SupervisorSummary[] {
  const supervisors = ["Kamran", "Farhan", "Raktim"];
  return supervisors.map((name) => {
    const scoped = titles.filter((title) => title.supervisor.toLowerCase().includes(name.toLowerCase()));
    return {
      name,
      total: scoped.length,
      notStarted: scoped.filter((title) => title.status === "Approved" || title.status === "Writer Pending").length,
      missingHelpDocs: scoped.filter((title) => title.missingFields.includes("Help Doc")).length,
      missingWriters: scoped.filter((title) => title.missingFields.includes("Writer")).length,
      overdueTitles: scoped.filter((title) => title.ageDays >= 8).length,
      completedThisWeek: scoped.filter((title) => title.status === "Completed" && isThisWeek(title.lastUpdatedAt)).length,
      criticalDelays: scoped.filter((title) => title.severity === "Critical").length
    };
  });
}

function emptyDashboard(setupWarning: string): DashboardData {
  const operationsQueue: OperationsQueue = {
    wordCountMissing: [],
    voMissing: [],
    editorMissing: [],
    proofreaderMissing: [],
    notMigrated: [],
    productionOnly: []
  };

  return {
    setupWarning,
    titles: [],
    cards: [],
    supervisorSummary: [],
    operationsQueue,
    dailyReport: "Daily Marvelous Production Alert\n\nNo synced data yet.",
    completedThisWeek: [],
    lastSyncAt: null
  };
}

function cleanName(value: string | null | undefined) {
  const cleaned = String(value ?? "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function isThisWeek(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  return date >= start;
}
