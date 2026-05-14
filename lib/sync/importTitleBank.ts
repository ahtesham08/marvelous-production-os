import { getSheetValues, TITLE_BANK_SPREADSHEET_ID, TITLE_BANK_TAB } from "@/lib/googleSheets";
import { normalizeTitle } from "@/lib/titleNormalizer";
import type { TitleBankRow } from "@/lib/types";

export async function importTitleBankRows() {
  const values = await getSheetValues(TITLE_BANK_SPREADSHEET_ID, TITLE_BANK_TAB);
  const [, ...rows] = values;

  return rows
    .map<TitleBankRow | null>((row, index) => {
      const title = cell(row[0]);
      if (!title) return null;

      return {
        title,
        normalizedTitle: normalizeTitle(title),
        supervisorName: cell(row[1]) || null,
        writerName: cell(row[2]) || null,
        sourceRowNumber: index + 2
      };
    })
    .filter((row): row is TitleBankRow => Boolean(row));
}

function cell(value: unknown) {
  return String(value ?? "").trim();
}
