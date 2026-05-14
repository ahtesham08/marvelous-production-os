export function similarity(a: string, b: string) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

export function findBestMatch<T extends { normalizedTitle: string }>(
  target: string,
  candidates: T[]
) {
  let best: { item: T; score: number } | null = null;

  for (const item of candidates) {
    const score = similarity(target, item.normalizedTitle);
    if (!best || score > best.score) {
      best = { item, score };
    }
  }

  return best;
}

function levenshteinDistance(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost
      );
    }
  }

  return matrix[a.length][b.length];
}
