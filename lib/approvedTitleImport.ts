import { randomUUID } from "node:crypto";
import { createLocalFreshTitles, getLocalTitleRecords } from "@/lib/localStore";
import { FRESH_START_CHANNELS, normalizePriorityLabel, PRIORITIES } from "@/lib/sharedConstants";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import { toIndiaDateKey } from "@/lib/statusRules";
import { normalizeTitle } from "@/lib/titleNormalizer";
import type { TitleRecord, UserRecord } from "@/lib/types";

export type ApprovedImportRow = {
  title: string;
  supervisor: string;
  channel: string;
  priority: string;
  dueDate: string | null;
  writer: string | null;
  expectedWordCount: number | null;
  notes: string | null;
  importOrder: number;
  duplicateWarning?: string | null;
};

export type ApprovedImportPreviewRow = ApprovedImportRow & {
  duplicateWarning: string | null;
};

const sourceName = "Imported Approved Titles";

export function parseApprovedTitlePaste(text: string): ApprovedImportRow[] {
  const rows: ApprovedImportRow[] = [];
  let supervisor = "";

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^([A-Za-z][A-Za-z\s.'-]{1,60}):$/);
    if (heading) {
      supervisor = heading[1].trim();
      continue;
    }

    const title = line
      .replace(/^\s*(?:\d+[\).:-]|[-*•])\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!title) continue;

    rows.push(normalizeApprovedImportRow({
      title,
      supervisor,
      channel: "MV N",
      priority: "Normal",
      dueDate: null,
      writer: null,
      expectedWordCount: null,
      notes: null,
      importOrder: rows.length + 1
    }));
  }

  return rows;
}

export async function previewApprovedTitleImport(rows: ApprovedImportRow[]) {
  const normalizedRows = rows.map(normalizeApprovedImportRow).filter((row) => row.title);
  const warnings = await getDuplicateWarnings(normalizedRows);
  return normalizedRows.map((row) => ({
    ...row,
    duplicateWarning: warnings.get(row.importOrder) ?? null
  }));
}

export async function createApprovedImportedTitles(input: {
  rows: ApprovedImportRow[];
  user: UserRecord | null;
  allowDuplicates?: boolean;
}) {
  const rows = await previewApprovedTitleImport(input.rows);
  if (rows.length === 0) throw new Error("Add at least one approved title.");

  const duplicateRows = rows.filter((row) => row.duplicateWarning);
  if (duplicateRows.length > 0 && !input.allowDuplicates) {
    throw new Error("Possible duplicates detected. Remove duplicate rows or confirm duplicate creation.");
  }

  const nowBase = Date.now();
  const batchId = randomUUID();
  const approvedDate = toIndiaDateKey(new Date()) ?? new Date().toISOString().slice(0, 10);

  if (!hasSupabaseAdminConfig()) {
    return createLocalFreshTitles(
      rows.map((row, index) => ({
        title: row.title,
        channel: row.channel,
        priority: row.priority,
        supervisor: row.supervisor || null,
        writer: row.writer,
        helpDocUrl: null,
        dueDate: row.dueDate,
        notes: row.notes,
        expectedWordCount: row.expectedWordCount,
        source: sourceName,
        sourceKey: `approved-import:${batchId}:${index + 1}`,
        sourceRowNumber: index + 1,
        activityAction: "Approved title created via Import Approved Titles",
        activityValue: activityValue(row, input.user)
      }))
    );
  }

  const supabase = createSupabaseAdminClient();
  const channels = await ensureChannels();
  const created: Array<{ id: string; title: string }> = [];

  for (const [index, row] of rows.entries()) {
    const createdAt = new Date(nowBase + index).toISOString();
    const channelId = channels.get(row.channel);
    if (!channelId) throw new Error(`Unknown channel: ${row.channel}`);

    const { data, error } = await supabase
      .from("titles")
      .insert({
        title: row.title,
        normalized_title: normalizeTitle(row.title),
        channel_id: channelId,
        priority: row.priority,
        source: sourceName,
        source_key: `approved-import:${batchId}:${index + 1}`,
        source_sheet_tab: sourceName,
        source_row_number: row.importOrder,
        approved_date: approvedDate,
        approved_by: input.user?.id?.startsWith("demo-") ? null : input.user?.id ?? null,
        imported_supervisor_name: row.supervisor || null,
        imported_writer_name: row.writer,
        writer_due_date: row.dueDate,
        expected_word_count: row.expectedWordCount,
        notes: row.notes,
        current_status: "Approved",
        match_status: "Fresh Start",
        last_synced_at: null,
        created_at: createdAt,
        updated_at: createdAt
      })
      .select("id,title")
      .single();
    if (error) throw error;

    const { error: detailError } = await supabase.from("production_details").insert({
      title_id: data.id,
      production_status: "Approved",
      created_at: createdAt,
      updated_at: createdAt
    });
    if (detailError) throw detailError;

    const { error: activityError } = await supabase.from("activity_log").insert({
      title_id: data.id,
      action: "Approved title created via Import Approved Titles",
      old_value: null,
      new_value: activityValue(row, input.user),
      performed_by: input.user?.id?.startsWith("demo-") ? null : input.user?.id ?? null,
      created_at: createdAt
    });
    if (activityError) throw activityError;

    created.push(data);
  }

  return created;
}

function normalizeApprovedImportRow(row: ApprovedImportRow): ApprovedImportRow {
  return {
    title: clean(row.title) ?? "",
    supervisor: clean(row.supervisor) ?? "",
    channel: normalizeChannel(row.channel),
    priority: normalizePriorityLabel(row.priority),
    dueDate: normalizeDate(row.dueDate),
    writer: clean(row.writer),
    expectedWordCount: normalizeWordCount(row.expectedWordCount),
    notes: clean(row.notes),
    importOrder: Number.isFinite(Number(row.importOrder)) ? Number(row.importOrder) : 0,
    duplicateWarning: row.duplicateWarning ?? null
  };
}

async function getDuplicateWarnings(rows: ApprovedImportRow[]) {
  const warnings = new Map<number, string>();
  const existingTitles = await getExistingTitleRecords();
  const existing = existingTitles
    .map((title) => ({ title: title.title, normalized: title.normalized_title || normalizeTitle(title.title) }))
    .filter((item) => item.normalized);
  const seenInPaste = new Map<string, number>();

  for (const row of rows) {
    const normalized = normalizeTitle(row.title);
    const firstSeen = seenInPaste.get(normalized);
    if (firstSeen) {
      warnings.set(row.importOrder, `Duplicate inside this paste. Same as row ${firstSeen}.`);
      continue;
    }
    seenInPaste.set(normalized, row.importOrder);

    const exact = existing.find((item) => item.normalized === normalized);
    if (exact) {
      warnings.set(row.importOrder, `Exact production duplicate: ${exact.title}`);
      continue;
    }

    const similar = existing.find((item) => isSimilarNormalized(normalized, item.normalized));
    if (similar) warnings.set(row.importOrder, `Possible similar production title: ${similar.title}`);
  }

  return warnings;
}

async function getExistingTitleRecords(): Promise<Array<Pick<TitleRecord, "title" | "normalized_title">>> {
  if (!hasSupabaseAdminConfig()) {
    return (await getLocalTitleRecords()).map((title) => ({ title: title.title, normalized_title: title.normalized_title }));
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("titles").select("title,normalized_title");
  if (error) throw error;
  return (data ?? []) as Array<Pick<TitleRecord, "title" | "normalized_title">>;
}

async function ensureChannels() {
  const supabase = createSupabaseAdminClient();
  await supabase.from("channels").upsert(
    FRESH_START_CHANNELS.map((name) => ({
      name,
      sheet_tab_name: name,
      active: true,
      updated_at: new Date().toISOString()
    })),
    { onConflict: "name" }
  );

  const { data, error } = await supabase.from("channels").select("id,name");
  if (error) throw error;
  return new Map((data ?? []).map((channel) => [channel.name, channel.id]));
}

function isSimilarNormalized(a: string, b: string) {
  if (a.length < 16 || b.length < 16) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const aTokens = new Set(a.split(" ").filter((token) => token.length > 2));
  const bTokens = new Set(b.split(" ").filter((token) => token.length > 2));
  if (aTokens.size === 0 || bTokens.size === 0) return false;
  const overlap = Array.from(aTokens).filter((token) => bTokens.has(token)).length;
  const ratio = overlap / Math.max(aTokens.size, bTokens.size);
  return ratio >= 0.82;
}

function activityValue(row: ApprovedImportRow, user: UserRecord | null) {
  return [
    `Created by: ${user?.name ?? "Unknown"}`,
    `Supervisor: ${row.supervisor || "Missing"}`,
    `Priority: ${row.priority}`,
    `Channel: ${row.channel}`,
    `Import order: ${row.importOrder}`
  ].join(" | ");
}

function normalizeChannel(value: string | null | undefined) {
  const cleaned = clean(value);
  if (!cleaned) return "MV N";
  const match = FRESH_START_CHANNELS.find((channel) => channel.toLowerCase() === cleaned.toLowerCase());
  return match ?? "MV N";
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

function clean(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export const APPROVED_IMPORT_CHANNELS = FRESH_START_CHANNELS;
export const APPROVED_IMPORT_PRIORITIES = [...PRIORITIES].reverse();
