import { findBestMatch } from "@/lib/fuzzyMatch";
import type { ProductionRow, TitleBankRow } from "@/lib/types";

export type MatchedProductionRow = {
  productionRow: ProductionRow;
  titleBankRow: TitleBankRow | null;
  matchStatus: "Matched" | "Fuzzy Matched" | "Needs Review" | "Production Only";
  score: number;
};

export function matchProductionRows(titleBankRows: TitleBankRow[], productionRows: ProductionRow[]) {
  const exactMap = new Map(titleBankRows.map((row) => [row.normalizedTitle, row]));

  return productionRows.map<MatchedProductionRow>((productionRow) => {
    const exact = exactMap.get(productionRow.normalizedTitle);
    if (exact) {
      return { productionRow, titleBankRow: exact, matchStatus: "Matched", score: 1 };
    }

    const best = findBestMatch(productionRow.normalizedTitle, titleBankRows);
    if (best && best.score >= 0.9) {
      return {
        productionRow,
        titleBankRow: best.item,
        matchStatus: "Fuzzy Matched",
        score: best.score
      };
    }

    if (best && best.score >= 0.75) {
      return {
        productionRow,
        titleBankRow: best.item,
        matchStatus: "Needs Review",
        score: best.score
      };
    }

    return {
      productionRow,
      titleBankRow: null,
      matchStatus: "Production Only",
      score: best?.score ?? 0
    };
  });
}
