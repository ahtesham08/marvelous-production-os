import { columnToA1, getSheetValues, PRODUCTION_SPREADSHEET_ID, updateSheetValues } from "@/lib/googleSheets";
import { isProductionMode } from "@/lib/appMode";
import { deleteLocalTitleRecords, getLocalTitleRecord, updateLocalTitleRecord } from "@/lib/localStore";
import { STATUS_VALUES } from "@/lib/statusRules";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";
import { normalizeTitle } from "@/lib/titleNormalizer";
import { FRESH_START_CHANNELS, normalizePriorityLabel } from "@/lib/sharedConstants";
import { createTitleAssignedNotification } from "@/lib/notifications";
import type { ProductionDetail, TitleRecord, UserRecord } from "@/lib/types";

export type TitleUpdatePayload = {
  title?: string | null;
  channel?: string | null;
  priority?: string | null;
  imported_supervisor_name?: string | null;
  imported_writer_name?: string | null;
  expected_word_count?: number | string | null;
  ahtesham_directives?: string | null;
  help_doc_url?: string | null;
  script_doc_url?: string | null;
  writer_due_date?: string | null;
  current_status?: string | null;
  notes?: string | null;
  blocked?: boolean;
  blocked_reason?: string | null;
  blocked_by?: string | null;
  blocked_category?: string | null;
  manual_script_submitted?: boolean;
  production?: {
    word_count?: number | null;
    vo_artist?: string | null;
    clip_finder?: string | null;
    editor_text?: string | null;
    proofreader_text?: string | null;
    production_status?: string | null;
  };
  write_back?: boolean;
};

type Change = {
  field: string;
  oldValue: string | null;
  newValue: string | null;
};

const productionHeaderAliases: Record<string, string[]> = {
  word_count: ["word count", "words", "wc"],
  vo_artist: ["voice over", "vo", "voiceover"],
  editor_text: ["editor", "video editor"],
  proofreader_text: ["proofreader", "proof reader", "proof"],
  imported_writer_name: ["writer", "writer name"]
};

const titleBankHeaderAliases: Record<string, string[]> = {
  imported_supervisor_name: ["script maker", "supervisor"],
  imported_writer_name: ["writer name", "writer"]
};

export async function updateTitle(titleId: string, payload: TitleUpdatePayload, user: UserRecord | null = null) {
  const existing = await getTitleRecord(titleId);
  const existingDetail = firstDetail(existing.production_details);
  const now = new Date().toISOString();
  const channelUpdate = "channel" in payload ? await resolveChannelUpdate(payload.channel) : null;

  const titlePatch = buildTitlePatch(payload, existing, existingDetail, now, channelUpdate);
  const productionPatch = buildProductionPatch(payload, existingDetail);

  validateTitleUpdate({ ...existing, ...titlePatch }, { ...existingDetail, ...productionPatch }, payload);

  const changes = collectTitleChanges(existing, titlePatch);
  changes.push(...collectProductionChanges(existingDetail, productionPatch));
  if (channelUpdate && channelUpdate.channelName !== getRecordChannel(existing)) {
    changes.push({ field: "channel", oldValue: getRecordChannel(existing), newValue: channelUpdate.channelName });
  }

  if (!hasSupabaseAdminConfig()) {
    if (isProductionMode()) {
      throw new Error("Production mode requires Supabase. Add Supabase environment variables before updating titles.");
    }
    await updateLocalTitleRecord(titleId, titlePatch, productionPatch, changes);
    return { changes, writeBackResult: null };
  }

  const supabase = createSupabaseAdminClient();

  if (Object.keys(titlePatch).length > 0) {
    const { error } = await supabase.from("titles").update(titlePatch).eq("id", titleId);
    if (error) throw error;
  }

  if (Object.keys(productionPatch).length > 0) {
    const { error } = await supabase.from("production_details").upsert(
      {
        title_id: titleId,
        ...productionPatch,
        updated_at: now
      },
      { onConflict: "title_id" }
    );
    if (error) throw error;
  }

  if (changes.length > 0) {
    const { error } = await supabase.from("activity_log").insert(
      changes.map((change) => ({
        title_id: titleId,
        action: `Updated ${change.field}`,
        old_value: change.oldValue,
        new_value: change.newValue
      }))
    );
    if (error) throw error;
  }

  if (
    titlePatch.imported_supervisor_name &&
    titlePatch.imported_supervisor_name !== existing.imported_supervisor_name
  ) {
    await createTitleAssignedNotification({
      titleId,
      titleName: titlePatch.title ?? existing.title,
      supervisorName: titlePatch.imported_supervisor_name,
      priority: titlePatch.priority ?? existing.priority,
      assignedBy: user
    });
  }

  let writeBackResult: Awaited<ReturnType<typeof writeTitleBackToSheets>> | null = null;
  if (payload.write_back && process.env.GOOGLE_SHEETS_WRITEBACK_MODE === "enabled") {
    const updated = await getTitleRecord(titleId);
    writeBackResult = await writeTitleBackToSheets(updated);
  }

  return {
    changes,
    writeBackResult
  };
}

export async function deleteTitles(titleIds: string[], user: UserRecord | null) {
  const ids = Array.from(new Set(titleIds.filter(Boolean)));
  if (ids.length === 0) throw new Error("Select at least one title to delete.");

  const records = await Promise.all(ids.map((id) => getTitleRecord(id)));
  const unauthorized = records.filter((record) => !canDeleteTitleRecord(record, user));
  if (unauthorized.length > 0) {
    throw new Error("You do not have permission to delete one or more selected titles.");
  }

  if (!hasSupabaseAdminConfig()) {
    if (isProductionMode()) {
      throw new Error("Production mode requires Supabase. Add Supabase environment variables before deleting titles.");
    }
    await deleteLocalTitleRecords(ids);
    return { deletedCount: ids.length };
  }

  const supabase = createSupabaseAdminClient();
  const { error: clearBrainstormingError } = await supabase
    .from("brainstorming_titles")
    .update({ converted_title_id: null, converted_at: null, updated_at: new Date().toISOString() })
    .in("converted_title_id", ids);
  if (clearBrainstormingError && !isMissingBrainstormingTable(clearBrainstormingError)) throw clearBrainstormingError;

  const { error } = await supabase.from("titles").delete().in("id", ids);
  if (error) throw error;
  return { deletedCount: ids.length };
}

export async function getTitleRecord(titleId: string) {
  if (!hasSupabaseAdminConfig()) {
    return getLocalTitleRecord(titleId);
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
    .eq("id", titleId)
    .single();

  if (error) throw error;
  return data as TitleRecord;
}

export async function writeTitleBackToSheets(record: TitleRecord) {
  if (process.env.GOOGLE_SHEETS_WRITEBACK_MODE !== "enabled") {
    throw new Error("Google Sheets write-back is disabled. Old sheets are archive/reference only.");
  }

  const detail = firstDetail(record.production_details);
  const updatedFields: string[] = [];
  const skippedFields: string[] = [];

  if (record.source_sheet_id && record.source_sheet_tab && record.source_row_number) {
    const titleBankRows = await getSheetValues(record.source_sheet_id, record.source_sheet_tab);
    await updateKnownRowFields({
      spreadsheetId: record.source_sheet_id,
      tabName: record.source_sheet_tab,
      rowNumber: record.source_row_number,
      headers: titleBankRows[0] ?? [],
      fieldValues: {
        imported_supervisor_name: record.imported_supervisor_name,
        imported_writer_name: record.imported_writer_name
      },
      aliases: titleBankHeaderAliases,
      updatedFields,
      skippedFields
    });
  }

  if (record.production_sheet_tab && record.production_row_number) {
    const productionRows = await getSheetValues(PRODUCTION_SPREADSHEET_ID, record.production_sheet_tab);
    const headerIndex = detectHeaderRow(productionRows);

    if (headerIndex >= 0) {
      await updateKnownRowFields({
        spreadsheetId: PRODUCTION_SPREADSHEET_ID,
        tabName: record.production_sheet_tab,
        rowNumber: record.production_row_number,
        headers: productionRows[headerIndex] ?? [],
        fieldValues: {
          imported_writer_name: record.imported_writer_name,
          word_count: detail?.word_count ?? null,
          vo_artist: detail?.vo_artist ?? null,
          editor_text: detail?.editor_text ?? null,
          proofreader_text: detail?.proofreader_text ?? null
        },
        aliases: productionHeaderAliases,
        updatedFields,
        skippedFields
      });
    } else {
      skippedFields.push("production headers");
    }
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("titles")
    .update({
      sheet_write_back_status: skippedFields.length > 0 ? `Updated with skipped fields: ${skippedFields.join(", ")}` : "Updated",
      sheet_write_back_at: now,
      updated_at: now
    })
    .eq("id", record.id);
  if (error) throw error;

  return {
    updatedFields,
    skippedFields
  };
}

function buildTitlePatch(
  payload: TitleUpdatePayload,
  existing: TitleRecord,
  existingDetail: ProductionDetail | null,
  now: string,
  channelUpdate: { channelId: string | null; channelName: string } | null
) {
  const patch: Partial<TitleRecord> = {};

  if ("title" in payload) {
    const nextTitle = normalizeString(payload.title);
    if (nextTitle) {
      patch.title = nextTitle;
      patch.normalized_title = normalizeTitle(nextTitle);
    }
  }
  if ("priority" in payload) patch.priority = normalizePriorityLabel(payload.priority);
  if (channelUpdate) {
    if (hasSupabaseAdminConfig()) patch.channel_id = channelUpdate.channelId;
    else patch.channels = { name: channelUpdate.channelName };
  }
  if ("imported_supervisor_name" in payload) patch.imported_supervisor_name = normalizeString(payload.imported_supervisor_name);
  if ("imported_writer_name" in payload) patch.imported_writer_name = normalizeString(payload.imported_writer_name);
  if ("expected_word_count" in payload) patch.expected_word_count = normalizeWordCount(payload.expected_word_count);
  if ("ahtesham_directives" in payload) patch.ahtesham_directives = normalizeString(payload.ahtesham_directives);
  if ("help_doc_url" in payload) patch.help_doc_url = normalizeString(payload.help_doc_url);
  if ("script_doc_url" in payload) patch.script_doc_url = normalizeString(payload.script_doc_url);
  if ("writer_due_date" in payload) patch.writer_due_date = normalizeString(payload.writer_due_date);
  if ("current_status" in payload) patch.current_status = normalizeString(payload.current_status);
  if ("notes" in payload) patch.notes = normalizeString(payload.notes);
  if ("blocked" in payload) patch.blocked = Boolean(payload.blocked);
  if ("blocked_reason" in payload) patch.blocked_reason = normalizeString(payload.blocked_reason);
  if ("blocked_by" in payload) patch.blocked_by = normalizeString(payload.blocked_by);
  if ("blocked_category" in payload) patch.blocked_category = normalizeString(payload.blocked_category);
  if (payload.blocked && !existing.blocked) patch.blocked_at = now;
  if (payload.blocked === false) {
    patch.blocked_at = null;
    patch.blocked_category = null;
    patch.blocked_by = null;
    patch.blocked_reason = null;
  }

  if (payload.current_status === "Help Doc Ready" && payload.help_doc_url) patch.help_doc_ready_at = now;
  if (payload.imported_writer_name && payload.imported_writer_name !== existing.imported_writer_name) {
    patch.writer_assigned_at = now;
  }
  if (payload.current_status === "Script Submitted" && (payload.script_doc_url || payload.manual_script_submitted)) {
    patch.script_submitted_at = now;
  }

  const finalStatus = patch.current_status ?? existing.current_status;
  const writerName = patch.imported_writer_name ?? existing.imported_writer_name;
  const wordCount = payload.production?.word_count ?? existingDetail?.word_count;
  const voArtist = payload.production?.vo_artist ?? existingDetail?.vo_artist;
  const editor = payload.production?.editor_text ?? existingDetail?.editor_text;
  const proofreader = payload.production?.proofreader_text ?? existingDetail?.proofreader_text;

  if (finalStatus !== existing.current_status || writerName !== existing.imported_writer_name || wordCount !== existingDetail?.word_count) {
    patch.updated_at = now;
  }
  if (channelUpdate && channelUpdate.channelName !== getRecordChannel(existing)) patch.updated_at = now;

  if (
    finalStatus === "Completed" &&
    writerName &&
    wordCount &&
    voArtist &&
    editor &&
    proofreader
  ) {
    patch.updated_at = now;
    patch.completed_at = existing.completed_at ?? now;
  }

  return removeUndefined(patch);
}

function buildProductionPatch(payload: TitleUpdatePayload, existingDetail: ProductionDetail | null) {
  const patch: Partial<ProductionDetail> = {};
  if (!payload.production) return patch;

  for (const field of ["word_count", "vo_artist", "clip_finder", "editor_text", "proofreader_text", "production_status"] as const) {
    if (field in payload.production) {
      const value = payload.production[field];
      if (field === "word_count") patch.word_count = normalizeWordCount(value);
      if (field === "vo_artist") patch.vo_artist = normalizeString(value);
      if (field === "clip_finder") patch.clip_finder = normalizeString(value);
      if (field === "editor_text") patch.editor_text = normalizeString(value);
      if (field === "proofreader_text") patch.proofreader_text = normalizeString(value);
      if (field === "production_status") patch.production_status = normalizeString(value);
    }
  }

  if (patch.word_count && !existingDetail?.word_count) patch.final_status = existingDetail?.final_status ?? null;
  if (patch.vo_artist) patch.vo_status = "VO Assigned";
  if (patch.editor_text) patch.editing_status = "Editing In Progress";
  if (patch.proofreader_text) patch.proofreading_status = "Proofreading Done";
  if (patch.production_status) patch.final_status = patch.production_status;

  return removeUndefined(patch);
}

function validateTitleUpdate(title: Partial<TitleRecord>, detail: Partial<ProductionDetail>, payload: TitleUpdatePayload) {
  const status = title.current_status ?? "Approved";
  const supervisor = clean(title.imported_supervisor_name);
  const writer = clean(title.imported_writer_name);
  const scriptDoc = clean(title.script_doc_url);
  const wordCount = detail.word_count ?? null;
  const voArtist = clean(detail.vo_artist);
  const editor = clean(detail.editor_text);
  const proofreader = clean(detail.proofreader_text);

  if (!STATUS_VALUES.includes(status as never)) {
    throw new Error("Unknown status value.");
  }

  if (title.blocked && !clean(title.blocked_reason)) {
    throw new Error("Blocked titles need a blocked reason.");
  }

  if (["Writer Assigned", "Script In Progress", "Script Submitted", "Completed"].includes(status) && !supervisor) {
    throw new Error("A supervisor is required before writer or script progress.");
  }

  if (["Script In Progress", "Script Submitted", "Completed"].includes(status) && !writer) {
    throw new Error("A writer is required before script progress.");
  }

  if (status === "Help Doc Ready" && !clean(title.help_doc_url)) {
    throw new Error("Help Doc Ready requires a help doc URL.");
  }

  if (status === "Script Submitted" && !scriptDoc && !payload.manual_script_submitted) {
    throw new Error("Script Submitted requires a script doc URL or manual confirmation.");
  }

  if (status === "VO Pending" && !wordCount) {
    throw new Error("VO Pending requires word count.");
  }

  if (status === "Completed" && (!writer || !wordCount || !voArtist || !editor || !proofreader)) {
    throw new Error("Completed requires writer, word count, VO, editor, and proofreader.");
  }
}

async function updateKnownRowFields(input: {
  spreadsheetId: string;
  tabName: string;
  rowNumber: number;
  headers: unknown[];
  fieldValues: Record<string, string | number | null | undefined>;
  aliases: Record<string, string[]>;
  updatedFields: string[];
  skippedFields: string[];
}) {
  for (const [field, value] of Object.entries(input.fieldValues)) {
    const normalizedValue = value ?? "";
    const columnIndex = findHeaderIndex(input.headers, input.aliases[field] ?? []);

    if (columnIndex === -1) {
      input.skippedFields.push(field);
      continue;
    }

    const column = columnToA1(columnIndex);
    await updateSheetValues(input.spreadsheetId, `'${input.tabName}'!${column}${input.rowNumber}`, [[normalizedValue]]);
    input.updatedFields.push(field);
  }
}

function detectHeaderRow(rows: unknown[][]) {
  return rows.findIndex((row) => {
    const normalized = row.map(normalizeHeader);
    return normalized.includes("script") && (normalized.includes("writer") || normalized.includes("word count"));
  });
}

function findHeaderIndex(headers: unknown[], aliases: string[]) {
  const normalizedHeaders = headers.map(normalizeHeader);
  return normalizedHeaders.findIndex((header) => aliases.includes(header));
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectTitleChanges(existing: TitleRecord, patch: Partial<TitleRecord>) {
  return Object.entries(patch)
    .filter(([field]) => !["updated_at", "channel_id", "channels"].includes(field))
    .filter(([field, value]) => stringify(existing[field as keyof TitleRecord]) !== stringify(value))
    .map(([field, value]) => ({
      field,
      oldValue: stringify(existing[field as keyof TitleRecord]),
      newValue: stringify(value)
    }));
}

function collectProductionChanges(existing: ProductionDetail | null, patch: Partial<ProductionDetail>) {
  return Object.entries(patch)
    .filter(([field]) => !["updated_at"].includes(field))
    .filter(([field, value]) => stringify(existing?.[field as keyof ProductionDetail]) !== stringify(value))
    .map(([field, value]) => ({
      field,
      oldValue: stringify(existing?.[field as keyof ProductionDetail]),
      newValue: stringify(value)
    }));
}

function firstDetail(details: ProductionDetail | ProductionDetail[] | null | undefined) {
  if (Array.isArray(details)) return details[0] ?? null;
  return details ?? null;
}

function normalizeWordCount(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return value === null || value === undefined ? null : String(value);
}

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

async function resolveChannelUpdate(value: string | null | undefined) {
  const channelName = normalizeChannel(value);
  if (!hasSupabaseAdminConfig()) return { channelId: null, channelName };
  return { channelId: await ensureChannelId(channelName), channelName };
}

async function ensureChannelId(channelName: string) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("channels")
    .upsert({ name: channelName, sheet_tab_name: channelName, active: true, updated_at: new Date().toISOString() }, { onConflict: "name" });
  const { data, error } = await supabase.from("channels").select("id").eq("name", channelName).single();
  if (error) throw error;
  return data.id as string;
}

function normalizeChannel(value: string | null | undefined) {
  const cleaned = normalizeString(value);
  const match = FRESH_START_CHANNELS.find((channel) => channel.toLowerCase() === String(cleaned ?? "").toLowerCase());
  return match ?? "MV N";
}

function getRecordChannel(record: TitleRecord) {
  return record.channels?.name || record.production_sheet_tab || "Unassigned";
}

function canDeleteTitleRecord(record: TitleRecord, user: UserRecord | null) {
  if (!user) return false;
  if (user.role === "Admin") return true;
  if (user.role !== "Supervisor") return false;
  const supervisor = clean(record.imported_supervisor_name);
  return Boolean(supervisor && supervisor.toLowerCase() === user.name.toLowerCase());
}

function isMissingBrainstormingTable(error: { message?: string; code?: string }) {
  return error.code === "42P01" || String(error.message ?? "").includes("brainstorming_");
}

function stringify(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function removeUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}
