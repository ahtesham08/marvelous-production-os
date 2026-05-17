import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import type { BrainstormingSession, BrainstormingTitle, NotificationRecord, UserRecord } from "@/lib/types";

export async function createBrainstormingApprovalNotification(input: {
  brainstormingTitle: BrainstormingTitle;
  productionTitleId: string;
  session: BrainstormingSession | null;
}) {
  if (!hasSupabaseAdminConfig()) return;

  const supabase = createSupabaseAdminClient();
  const recipientName = input.brainstormingTitle.supervisor || input.brainstormingTitle.submitted_by_name;
  const recipientId = await findSupervisorUserId(recipientName, input.brainstormingTitle.submitted_by);
  if (!recipientId && !recipientName) return;

  const titleName = input.brainstormingTitle.title;
  const sessionName = input.session?.name || "Brainstorming session";
  const { error } = await supabase.from("notifications").insert({
    recipient_user_id: recipientId,
    recipient_name: recipientName,
    title_id: input.productionTitleId,
    brainstorming_title_id: input.brainstormingTitle.id,
    session_id: input.brainstormingTitle.session_id,
    type: "Brainstorming Title Approved",
    message: `${titleName} was approved in ${sessionName}.`,
    link_url: `/titles/${input.productionTitleId}`
  });

  if (error && !isMissingNotificationsTable(error)) throw error;
}

export async function getNotificationsForUser(user: UserRecord | null, limit = 20) {
  if (!hasSupabaseAdminConfig() || !user) return [];

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (user.id?.startsWith("demo-")) {
    query = query.ilike("recipient_name", user.name);
  } else {
    query = query.or(`recipient_user_id.eq.${user.id},recipient_name.ilike.${escapeFilter(user.name)}`);
  }

  const { data, error } = await query;
  if (error && isMissingNotificationsTable(error)) return getDerivedApprovalNotifications(user, limit);
  if (error) throw error;
  return (data ?? []) as NotificationRecord[];
}

export async function markNotificationRead(notificationId: string, user: UserRecord | null) {
  if (!hasSupabaseAdminConfig() || !user || notificationId.startsWith("derived-")) return;

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);

  if (user.id?.startsWith("demo-")) {
    query = query.ilike("recipient_name", user.name);
  } else {
    query = query.or(`recipient_user_id.eq.${user.id},recipient_name.ilike.${escapeFilter(user.name)}`);
  }

  const { error } = await query;
  if (error && !isMissingNotificationsTable(error)) throw error;
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
      message: `${title.title} was approved and moved to production.`,
      link_url: `/titles/${title.id}`,
      read_at: null,
      created_at: createdActivity?.created_at ?? title.created_at
    } satisfies NotificationRecord;
  });
}

async function findSupervisorUserId(name: string | null | undefined, submittedBy: string | null | undefined) {
  if (submittedBy) return submittedBy;
  const cleaned = String(name ?? "").trim();
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

function escapeFilter(value: string) {
  return String(value ?? "").replace(/,/g, "\\,");
}

function isMissingNotificationsTable(error: { message?: string; code?: string }) {
  return error.code === "42P01" || String(error.message ?? "").includes("notifications");
}
