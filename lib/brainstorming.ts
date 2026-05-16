import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import { normalizeTitle } from "@/lib/titleNormalizer";
import { FRESH_START_CHANNELS, normalizePriorityLabel } from "@/lib/sharedConstants";
import { createBrainstormingApprovalNotification } from "@/lib/notifications";
import { toIndiaDateKey } from "@/lib/statusRules";
import type {
  BrainstormingDiscussionNote,
  BrainstormingSession,
  BrainstormingSummary,
  BrainstormingTitle,
  BrainstormingTitleStatus,
  UserRecord
} from "@/lib/types";

export type BrainstormingSessionInput = {
  name: string;
  sessionDate: string;
  channels: string[];
  participants: string[];
  notes?: string | null;
  status?: string;
};

const defaultSessionChannels = [...FRESH_START_CHANNELS];
const defaultSessionParticipants = ["Ahtesham", "Kamran", "Farhan", "Raktim"];
const sessionTimezone = "Asia/Kolkata";

export type BrainstormingTitleInput = {
  sessionId?: string | null;
  title: string;
  channel?: string | null;
  priority?: string | null;
  urgency?: string | null;
  dueDate?: string | null;
  expectedWordCount?: number | string | null;
  holdUntilDate?: string | null;
  supervisor?: string | null;
  shortPitch?: string | null;
  whyGood?: string | null;
  referenceLinks?: string | null;
  suggestedWriter?: string | null;
  notes?: string | null;
};

export type WhatsAppImportRow = BrainstormingTitleInput & {
  duplicateWarning?: string | null;
};

type BrainstormingStore = {
  sessions: BrainstormingSession[];
  titles: BrainstormingTitle[];
  notes: BrainstormingDiscussionNote[];
};

const storePath = path.join(process.cwd(), ".data", "brainstorming-store.json");

export async function getBrainstormingSummary(): Promise<BrainstormingSummary> {
  await ensureDailyBrainstormingSession();
  const today = getSessionDateParts(new Date()).date;
  const [sessions, titles] = await Promise.all([getBrainstormingSessions(), getBrainstormingTitles()]);
  return {
    todaySessions: sessions.filter((session) => session.session_date === today && session.status !== "Archived").length,
    pendingProposed: titles.filter((title) => title.status === "Proposed").length,
    approvedNotConverted: titles.filter((title) => title.status === "Approved" && !title.converted_title_id).length,
    needsBetterAngle: titles.filter((title) => title.status === "Needs Better Angle").length,
    needsResearch: titles.filter((title) => title.status === "Needs Research").length
  };
}

export async function getBrainstormingSessions() {
  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    return store.sessions.sort(sortSessions);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brainstorming_sessions")
    .select("*")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error && isMissingBrainstormingTable(error)) return [];
  if (error) throw error;
  return (data ?? []) as BrainstormingSession[];
}

export async function getBrainstormingSessionsWithDailyEnsure() {
  await ensureDailyBrainstormingSession();
  return getBrainstormingSessions();
}

export async function getBrainstormingSession(sessionId: string) {
  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    return store.sessions.find((session) => session.id === sessionId) ?? null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("brainstorming_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (error && isMissingBrainstormingTable(error)) return null;
  if (error) throw error;
  return data as BrainstormingSession | null;
}

export async function createBrainstormingSession(input: BrainstormingSessionInput, user: UserRecord | null) {
  const now = new Date().toISOString();
  const record = {
    name: clean(input.name) || "Brainstorming Session",
    session_date: input.sessionDate || now.slice(0, 10),
    channels: normalizeList(input.channels),
    participants: normalizeList(input.participants),
    notes: clean(input.notes),
    status: input.status || "Draft",
    created_by: user?.id?.startsWith("demo-") ? null : user?.id ?? null,
    created_by_name: user?.name ?? "Ahtesham",
    updated_at: now
  };

  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    const session: BrainstormingSession = { id: randomUUID(), created_at: now, ...record };
    store.sessions.unshift(session);
    await writeBrainstormingStore(store);
    return session;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("brainstorming_sessions").insert(record).select("*").single();
  if (error) throw error;
  return data as BrainstormingSession;
}

export async function ensureDailyBrainstormingSession(date = new Date()) {
  const today = getSessionDateParts(date);
  if (today.weekday === "Sunday") {
    return { created: false, skipped: true, reason: "Sunday", session: null };
  }

  const existing = (await getBrainstormingSessions()).find(
    (session) => session.session_date === today.date && session.status !== "Archived"
  );
  if (existing) {
    return { created: false, skipped: false, reason: "Already exists", session: existing };
  }

  const session = await createBrainstormingSession(
    {
      name: `Brainstorming ${today.date}`,
      sessionDate: today.date,
      channels: defaultSessionChannels,
      participants: defaultSessionParticipants,
      notes: "Auto-created daily brainstorming session.",
      status: "Draft"
    },
    null
  );
  return { created: true, skipped: false, reason: "Created", session };
}

export async function updateBrainstormingSessionStatus(sessionId: string, status: string) {
  const now = new Date().toISOString();
  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    store.sessions = store.sessions.map((session) => (session.id === sessionId ? { ...session, status, updated_at: now } : session));
    await writeBrainstormingStore(store);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("brainstorming_sessions").update({ status, updated_at: now }).eq("id", sessionId);
  if (error) throw error;
}

export async function updateBrainstormingSession(sessionId: string, input: Partial<BrainstormingSessionInput>) {
  const existing = await getBrainstormingSession(sessionId);
  if (!existing) throw new Error("Brainstorming session not found.");

  const now = new Date().toISOString();
  const patch = {
    name: clean(input.name) ?? existing.name,
    session_date: normalizeDate(input.sessionDate) ?? existing.session_date,
    channels: input.channels ? normalizeList(input.channels) : existing.channels,
    participants: input.participants ? normalizeList(input.participants) : existing.participants,
    notes: clean(input.notes) ?? existing.notes,
    status: clean(input.status) ?? existing.status,
    updated_at: now
  };

  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    store.sessions = store.sessions.map((session) => (session.id === sessionId ? { ...session, ...patch } : session));
    await writeBrainstormingStore(store);
    return store.sessions.find((session) => session.id === sessionId) ?? null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brainstorming_sessions")
    .update(patch)
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error) throw error;
  return data as BrainstormingSession;
}

export async function getBrainstormingTitles(options: { sessionId?: string; status?: string; includeResurfaced?: boolean } = {}) {
  const today = getSessionDateParts(new Date()).date;
  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    return attachNotes(store.titles, store.notes)
      .filter((title) => {
        if (!options.sessionId) return true;
        if (title.session_id === options.sessionId) return true;
        return Boolean(options.includeResurfaced && title.status === "Hold" && title.hold_until_date && title.hold_until_date <= today);
      })
      .filter((title) => !options.status || title.status === options.status)
      .sort(sortTitles);
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("brainstorming_titles")
    .select("*, brainstorming_discussion_notes(*)")
    .order("created_at", { ascending: false });
  if (options.sessionId && !options.includeResurfaced) query = query.eq("session_id", options.sessionId);
  if (options.status) query = query.eq("status", options.status);
  const { data, error } = await query;
  if (error && isMissingBrainstormingTable(error)) return [];
  if (error) throw error;
  return ((data ?? []) as BrainstormingTitle[])
    .filter((title) => {
      if (!options.sessionId) return true;
      if (title.session_id === options.sessionId) return true;
      return Boolean(options.includeResurfaced && title.status === "Hold" && title.hold_until_date && title.hold_until_date <= today);
    });
}

export async function getBrainstormingTitle(titleId: string) {
  const titles = await getBrainstormingTitles();
  return titles.find((title) => title.id === titleId) ?? null;
}

export async function createBrainstormingTitle(input: BrainstormingTitleInput, user: UserRecord | null) {
  const [created] = await createBrainstormingTitles([input], user);
  return created;
}

export async function createBrainstormingTitles(inputs: BrainstormingTitleInput[], user: UserRecord | null) {
  const now = new Date().toISOString();
  const cleanInputs = inputs.map(normalizeBrainstormingInput).filter((input) => input.title);
  if (cleanInputs.length === 0) throw new Error("Add at least one title idea.");

  const warnings = await getDuplicateWarnings(cleanInputs.map((input) => input.title));

  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    const created = cleanInputs.map((input) => toLocalBrainstormingTitle(input, user, now, warnings.get(normalizeTitle(input.title))));
    store.titles = [...created, ...store.titles];
    await writeBrainstormingStore(store);
    return created;
  }

  const supabase = createSupabaseAdminClient();
  const rows = cleanInputs.map((input) => {
    const normalized = normalizeTitle(input.title);
    return {
      session_id: input.sessionId || null,
      title: input.title,
      normalized_title: normalized,
      channel: input.channel,
      priority: input.priority,
      urgency: input.urgency,
      approved_due_date: input.dueDate,
      expected_word_count: input.expectedWordCount,
      hold_until_date: input.holdUntilDate,
      submitted_by: user?.id?.startsWith("demo-") ? null : user?.id ?? null,
      submitted_by_name: user?.name ?? input.supervisor,
      supervisor: input.supervisor || user?.name || null,
      short_pitch: input.shortPitch,
      why_good: input.whyGood,
      reference_links: input.referenceLinks,
      suggested_writer: input.suggestedWriter,
      notes: input.notes,
      status: "Proposed",
      duplicate_warning: warnings.get(normalized) ?? null,
      updated_at: now
    };
  });

  const { data, error } = await supabase.from("brainstorming_titles").insert(rows).select("*");
  if (error) throw error;
  return (data ?? []) as BrainstormingTitle[];
}

export async function previewWhatsAppImport(text: string, sessionId?: string | null) {
  const rows = parseWhatsAppTitles(text).map((row) => ({ ...row, sessionId: sessionId || null }));
  const warnings = await getDuplicateWarnings(rows.map((row) => row.title));
  return rows.map((row) => ({ ...row, duplicateWarning: warnings.get(normalizeTitle(row.title)) ?? null }));
}

export function parseWhatsAppTitles(text: string): WhatsAppImportRow[] {
  const rows: WhatsAppImportRow[] = [];
  let supervisor = "";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^([A-Za-z][A-Za-z\s.'-]{1,40}):$/);
    if (heading) {
      supervisor = heading[1].trim();
      continue;
    }

    const title = line
      .replace(/^\s*(?:\d+[\).:-]|[-*•])\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!title) continue;
    rows.push({
      title,
      supervisor,
      channel: "MV N",
      priority: "Normal",
      notes: rawLine.trim()
    });
  }
  return rows;
}

export async function decideBrainstormingTitle(
  titleId: string,
  decision: string,
  reason: string | null,
  user: UserRecord | null,
  options: { urgency?: string | null; dueDate?: string | null } = {}
) {
  const now = new Date().toISOString();
  const status = decisionToStatus(decision);
  const urgency = normalizePriority(options.urgency);
  const dueDate = normalizeDate(options.dueDate);
  const patch = {
    status,
    decision_status: status,
    decision_reason: clean(reason),
    ...(status === "Approved" ? { priority: urgency, urgency, approved_due_date: dueDate } : {}),
    decided_by: user?.id?.startsWith("demo-") ? null : user?.id ?? null,
    decided_by_name: user?.name ?? "Ahtesham",
    decided_at: now,
    updated_at: now
  };

  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    store.titles = store.titles.map((title) => (title.id === titleId ? { ...title, ...patch } : title));
    await writeBrainstormingStore(store);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("brainstorming_titles").update(patch).eq("id", titleId);
  if (error) throw error;
}

export async function updateBrainstormingTitleApprovalFields(
  titleId: string,
  input: { urgency?: string | null; dueDate?: string | null; expectedWordCount?: unknown; holdUntilDate?: string | null }
) {
  const now = new Date().toISOString();
  const patch = {
    ...(input.urgency !== undefined ? { urgency: normalizePriority(input.urgency), priority: normalizePriority(input.urgency) } : {}),
    ...(input.dueDate !== undefined ? { approved_due_date: normalizeDate(input.dueDate) } : {}),
    ...(input.expectedWordCount !== undefined ? { expected_word_count: normalizeWordCount(input.expectedWordCount) } : {}),
    ...(input.holdUntilDate !== undefined ? { hold_until_date: normalizeDate(input.holdUntilDate) } : {}),
    updated_at: now
  };

  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    store.titles = store.titles.map((title) => (title.id === titleId ? { ...title, ...patch } : title));
    await writeBrainstormingStore(store);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("brainstorming_titles").update(patch).eq("id", titleId);
  if (error) throw error;
}

export async function addBrainstormingNote(titleId: string, noteText: string, user: UserRecord | null) {
  const text = clean(noteText);
  if (!text) throw new Error("Add a note first.");
  const now = new Date().toISOString();
  const note = {
    brainstorming_title_id: titleId,
    note_text: text,
    author_id: user?.id?.startsWith("demo-") ? null : user?.id ?? null,
    author_name: user?.name ?? "Team",
    created_at: now
  };

  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    store.notes.unshift({ id: randomUUID(), ...note });
    await writeBrainstormingStore(store);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("brainstorming_discussion_notes").insert(note);
  if (error) throw error;
}

export async function updateBrainstormingTitleNotes(titleId: string, ahteshamNotes: string | null, discussionSummary: string | null) {
  const now = new Date().toISOString();
  const patch = { ahtesham_notes: clean(ahteshamNotes), discussion_summary: clean(discussionSummary), updated_at: now };
  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    store.titles = store.titles.map((title) => (title.id === titleId ? { ...title, ...patch } : title));
    await writeBrainstormingStore(store);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("brainstorming_titles").update(patch).eq("id", titleId);
  if (error) throw error;
}

export async function updateBrainstormingProposal(titleId: string, input: Partial<BrainstormingTitleInput>) {
  const existing = await getBrainstormingTitle(titleId);
  if (!existing) throw new Error("Brainstorming title not found.");

  const now = new Date().toISOString();
  const normalized = input.title ? normalizeTitle(input.title) : existing.normalized_title;
  const patch = {
    title: clean(input.title) ?? existing.title,
    normalized_title: normalized,
    channel: input.channel ? normalizeChannel(input.channel) : existing.channel,
    priority: input.priority ? normalizePriority(input.priority) : existing.priority,
    short_pitch: clean(input.shortPitch) ?? existing.short_pitch,
    why_good: clean(input.whyGood) ?? existing.why_good,
    reference_links: clean(input.referenceLinks) ?? existing.reference_links,
    suggested_writer: clean(input.suggestedWriter) ?? existing.suggested_writer,
    notes: clean(input.notes) ?? existing.notes,
    expected_word_count:
      input.expectedWordCount !== undefined ? normalizeWordCount(input.expectedWordCount) : existing.expected_word_count,
    updated_at: now
  };

  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    store.titles = store.titles.map((title) => (title.id === titleId ? { ...title, ...patch } : title));
    await writeBrainstormingStore(store);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("brainstorming_titles").update(patch).eq("id", titleId);
  if (error) throw error;

  if (existing.converted_title_id && input.title) {
    const { error: titleError } = await supabase
      .from("titles")
      .update({ title: patch.title, normalized_title: patch.normalized_title, updated_at: now })
      .eq("id", existing.converted_title_id);
    if (titleError) throw titleError;
    await supabase.from("activity_log").insert({
      title_id: existing.converted_title_id,
      action: "Updated title",
      old_value: existing.title,
      new_value: patch.title
    });
  }
}

export async function convertBrainstormingTitle(titleId: string, user: UserRecord | null) {
  const title = await getBrainstormingTitle(titleId);
  if (!title) throw new Error("Brainstorming title not found.");
  if (title.converted_title_id) return { id: title.converted_title_id, title: title.title };
  if (title.status !== "Approved") throw new Error("Only approved brainstorming titles can be converted.");

  const now = new Date().toISOString();
  const approvedDate = toIndiaDateKey(new Date()) ?? now.slice(0, 10);

  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    const convertedId = randomUUID();
    store.titles = store.titles.map((item) =>
      item.id === titleId
        ? { ...item, status: "Converted To Production", converted_title_id: convertedId, converted_at: now, updated_at: now }
        : item
    );
    await writeBrainstormingStore(store);
    return { id: convertedId, title: title.title };
  }

  const supabase = createSupabaseAdminClient();
  const session = title.session_id ? await getBrainstormingSession(title.session_id) : null;
  const channelId = await ensureChannelId(title.channel || "MV N");
  const { data, error } = await supabase
    .from("titles")
    .insert({
      title: title.title,
      normalized_title: normalizeTitle(title.title),
      channel_id: channelId,
      priority: title.urgency || title.priority || "Normal",
      source: "Brainstorming",
      source_session_id: title.session_id,
      source_brainstorming_title_id: title.id,
      approved_date: approvedDate,
      approved_by: user?.id?.startsWith("demo-") ? null : user?.id ?? null,
      imported_supervisor_name: title.supervisor || title.submitted_by_name,
      imported_writer_name: title.suggested_writer,
      writer_due_date: title.approved_due_date,
      expected_word_count: title.expected_word_count,
      ahtesham_directives: title.ahtesham_notes,
      notes: title.notes,
      current_status: "Approved",
      match_status: "Fresh Start",
      created_at: now,
      updated_at: now
    })
    .select("id,title")
    .single();
  if (error) throw error;

  const { error: detailError } = await supabase.from("production_details").insert({
    title_id: data.id,
    production_status: "Approved",
    created_at: now,
    updated_at: now
  });
  if (detailError) throw detailError;

  await supabase.from("activity_log").insert({
    title_id: data.id,
    action: "Created from brainstorming",
    old_value: null,
    new_value: title.title,
    performed_by: user?.id?.startsWith("demo-") ? null : user?.id ?? null
  });

  const { error: updateError } = await supabase
    .from("brainstorming_titles")
    .update({ status: "Converted To Production", converted_title_id: data.id, converted_at: now, updated_at: now })
    .eq("id", title.id);
  if (updateError) throw updateError;

  await createBrainstormingApprovalNotification({
    brainstormingTitle: title,
    productionTitleId: data.id,
    session
  });

  return data;
}

async function getDuplicateWarnings(titles: string[]) {
  const normalized = titles.map(normalizeTitle).filter(Boolean);
  const warnings = new Map<string, string>();
  if (normalized.length === 0) return warnings;

  if (!hasSupabaseAdminConfig()) {
    const store = await readBrainstormingStore();
    const brainstormingSet = new Set(store.titles.map((title) => title.normalized_title).filter(Boolean));
    for (const value of normalized) {
      if (brainstormingSet.has(value)) warnings.set(value, "Possible duplicate in brainstorming title bank.");
    }
    return warnings;
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: brainstorming }, { data: production }] = await Promise.all([
    supabase.from("brainstorming_titles").select("normalized_title").in("normalized_title", normalized),
    supabase.from("titles").select("normalized_title").in("normalized_title", normalized)
  ]);

  const brainstormingSet = new Set((brainstorming ?? []).map((item) => item.normalized_title));
  const productionSet = new Set((production ?? []).map((item) => item.normalized_title));
  for (const value of normalized) {
    if (productionSet.has(value)) warnings.set(value, "Possible duplicate in production titles.");
    else if (brainstormingSet.has(value)) warnings.set(value, "Possible duplicate in brainstorming title bank.");
  }
  return warnings;
}

async function ensureChannelId(channel: string) {
  const supabase = createSupabaseAdminClient();
  const name = normalizeChannel(channel);
  await supabase.from("channels").upsert({ name, sheet_tab_name: name, active: true, updated_at: new Date().toISOString() }, { onConflict: "name" });
  const { data, error } = await supabase.from("channels").select("id").eq("name", name).single();
  if (error) throw error;
  return data.id as string;
}

function normalizeBrainstormingInput(input: BrainstormingTitleInput) {
  return {
    sessionId: clean(input.sessionId),
    title: clean(input.title) || "",
    channel: normalizeChannel(input.channel),
    priority: normalizePriority(input.priority),
    urgency: normalizePriority(input.urgency || input.priority),
    dueDate: normalizeDate(input.dueDate),
    expectedWordCount: normalizeWordCount(input.expectedWordCount),
    holdUntilDate: normalizeDate(input.holdUntilDate),
    supervisor: clean(input.supervisor),
    shortPitch: clean(input.shortPitch),
    whyGood: clean(input.whyGood),
    referenceLinks: clean(input.referenceLinks),
    suggestedWriter: clean(input.suggestedWriter),
    notes: clean(input.notes)
  };
}

function toLocalBrainstormingTitle(
  input: ReturnType<typeof normalizeBrainstormingInput>,
  user: UserRecord | null,
  now: string,
  duplicateWarning?: string | null
): BrainstormingTitle {
  return {
    id: randomUUID(),
    session_id: input.sessionId,
    title: input.title,
    normalized_title: normalizeTitle(input.title),
    channel: input.channel,
    priority: input.priority,
    urgency: input.urgency,
    approved_due_date: input.dueDate,
    expected_word_count: input.expectedWordCount,
    hold_until_date: input.holdUntilDate,
    submitted_by: null,
    submitted_by_name: user?.name ?? input.supervisor,
    supervisor: input.supervisor || user?.name || null,
    short_pitch: input.shortPitch,
    why_good: input.whyGood,
    reference_links: input.referenceLinks,
    suggested_writer: input.suggestedWriter,
    notes: input.notes,
    ahtesham_notes: null,
    discussion_summary: null,
    status: "Proposed",
    decision_status: null,
    decision_reason: null,
    decided_by: null,
    decided_by_name: null,
    decided_at: null,
    converted_title_id: null,
    converted_at: null,
    duplicate_warning: duplicateWarning ?? null,
    created_at: now,
    updated_at: now,
    brainstorming_discussion_notes: []
  };
}

function decisionToStatus(decision: string): BrainstormingTitleStatus {
  if (decision === "Approve") return "Approved";
  if (decision === "Reject") return "Rejected";
  return decision as BrainstormingTitleStatus;
}

function normalizeChannel(value: string | null | undefined) {
  const cleaned = clean(value);
  const match = FRESH_START_CHANNELS.find((channel) => channel.toLowerCase() === String(cleaned ?? "").toLowerCase());
  return match ?? "MV N";
}

function normalizePriority(value: string | null | undefined) {
  const cleaned = clean(value);
  if (String(cleaned ?? "").toLowerCase() === "high") return "Urgent";
  return normalizePriorityLabel(cleaned);
}

function normalizeDate(value: string | null | undefined) {
  const cleaned = clean(value);
  if (!cleaned) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
}

function normalizeWordCount(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : null;
}

function getSessionDateParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: sessionTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long"
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: parts.weekday
  };
}

function normalizeList(values: string[]) {
  return values.map((value) => clean(value)).filter((value): value is string => Boolean(value));
}

function attachNotes(titles: BrainstormingTitle[], notes: BrainstormingDiscussionNote[]) {
  return titles.map((title) => ({
    ...title,
    brainstorming_discussion_notes: notes.filter((note) => note.brainstorming_title_id === title.id)
  }));
}

function sortSessions(a: BrainstormingSession, b: BrainstormingSession) {
  return `${b.session_date}${b.created_at}`.localeCompare(`${a.session_date}${a.created_at}`);
}

function sortTitles(a: BrainstormingTitle, b: BrainstormingTitle) {
  return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
}

function clean(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

async function readBrainstormingStore(): Promise<BrainstormingStore> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<BrainstormingStore>;
    return { sessions: parsed.sessions ?? [], titles: parsed.titles ?? [], notes: parsed.notes ?? [] };
  } catch {
    return { sessions: [], titles: [], notes: [] };
  }
}

async function writeBrainstormingStore(store: BrainstormingStore) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function isMissingBrainstormingTable(error: { message?: string; code?: string }) {
  return error.code === "42P01" || String(error.message ?? "").includes("brainstorming_");
}
