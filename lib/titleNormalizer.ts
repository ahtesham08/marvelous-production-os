const quoteMap: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u2013": "-",
  "\u2014": "-"
};

const safeVariants: Array<[RegExp, string]> = [
  [/\beverything\b/g, "everything"],
  [/\bexplained\b/g, "explained"],
  [/\bexplored\b/g, "explored"],
  [/\bwtf\b/g, "wtf"],
  [/\bwhat\s+happened\b/g, "wtf happened"]
];

export function normalizeTitle(input: string | null | undefined) {
  if (!input) return "";

  let normalized = input.trim().toLowerCase();

  for (const [from, to] of Object.entries(quoteMap)) {
    normalized = normalized.split(from).join(to);
  }

  normalized = normalized
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of safeVariants) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, " ").trim();
}

export function nameKey(input: string | null | undefined) {
  return normalizeTitle(input);
}
