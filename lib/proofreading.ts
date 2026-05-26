import { getEnrichedTitleById } from "@/lib/dashboardData";
import { createNotification } from "@/lib/notifications";
export { PROOFREADING_BLOCK_CATEGORIES, PROOFREADING_STATUSES, SCRIPT_QUALITY_RATINGS } from "@/lib/proofreadingConstants";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import type { EnrichedTitle, ProofreadingMessage, ProofreadingReview, UserRecord } from "@/lib/types";

const bucketName = "proofreading-feedback";

export async function getProofreadingBundle(titleId: string) {
  if (!hasSupabaseAdminConfig()) return emptyBundle(titleId);
  const supabase = createSupabaseAdminClient();
  const [reviewResult, thread] = await Promise.all([getReview(titleId), ensureThread(titleId)]);
  if (!thread) return { review: reviewResult, messages: [] };

  const { data, error } = await supabase
    .from("proofreading_messages")
    .select("*")
    .eq("thread_id", thread.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (isMissingProofreadingTable(error)) return emptyBundle(titleId);
  if (error) throw error;
  return {
    review: reviewResult,
    messages: (data ?? []) as ProofreadingMessage[]
  };
}

export async function getReview(titleId: string) {
  if (!hasSupabaseAdminConfig()) return null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("proofreading_reviews").select("*").eq("title_id", titleId).maybeSingle();
  if (isMissingProofreadingTable(error)) return null;
  if (error) throw error;
  return data as ProofreadingReview | null;
}

export async function addProofreadingMessage(input: {
  titleId: string;
  user: UserRecord | null;
  messageText: string;
  attachment?: File | null;
}) {
  const title = await requireProofreadingAccess(input.titleId, input.user, "message");
  const thread = await ensureThread(input.titleId);
  if (!thread) throw new Error("Proofreading tables are not ready. Run migration 010.");
  const attachment = input.attachment ? await uploadAttachment(input.titleId, input.attachment) : null;
  const message = await insertMessage({
    threadId: thread.id,
    titleId: input.titleId,
    user: input.user,
    messageText: input.messageText,
    attachmentUrl: attachment?.url ?? null,
    attachmentType: attachment?.type ?? null
  });
  await touchReview(input.titleId, {
    latest_feedback: input.user?.role === "Proofreader" ? input.messageText : undefined,
    latest_supervisor_response: input.user?.role === "Supervisor" ? input.messageText : undefined,
    proofreading_status: input.user?.role === "Proofreader" ? "Feedback Given" : undefined,
    proofreader_name: title.proofreader || input.user?.name || undefined,
    proofreader_id: input.user?.role === "Proofreader" ? input.user.id : undefined
  });
  return message;
}

export async function blockScript(input: {
  titleId: string;
  user: UserRecord | null;
  blockCategory: string;
  blockReason: string;
  detailedFeedback: string;
  whatNeedsFixing: string;
  scriptQualityRating?: string | null;
  attachment?: File | null;
}) {
  const title = await requireProofreadingAccess(input.titleId, input.user, "proofreader-action");
  if (!input.blockCategory || !input.blockReason || !input.detailedFeedback || !input.whatNeedsFixing) {
    throw new Error("Block category, reason, detailed feedback, and what needs fixing are required.");
  }

  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const thread = await ensureThread(input.titleId);
  if (!thread) throw new Error("Proofreading tables are not ready. Run migration 010.");

  const review = await touchReview(input.titleId, {
    proofreader_id: input.user?.id,
    proofreader_name: input.user?.name ?? title.proofreader,
    proofreading_status: "Blocked By Proofreader",
    script_quality_rating: input.scriptQualityRating || null,
    latest_feedback: input.detailedFeedback,
    is_blocked: true,
    blocked_at: now,
    blocked_by: input.user?.id,
    blocked_by_name: input.user?.name,
    block_category: input.blockCategory,
    block_reason: input.blockReason,
    what_needs_fixing: input.whatNeedsFixing
  });

  await supabase.from("titles").update({
    blocked: true,
    blocked_category: "Script quality issue",
    blocked_reason: `Blocked by proofreader: ${input.blockReason}`,
    blocked_by: input.user?.name ?? "Proofreader",
    blocked_at: now,
    updated_at: now
  }).eq("id", input.titleId);

  const attachment = input.attachment ? await uploadAttachment(input.titleId, input.attachment) : null;
  await insertMessage({
    threadId: thread.id,
    titleId: input.titleId,
    user: input.user,
    messageText: `DO NOT MOVE AHEAD - Blocked by proofreader\nCategory: ${input.blockCategory}\nReason: ${input.blockReason}\nFeedback: ${input.detailedFeedback}\nNeeds fixing: ${input.whatNeedsFixing}`,
    attachmentUrl: attachment?.url ?? null,
    attachmentType: attachment?.type ?? null
  });
  await insertActivity(input.titleId, "Proofreader blocked script", null, `${input.blockCategory}: ${input.blockReason}`, input.user);
  await supabase.from("proofreading_block_cycles").insert({
    title_id: input.titleId,
    proofreader_id: input.user?.id?.startsWith("demo-") ? null : input.user?.id ?? null,
    proofreader_name: input.user?.name ?? title.proofreader,
    supervisor_name: title.supervisor,
    block_category: input.blockCategory,
    block_reason: input.blockReason,
    proofreader_feedback: input.detailedFeedback,
    what_needs_fixing: input.whatNeedsFixing
  });
  await notifySupervisor(title, input.user, input.blockCategory, input.blockReason);
  return review;
}

export async function submitSupervisorFix(input: {
  titleId: string;
  user: UserRecord | null;
  response: string;
  correctedBySupervisor: boolean;
  sentBackForRewrite: boolean;
  changesMade: string;
  readyForRecheck: boolean;
}) {
  const title = await requireProofreadingAccess(input.titleId, input.user, "supervisor-action");
  if (!input.response || !input.changesMade) throw new Error("Fix response and changes made are required.");
  const status = input.readyForRecheck ? "Ready For Recheck" : "Fixed By Supervisor";
  const text = [
    "Supervisor fix response",
    `What was fixed: ${input.response}`,
    `Corrected by supervisor: ${input.correctedBySupervisor ? "Yes" : "No"}`,
    `Sent back for rewrite: ${input.sentBackForRewrite ? "Yes" : "No"}`,
    `Changes made: ${input.changesMade}`,
    `Ready for recheck: ${input.readyForRecheck ? "Yes" : "No"}`
  ].join("\n");

  const thread = await ensureThread(input.titleId);
  if (!thread) throw new Error("Proofreading tables are not ready. Run migration 010.");
  const review = await touchReview(input.titleId, {
    proofreading_status: status,
    latest_supervisor_response: text,
    is_blocked: !input.readyForRecheck
  });
  await insertMessage({ threadId: thread.id, titleId: input.titleId, user: input.user, messageText: text });
  await updateLatestBlockCycle(input.titleId, {
    supervisor_fix_response: text,
    supervisor_fixed_at: new Date().toISOString(),
    recheck_status: status
  });
  await insertActivity(input.titleId, "Supervisor submitted proofreading fix", null, status, input.user);
  await notifyProofreader(title, input.user, `${title.title} is ${status}.`);
  return review;
}

export async function recheckProofreading(input: {
  titleId: string;
  user: UserRecord | null;
  action: "approve" | "request_changes";
  message: string;
}) {
  const title = await requireProofreadingAccess(input.titleId, input.user, "proofreader-action");
  const status = input.action === "approve" ? "Approved By Proofreader" : "Changes Requested";
  const text = input.message || (input.action === "approve" ? "Approved after fix." : "More changes requested.");
  const thread = await ensureThread(input.titleId);
  if (!thread) throw new Error("Proofreading tables are not ready. Run migration 010.");
  const review = await touchReview(input.titleId, {
    proofreading_status: status,
    latest_feedback: text,
    is_blocked: input.action !== "approve"
  });

  if (input.action === "approve") {
    const supabase = createSupabaseAdminClient();
    await supabase.from("titles").update({
      blocked: false,
      blocked_category: null,
      blocked_reason: null,
      blocked_by: null,
      blocked_at: null,
      updated_at: new Date().toISOString()
    }).eq("id", input.titleId);
  }

  await insertMessage({ threadId: thread.id, titleId: input.titleId, user: input.user, messageText: text });
  await updateLatestBlockCycle(input.titleId, {
    recheck_status: status,
    final_resolution: input.action === "approve" ? "Approved after fix" : "More changes requested"
  });
  await insertActivity(input.titleId, `Proofreader ${input.action === "approve" ? "approved after fix" : "requested more changes"}`, null, status, input.user);
  await notifySupervisor(title, input.user, status, text);
  return review;
}

export function canUseProofreading(title: EnrichedTitle, user: UserRecord | null) {
  if (!user) return false;
  if (user.role === "Admin" || user.role === "Operations Supervisor") return true;
  if (user.role === "Supervisor") return samePerson(title.supervisor, user.name);
  if (user.role === "Proofreader") return samePerson(title.proofreader || "", user.name);
  return false;
}

function canActAsProofreader(title: EnrichedTitle, user: UserRecord | null) {
  return Boolean(user && (user.role === "Admin" || (user.role === "Proofreader" && samePerson(title.proofreader || "", user.name))));
}

function canActAsSupervisor(title: EnrichedTitle, user: UserRecord | null) {
  return Boolean(user && (user.role === "Admin" || (user.role === "Supervisor" && samePerson(title.supervisor, user.name))));
}

async function requireProofreadingAccess(titleId: string, user: UserRecord | null, action: "message" | "proofreader-action" | "supervisor-action") {
  if (!hasSupabaseAdminConfig()) throw new Error("Proofreading requires Supabase.");
  const title = await getEnrichedTitleById(titleId);
  if (!title) throw new Error("Title not found.");
  if (action === "proofreader-action" && !canActAsProofreader(title, user)) throw new Error("Only the assigned proofreader or Admin can do this.");
  if (action === "supervisor-action" && !canActAsSupervisor(title, user)) throw new Error("Only the assigned supervisor or Admin can do this.");
  if (action === "message" && !canUseProofreading(title, user)) throw new Error("You do not have access to this proofreading conversation.");
  return title;
}

async function ensureThread(titleId: string) {
  if (!hasSupabaseAdminConfig()) return null;
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase.from("proofreading_threads").select("*").eq("title_id", titleId).maybeSingle();
  if (isMissingProofreadingTable(existingError)) return null;
  if (existingError) throw existingError;
  if (existing) return existing as { id: string; title_id: string };
  const { data, error } = await supabase.from("proofreading_threads").insert({ title_id: titleId }).select("*").single();
  if (isMissingProofreadingTable(error)) return null;
  if (error) throw error;
  return data as { id: string; title_id: string };
}

async function touchReview(titleId: string, patch: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  const payload = removeUndefined({ title_id: titleId, ...patch, updated_at: new Date().toISOString() });
  const { data, error } = await supabase
    .from("proofreading_reviews")
    .upsert(payload, { onConflict: "title_id" })
    .select("*")
    .single();
  if (isMissingProofreadingTable(error)) throw new Error("Proofreading tables are not ready. Run migration 010.");
  if (error) throw error;
  return data as ProofreadingReview;
}

async function insertMessage(input: {
  threadId: string;
  titleId: string;
  user: UserRecord | null;
  messageText: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("proofreading_messages").insert({
    thread_id: input.threadId,
    title_id: input.titleId,
    sender_id: input.user?.id?.startsWith("demo-") ? null : input.user?.id ?? null,
    sender_name: input.user?.name ?? "Unknown",
    sender_role: input.user?.role ?? "Viewer",
    message_text: input.messageText,
    attachment_url: input.attachmentUrl ?? null,
    attachment_type: input.attachmentType ?? null
  }).select("*").single();
  if (error) throw error;
  await supabase.from("proofreading_threads").update({ updated_at: new Date().toISOString() }).eq("id", input.threadId);
  return data as ProofreadingMessage;
}

async function uploadAttachment(titleId: string, file: File) {
  if (!file.type.startsWith("image/") || !["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
    throw new Error("Only PNG, JPG, JPEG, or WEBP images are allowed.");
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5MB or smaller.");
  const supabase = createSupabaseAdminClient();
  const extension = file.name.split(".").pop() || "png";
  const path = `${titleId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error } = await supabase.storage.from(bucketName).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return { url: data.publicUrl, type: file.type };
}

async function insertActivity(titleId: string, action: string, oldValue: string | null, newValue: string | null, user: UserRecord | null) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("activity_log").insert({
    title_id: titleId,
    action,
    old_value: oldValue,
    new_value: newValue,
    performed_by: user?.id?.startsWith("demo-") ? null : user?.id ?? null
  });
}

async function updateLatestBlockCycle(titleId: string, patch: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("proofreading_block_cycles")
    .select("id")
    .eq("title_id", titleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.id) return;
  await supabase.from("proofreading_block_cycles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", data.id);
}

async function notifySupervisor(title: EnrichedTitle, proofreader: UserRecord | null, category: string, reason: string) {
  await createNotification({
    recipientName: title.supervisor,
    titleId: title.id,
    type: "Proofreader Block",
    severity: title.priority === "Ultra Urgent" ? "Critical" : title.priority === "Urgent" ? "High" : "Medium",
    message: `Your title has been blocked by ${proofreader?.name ?? title.proofreader ?? "proofreader"}. Reason: ${category}. ${reason}`,
    linkUrl: `/titles/${title.id}`,
    relatedTitleName: title.title,
    supervisorName: title.supervisor,
    dedupeKey: `proofreader_block:${title.id}:${Date.now()}`
  });
}

async function notifyProofreader(title: EnrichedTitle, supervisor: UserRecord | null, message: string) {
  await createNotification({
    recipientName: title.proofreader,
    titleId: title.id,
    type: "Proofreading Recheck Ready",
    severity: "Medium",
    message: `${supervisor?.name ?? title.supervisor} responded on ${title.title}. ${message}`,
    linkUrl: `/titles/${title.id}`,
    relatedTitleName: title.title,
    supervisorName: title.supervisor,
    dedupeKey: `proofreading_recheck:${title.id}:${Date.now()}`
  });
}

function emptyBundle(_titleId: string) {
  return { review: null, messages: [] as ProofreadingMessage[] };
}

function isMissingProofreadingTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "42P01" || message.includes("proofreading_") || message.includes("schema cache");
}

function samePerson(value: string, name: string) {
  return value.toLowerCase().includes(name.toLowerCase());
}

function removeUndefined(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
