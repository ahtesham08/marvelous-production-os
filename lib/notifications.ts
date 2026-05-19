import { getDashboardData } from "@/lib/dashboardData";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import { toIndiaDateKey } from "@/lib/statusRules";
import type { BrainstormingSession, BrainstormingTitle, EnrichedTitle, NotificationRecord, UserRecord } from "@/lib/types";

type NotificationSeverity = "Critical" | "High" | "Medium" | "Low";

type NotificationInput = {
  recipientUserId?: string | null;
  recipientName?: string | null;
  titleId?: string | null;
  brainstormingTitleId?: string | null;
  sessionId?: string | null;
  type: string;
  severity?: NotificationSeverity;
  message: string;
  linkUrl?: string | null;
  actionUrl?: string | null;
  dedupeKey?: string | null;
  relatedTitleName?: string | null;
  supervisorName?: string | null;
  dueDate?: string | null;
};

const severityRank: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3
};

const completedStatuses = new Set(["Completed", "Cancelled"]);

export async function createNotification(input: NotificationInput) {
  if (!hasSupabaseAdminConfig()) return null;
  const supabase = createSupabaseAdminClient();
  const recipientName = clean(input.recipientName);
  const recipientUserId = input.recipientUserId ?? (await findSupervisorUserId(recipientName, null));
  if (!recipientUserId && !recipientName) return null;

  if (input.dedupeKey) {
    const { data, error } = await supabase.from("notifications").select("id").eq("dedupe_key", input.dedupeKey).maybeSingle();
    if (!error && data?.id) return data;
  }

  const row = {
    recipient_user_id: recipientUserId,
    recipient_name: recipientName,
    title_id: input.titleId ?? null,
    brainstorming_title_id: input.brainstormingTitleId ?? null,
    session_id: input.sessionId ?? null,
    type: input.type,
    severity: input.severity ?? "Low",
    message: input.message,
    link_url: input.linkUrl ?? input.actionUrl ?? null,
    action_url: input.actionUrl ?? input.linkUrl ?? null,
    dedupe_key: input.dedupeKey ?? null,
    related_title_name: input.relatedTitleName ?? null,
    supervisor_name: input.supervisorName ?? recipientName,
    due_date: input.dueDate ?? null
  };

  const { data, error } = await supabase.from("notifications").insert(row).select("*").single();
  if (!error) return data as NotificationRecord;
  if (isMissingOptionalNotificationColumn(error)) {
    const fallback = {
      recipient_user_id: row.recipient_user_id,
      recipient_name: row.recipient_name,
      title_id: row.title_id,
      brainstorming_title_id: row.brainstorming_title_id,
      session_id: row.session_id,
      type: row.type,
      message: `[${row.severity}] ${row.message}`,
      link_url: row.link_url
    };
    const { data: existing } = input.dedupeKey
      ? await supabase
          .from("notifications")
          .select("id")
          .eq("type", fallback.type)
          .eq("title_id", fallback.title_id)
          .eq("recipient_name", fallback.recipient_name)
          .maybeSingle()
      : { data: null };
    if (existing?.id) return existing;
    const { data: fallbackData, error: fallbackError } = await supabase.from("notifications").insert(fallback).select("*").single();
    if (fallbackError && !isMissingNotificationsTable(fallbackError)) throw fallbackError;
    return (fallbackData as NotificationRecord | null) ?? null;
  }
  if (!isMissingNotificationsTable(error)) throw error;
  return null;
}

export async function createBrainstormingApprovalNotification(input: {
  brainstormingTitle: BrainstormingTitle;
  productionTitleId: string;
  session: BrainstormingSession | null;
}) {
  const recipientName = input.brainstormingTitle.supervisor || input.brainstormingTitle.submitted_by_name;
  const recipientId = await findSupervisorUserId(recipientName, input.brainstormingTitle.submitted_by);
  if (!recipientId && !recipientName) return;

  const titleName = input.brainstormingTitle.title;
  const sessionName = input.session?.name || "Brainstorming session";
  await createNotification({
    recipientUserId: recipientId,
    recipientName,
    titleId: input.productionTitleId,
    brainstormingTitleId: input.brainstormingTitle.id,
    sessionId: input.brainstormingTitle.session_id,
    type: "Brainstorming Title Approved",
    severity: "Low",
    message: `${titleName} was approved in ${sessionName}.`,
    linkUrl: `/titles/${input.productionTitleId}`,
    relatedTitleName: titleName,
    supervisorName: recipientName,
    dedupeKey: `brainstorming_approved:${input.brainstormingTitle.id}:${recipientId || recipientName}`
  });
}

export async function createTitleAssignedNotification(input: {
  titleId: string;
  titleName: string;
  supervisorName: string | null | undefined;
  priority?: string | null;
  assignedBy?: UserRecord | null;
}) {
  const supervisorName = clean(input.supervisorName);
  if (!supervisorName) return;
  const recipientId = await findSupervisorUserId(supervisorName, null);
  const isUltra = normalizePriority(input.priority) === "Ultra Urgent";
  await createNotification({
    recipientUserId: recipientId,
    recipientName: supervisorName,
    titleId: input.titleId,
    type: isUltra ? "Ultra Urgent Title Assigned" : "Title Assigned",
    severity: isUltra ? "High" : "Low",
    message: isUltra
      ? `Ultra Urgent title assigned to you: ${input.titleName}`
      : `${input.assignedBy?.name ?? "Admin"} assigned you a title: ${input.titleName}`,
    linkUrl: `/titles/${input.titleId}`,
    relatedTitleName: input.titleName,
    supervisorName,
    dedupeKey: `title_assigned:${input.titleId}:${recipientId || supervisorName}`
  });
}

export async function generateUserActionNotifications(user: UserRecord | null) {
  if (!hasSupabaseAdminConfig() || !user) return;
  const data = await getDashboardData();
  if (user.role === "Supervisor") {
    await generateSupervisorAttentionNotifications(user, data.titles);
  }
  if (user.role === "Admin") {
    await generateAdminAttentionNotifications(user, data.titles);
  }
}

export async function generateSupervisorAttentionNotifications(user: UserRecord, titles: EnrichedTitle[]) {
  const scoped = titles.filter((title) => samePerson(title.supervisor, user.name));
  const today = todayKey();
  for (const title of scoped) {
    if (isCompleted(title)) continue;
    await createSupervisorTitleNotification(user, title, "Production Title Created", "Low", `${title.title} is in your production queue.`, `production_created:${title.id}:${user.id}`);

    if (title.priority === "Ultra Urgent") {
      await createSupervisorTitleNotification(user, title, "Ultra Urgent Title Assigned", "High", `Ultra Urgent title assigned to you: ${title.title}`, `ultra_assigned:${title.id}:${user.id}`);
    }
    if (title.writerDueDate === today) {
      const severity = title.priority === "Ultra Urgent" ? "Critical" : title.priority === "Urgent" ? "High" : "Medium";
      await createSupervisorTitleNotification(
        user,
        title,
        title.priority === "Ultra Urgent" ? "Ultra Urgent Due Today" : "Title Due Today",
        severity,
        `${title.priority === "Ultra Urgent" ? "Ultra Urgent title" : "Title"} due today: ${title.title}`,
        `${title.priority === "Ultra Urgent" ? "ultra_urgent_due_today" : "title_due_today"}:${title.id}:${user.id}:${today}`
      );
    }
    if (isPastDate(title.writerDueDate)) {
      const severity = title.priority === "Ultra Urgent" ? "Critical" : "High";
      await createSupervisorTitleNotification(user, title, "Title Overdue", severity, `Title overdue: ${title.title}`, `title_overdue:${title.id}:${user.id}:${today}`);
    }
    if (title.missingFields.includes("Writer")) {
      await createSupervisorTitleNotification(user, title, "Missing Writer", title.priority === "Ultra Urgent" ? "Critical" : "Medium", `Writer missing for: ${title.title}`, `missing_writer:${title.id}:${user.id}`);
    }
    if (title.missingFields.includes("Help Doc")) {
      await createSupervisorTitleNotification(user, title, "Missing Help Doc", title.priority === "Urgent" || title.priority === "Ultra Urgent" ? "High" : "Medium", `Help doc missing for: ${title.title}`, `missing_help_doc:${title.id}:${user.id}`);
    }
    if (hoursSinceUpdate(title) >= 48) {
      await createSupervisorTitleNotification(user, title, "No Update In 48 Hours", "Medium", `No update in 48 hours: ${title.title}`, `stale_48h:${title.id}:${user.id}:${today}`);
    }
    if (isWaitingForAhtesham(title)) {
      await createSupervisorTitleNotification(user, title, "Waiting For Ahtesham Decision", "High", `Waiting for Ahtesham decision: ${title.title}`, `waiting_ahtesham:${title.id}:${user.id}`);
    }
    if (title.blocked) {
      await createSupervisorTitleNotification(user, title, "Blocked Title", title.priority === "Ultra Urgent" ? "Critical" : "High", `Blocked title: ${title.title}`, `blocked_title:${title.id}:${user.id}`);
    }
  }
}

export async function getUserNotifications(user: UserRecord | null, limit = 50) {
  return getNotificationsForUser(user, limit);
}

export async function getNotificationsForUser(user: UserRecord | null, limit = 50) {
  if (!hasSupabaseAdminConfig() || !user) return [];

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  query = scopeNotificationQuery(query, user);

  const { data, error } = await query;
  if (error && isMissingNotificationsTable(error)) return getDerivedApprovalNotifications(user, limit);
  if (error) throw error;
  return sortNotifications((data ?? []) as NotificationRecord[]);
}

export async function getUnreadNotificationCount(user: UserRecord | null) {
  if (!hasSupabaseAdminConfig() || !user) return 0;
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  query = scopeNotificationQuery(query, user);
  const { count, error } = await query;
  if (error && isMissingNotificationsTable(error)) return 0;
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string, user: UserRecord | null) {
  if (!hasSupabaseAdminConfig() || !user || notificationId.startsWith("derived-")) return;

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);

  query = scopeNotificationQuery(query, user);

  const { error } = await query;
  if (error && !isMissingNotificationsTable(error)) throw error;
}

export async function markAllNotificationsRead(user: UserRecord | null) {
  if (!hasSupabaseAdminConfig() || !user) return;
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  query = scopeNotificationQuery(query, user);
  const { error } = await query;
  if (error && !isMissingNotificationsTable(error)) throw error;
}

async function generateAdminAttentionNotifications(user: UserRecord, titles: EnrichedTitle[]) {
  const today = todayKey();
  for (const title of titles) {
    if (isCompleted(title)) continue;
    const shouldNotify =
      title.priority === "Ultra Urgent" ||
      title.blocked ||
      isWaitingForAhtesham(title) ||
      (title.writerDueDate === today && ["Urgent", "Ultra Urgent"].includes(title.priority)) ||
      isPastDate(title.writerDueDate);
    if (!shouldNotify) continue;
    const severity = title.priority === "Ultra Urgent" && (title.blocked || isPastDate(title.writerDueDate) || title.writerDueDate === today) ? "Critical" : "High";
    await createNotification({
      recipientUserId: user.id?.startsWith("demo-") ? null : user.id,
      recipientName: user.name,
      titleId: title.id,
      type: "Admin Attention Alert",
      severity,
      message: `${title.priority} attention needed: ${title.title}`,
      linkUrl: `/titles/${title.id}`,
      relatedTitleName: title.title,
      supervisorName: title.supervisor,
      dueDate: title.writerDueDate,
      dedupeKey: `admin_attention:${title.id}:${user.id}:${today}`
    });
  }
}

async function createSupervisorTitleNotification(
  user: UserRecord,
  title: EnrichedTitle,
  type: string,
  severity: NotificationSeverity,
  message: string,
  dedupeKey: string
) {
  await createNotification({
    recipientUserId: user.id?.startsWith("demo-") ? null : user.id,
    recipientName: user.name,
    titleId: title.id,
    type,
    severity,
    message,
    linkUrl: `/titles/${title.id}`,
    relatedTitleName: title.title,
    supervisorName: title.supervisor,
    dueDate: title.writerDueDate,
    dedupeKey
  });
}

async function getDerivedApprovalNotifications(user: UserRecord, limit: number) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("titles")
    .select("id,title,source_session_id,source_brainstorming_title_id,imported_supervisor_name,created_at,activity_log(*)")
    .eq("source", "Brainstorming")
    .ilike("imported_supervisor_name", user.name)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];

  return (data ?? []).map((title) => {
    const activities = Array.isArray(title.activity_log) ? title.activity_log : [];
    const createdActivity = activities.find((activity) => activity.action === "Created from brainstorming");
    return {
      id: `derived-${title.id}`,
      recipient_user_id: user.id?.startsWith("demo-") ? null : user.id,
      recipient_name: title.imported_supervisor_name,
      title_id: title.id,
      brainstorming_title_id: title.source_brainstorming_title_id,
      session_id: title.source_session_id,
      type: "Brainstorming Title Approved",
      severity: "Low",
      message: `${title.title} was approved and moved to production.`,
      link_url: `/titles/${title.id}`,
      action_url: `/titles/${title.id}`,
      related_title_name: title.title,
      supervisor_name: title.imported_supervisor_name,
      due_date: null,
      dedupe_key: null,
      read_at: null,
      created_at: createdActivity?.created_at ?? title.created_at
    } satisfies NotificationRecord;
  });
}

async function findSupervisorUserId(name: string | null | undefined, submittedBy: string | null | undefined) {
  if (submittedBy) return submittedBy;
  const cleaned = clean(name);
  if (!cleaned || !hasSupabaseAdminConfig()) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .ilike("name", cleaned)
    .eq("active", true)
    .maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

function scopeNotificationQuery<T extends { or: (filter: string) => T }>(query: T, user: UserRecord) {
  if (user.id?.startsWith("demo-")) return query.or(`recipient_name.ilike.${escapeFilter(user.name)}`);
  return query.or(`recipient_user_id.eq.${user.id},recipient_name.ilike.${escapeFilter(user.name)}`);
}

function sortNotifications(notifications: NotificationRecord[]) {
  return [...notifications].sort((a, b) => {
    const bySeverity = (severityRank[a.severity || "Low"] ?? 3) - (severityRank[b.severity || "Low"] ?? 3);
    if (bySeverity !== 0) return bySeverity;
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
  });
}

function isWaitingForAhtesham(title: EnrichedTitle) {
  const text = [title.status, title.nextAction, title.blockedReason, title.notes].join(" ").toLowerCase();
  return text.includes("ahtesham") || text.includes("owner") || text.includes("approval") || text.includes("decision");
}

function isCompleted(title: EnrichedTitle) {
  return completedStatuses.has(title.status);
}

function isPastDate(value: string | null) {
  if (!value) return false;
  return String(value).slice(0, 10) < todayKey();
}

function hoursSinceUpdate(title: EnrichedTitle) {
  if (!title.lastUpdatedAt) return title.ageDays * 24;
  const updated = new Date(title.lastUpdatedAt).getTime();
  if (!Number.isFinite(updated)) return title.ageDays * 24;
  return Math.max(0, (Date.now() - updated) / 3_600_000);
}

function todayKey() {
  return toIndiaDateKey(new Date()) ?? new Date().toISOString().slice(0, 10);
}

function samePerson(value: string, name: string) {
  return value.toLowerCase().includes(name.toLowerCase());
}

function normalizePriority(value: string | null | undefined) {
  const cleaned = String(value ?? "").trim().toLowerCase();
  if (cleaned === "ultra urgent") return "Ultra Urgent";
  if (cleaned === "urgent") return "Urgent";
  if (cleaned === "low") return "Low";
  return "Normal";
}

function escapeFilter(value: string) {
  return String(value ?? "").replace(/,/g, "\\,");
}

function clean(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function isMissingOptionalNotificationColumn(error: { message?: string; code?: string }) {
  const message = String(error.message ?? "");
  return error.code === "42703" || message.includes("severity") || message.includes("dedupe_key") || message.includes("action_url");
}

function isMissingNotificationsTable(error: { message?: string; code?: string }) {
  return error.code === "42P01" || String(error.message ?? "").includes("notifications");
}
