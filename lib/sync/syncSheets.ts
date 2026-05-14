import {
  PRODUCTION_SPREADSHEET_ID,
  TITLE_BANK_SPREADSHEET_ID,
  TITLE_BANK_TAB
} from "@/lib/googleSheets";
import { createSupabaseAdminClient } from "@/lib/supabaseServer";
import { importProductionRows } from "@/lib/sync/importProductionSheet";
import { importTitleBankRows } from "@/lib/sync/importTitleBank";
import { matchProductionRows } from "@/lib/sync/matchTitles";
import type { ProductionRow, TitleBankRow } from "@/lib/types";

export async function syncGoogleSheets() {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const [titleBankRows, productionRows] = await Promise.all([importTitleBankRows(), importProductionRows()]);
  const channels = await ensureChannels(productionRows.map((row) => row.channelName));
  const matchedRows = matchProductionRows(titleBankRows, productionRows);

  for (const bankRow of titleBankRows) {
    const sourceKey = titleBankSourceKey(bankRow);
    const { data, error } = await supabase
      .from("titles")
      .upsert(
        {
          title: bankRow.title,
          normalized_title: bankRow.normalizedTitle,
          source: "Title Bank",
          imported_supervisor_name: bankRow.supervisorName,
          imported_writer_name: bankRow.writerName,
          current_status: bankRow.writerName ? "Writer Assigned" : "Writer Pending",
          match_status: "Not Migrated",
          source_key: sourceKey,
          source_sheet_id: TITLE_BANK_SPREADSHEET_ID,
          source_sheet_tab: TITLE_BANK_TAB,
          source_row_number: bankRow.sourceRowNumber,
          last_synced_at: now,
          updated_at: now
        },
        { onConflict: "source_key" }
      )
      .select("id")
      .single();

    if (error) throw error;
    if (!data?.id) {
      throw new Error(`Unable to upsert title bank row ${bankRow.sourceRowNumber}.`);
    }
  }

  for (const match of matchedRows) {
    const production = match.productionRow;
    const channelId = channels.get(production.channelName) ?? null;
    const matchedBankRow = match.matchStatus === "Needs Review" ? null : match.titleBankRow;
    const sourceKey = matchedBankRow ? titleBankSourceKey(matchedBankRow) : productionSourceKey(production);

    const titlePayload = matchedBankRow
      ? {
          title: matchedBankRow.title,
          normalized_title: matchedBankRow.normalizedTitle,
          source: "Title Bank",
          imported_supervisor_name: matchedBankRow.supervisorName,
          imported_writer_name: matchedBankRow.writerName || production.writerName,
          current_status: inferStatus(matchedBankRow.writerName || production.writerName, production.wordCount),
          source_sheet_id: TITLE_BANK_SPREADSHEET_ID,
          source_sheet_tab: TITLE_BANK_TAB,
          source_row_number: matchedBankRow.sourceRowNumber
        }
      : {
          title: production.title,
          normalized_title: production.normalizedTitle,
          source: "Production Sheet",
          imported_supervisor_name: null,
          imported_writer_name: production.writerName,
          current_status: inferStatus(production.writerName, production.wordCount),
          source_sheet_id: null,
          source_sheet_tab: null,
          source_row_number: null
        };

    const { data, error } = await supabase
      .from("titles")
      .upsert(
        {
          ...titlePayload,
          channel_id: channelId,
          match_status: match.matchStatus,
          source_key: sourceKey,
          production_sheet_id: PRODUCTION_SPREADSHEET_ID,
          production_sheet_tab: production.channelName,
          production_row_number: production.sourceRowNumber,
          last_synced_at: now,
          updated_at: now
        },
        { onConflict: "source_key" }
      )
      .select("id")
      .single();

    if (error) throw error;
    if (!data?.id) {
      throw new Error(`Unable to upsert production row ${production.channelName} #${production.sourceRowNumber}.`);
    }

    await upsertProductionDetails(data.id, production, now);
  }

  return {
    titleBankRows: titleBankRows.length,
    productionRows: productionRows.length,
    matchedRows: matchedRows.filter((row) => row.matchStatus === "Matched" || row.matchStatus === "Fuzzy Matched")
      .length,
    needsReviewRows: matchedRows.filter((row) => row.matchStatus === "Needs Review").length,
    productionOnlyRows: matchedRows.filter((row) => row.matchStatus === "Production Only").length,
    syncedAt: now
  };
}

async function ensureChannels(channelNames: string[]) {
  const supabase = createSupabaseAdminClient();
  const uniqueNames = Array.from(new Set(channelNames));

  if (uniqueNames.length > 0) {
    const { error } = await supabase.from("channels").upsert(
      uniqueNames.map((name) => ({
        name,
        sheet_tab_name: name,
        active: true,
        updated_at: new Date().toISOString()
      })),
      { onConflict: "name" }
    );

    if (error) throw error;
  }

  const { data, error } = await supabase.from("channels").select("id,name");
  if (error) throw error;

  return new Map((data ?? []).map((channel) => [channel.name, channel.id]));
}

async function upsertProductionDetails(titleId: string, production: ProductionRow, now: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("production_details").upsert(
    {
      title_id: titleId,
      word_count: production.wordCount,
      clip_finder: production.clipFinder,
      proofreader_text: production.proofreaderName,
      vo_artist: production.voArtist,
      editor_text: production.editorName,
      proofreading_status: production.proofreaderName ? "Proofreading Done" : "Proofreading Pending",
      vo_status: production.voArtist ? "VO Assigned" : "VO Pending",
      editing_status: production.editorName ? "Editing In Progress" : "Editing Pending",
      final_status: null,
      updated_at: now
    },
    { onConflict: "title_id" }
  );

  if (error) throw error;
}

function inferStatus(writerName: string | null, wordCount: number | null) {
  if (wordCount) return "Script Submitted";
  if (writerName) return "Writer Assigned";
  return "Writer Pending";
}

function titleBankSourceKey(row: TitleBankRow) {
  return `title-bank:${TITLE_BANK_TAB}:${row.sourceRowNumber}`;
}

function productionSourceKey(row: ProductionRow) {
  return `production:${row.channelName}:${row.sourceRowNumber}`;
}
