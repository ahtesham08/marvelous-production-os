import { getSheetValues, PRODUCTION_SPREADSHEET_ID, PRODUCTION_TABS } from "@/lib/googleSheets";
import { normalizeTitle } from "@/lib/titleNormalizer";
import type { ProductionRow } from "@/lib/types";

const headerAliases = {
  title: ["script", "title", "video title"],
  wordCount: ["word count", "words", "wc"],
  writer: ["writer", "writer name"],
  vo: ["voice over", "vo", "voiceover"],
  clipFinder: ["clip finders", "clip finder", "clips", "clip"],
  editor: ["editor", "video editor"],
  proofreader: ["proofreader", "proof reader", "proof"]
};

export async function importProductionRows() {
  const allRows: ProductionRow[] = [];

  for (const tabName of PRODUCTION_TABS) {
    const values = await getSheetValues(PRODUCTION_SPREADSHEET_ID, tabName);
    if (values.length === 0) continue;

    const headerIndex = detectHeaderRow(values);
    if (headerIndex === -1) continue;

    const headers = values[headerIndex].map((value) => normalizeHeader(value));
    const indexes = {
      title: findHeaderIndex(headers, headerAliases.title),
      wordCount: findHeaderIndex(headers, headerAliases.wordCount),
      writer: findHeaderIndex(headers, headerAliases.writer),
      vo: findHeaderIndex(headers, headerAliases.vo),
      clipFinder: findHeaderIndex(headers, headerAliases.clipFinder),
      editor: findHeaderIndex(headers, headerAliases.editor),
      proofreader: findHeaderIndex(headers, headerAliases.proofreader)
    };

    if (indexes.title === -1) continue;

    for (let i = headerIndex + 1; i < values.length; i += 1) {
      const row = values[i];
      const title = cell(row[indexes.title]);
      if (!title) continue;

      allRows.push({
        title,
        normalizedTitle: normalizeTitle(title),
        channelName: tabName,
        sourceRowNumber: i + 1,
        wordCount: parseWordCount(cell(row[indexes.wordCount])),
        writerName: cell(row[indexes.writer]) || null,
        voArtist: cell(row[indexes.vo]) || null,
        clipFinder: cell(row[indexes.clipFinder]) || null,
        editorName: cell(row[indexes.editor]) || null,
        proofreaderName: cell(row[indexes.proofreader]) || null
      });
    }
  }

  return allRows;
}

function detectHeaderRow(values: unknown[][]) {
  return values.findIndex((row) => {
    const normalized = row.map((value) => normalizeHeader(value));
    return (
      normalized.some((value) => headerAliases.title.includes(value)) &&
      normalized.some((value) => headerAliases.writer.includes(value) || headerAliases.wordCount.includes(value))
    );
  });
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

function parseWordCount(value: string) {
  const numeric = value.replace(/,/g, "").match(/\d+/)?.[0];
  return numeric ? Number(numeric) : null;
}

function cell(value: unknown) {
  return String(value ?? "").trim();
}
