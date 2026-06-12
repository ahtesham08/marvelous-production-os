import type { EnrichedTitle } from "@/lib/types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with"
]);

type TokenMatch = {
  score: number;
  matched: boolean;
};

export function titleSearchScore(title: EnrichedTitle, rawQuery: string) {
  const query = normalizeSearchText(rawQuery);
  if (!query) return 1;

  const titleText = normalizeSearchText(title.title);
  const metadataText = normalizeSearchText(
    [
      title.channel,
      title.supervisor,
      title.writer,
      title.priority,
      title.status,
      title.expectedWordCount,
      title.wordCount,
      title.voArtist,
      title.editor,
      title.proofreader,
      title.matchStatus,
      title.proofreadingStatus,
      title.missingFields.join(" ")
    ].join(" ")
  );
  const allText = `${titleText} ${metadataText}`.trim();
  const queryTokens = meaningfulTokens(query);
  const titleTokens = tokenize(titleText);
  const allTokens = tokenize(allText);

  if (titleText === query) return 1000;
  if (titleText.startsWith(query)) return 900 + query.length;
  if (titleText.includes(query)) return 800 + query.length;
  if (allText.includes(query)) return 520 + query.length;

  if (queryTokens.length === 0) {
    return allText.includes(query) && query.length >= 3 ? 180 : 0;
  }

  let score = 0;
  let matched = 0;
  for (const token of queryTokens) {
    const titleMatch = bestTokenMatch(token, titleTokens);
    const allMatch = titleMatch.matched ? titleMatch : bestTokenMatch(token, allTokens);
    if (allMatch.matched) {
      matched += 1;
      score += allMatch.score;
    }
  }

  const requiredMatches = queryTokens.length === 1 ? 1 : Math.max(2, Math.ceil(queryTokens.length * 0.6));
  if (matched < requiredMatches) return 0;

  const coverageBoost = Math.round((matched / queryTokens.length) * 120);
  const orderedBoost = orderedTokenBoost(queryTokens, titleTokens);
  const titleTokenCoverage = queryTokens.filter((token) => bestTokenMatch(token, titleTokens).matched).length;
  const titleBoost = titleTokenCoverage > 0 ? titleTokenCoverage * 35 : 0;

  return score + coverageBoost + orderedBoost + titleBoost;
}

export function matchesTitleSearch(title: EnrichedTitle, rawQuery: string) {
  return titleSearchScore(title, rawQuery) > 0;
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return value.split(" ").filter(Boolean);
}

function meaningfulTokens(value: string) {
  return tokenize(value).filter((token) => !STOP_WORDS.has(token) && (token.length > 1 || /\d/.test(token)));
}

function bestTokenMatch(queryToken: string, targetTokens: string[]): TokenMatch {
  let best = 0;
  for (const target of targetTokens) {
    if (target === queryToken) best = Math.max(best, 120);
    else if (target.startsWith(queryToken) || queryToken.startsWith(target)) best = Math.max(best, 92);
    else if (queryToken.length >= 4 && isSmallTypo(queryToken, target)) best = Math.max(best, 74);
  }
  return { matched: best > 0, score: best };
}

function isSmallTypo(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return false;
  const maxDistance = Math.max(a.length, b.length) >= 7 ? 2 : 1;
  return limitedEditDistance(a, b, maxDistance) <= maxDistance;
}

function limitedEditDistance(a: string, b: string, limit: number) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    let rowMin = previous[0];
    for (let j = 1; j <= b.length; j += 1) {
      const temp = previous[j];
      previous[j] =
        a[i - 1] === b[j - 1]
          ? diagonal
          : Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + 1);
      diagonal = temp;
      rowMin = Math.min(rowMin, previous[j]);
    }
    if (rowMin > limit) return limit + 1;
  }
  return previous[b.length];
}

function orderedTokenBoost(queryTokens: string[], titleTokens: string[]) {
  let cursor = 0;
  let orderedMatches = 0;
  for (const token of queryTokens) {
    const foundAt = titleTokens.findIndex((titleToken, index) => index >= cursor && bestTokenMatch(token, [titleToken]).matched);
    if (foundAt === -1) continue;
    orderedMatches += 1;
    cursor = foundAt + 1;
  }
  return orderedMatches >= 2 ? orderedMatches * 30 : 0;
}
