import type { EnrichedTitle } from "@/lib/types";

/**
 * The fields the title tables actually display, filter, sort and search on.
 * Sending full EnrichedTitle objects (activity logs, proofreading reviews, alerts,
 * notes...) to the browser made /titles a ~4 MB page. Keep this list in sync with
 * TitleTableClient and lib/titleSearch.
 */
export const TABLE_TITLE_FIELDS = [
  "id",
  "title",
  "channel",
  "supervisor",
  "writer",
  "status",
  "priority",
  "expectedWordCount",
  "wordCount",
  "approvedDate",
  "createdDate",
  "ageDays",
  "ageBucket",
  "severity",
  "matchStatus",
  "missingFields",
  "lastUpdatedAt",
  "writerDueDate",
  "blocked",
  "voArtist",
  "editor",
  "proofreader",
  "proofreadingStatus",
  "proofreadingBlocked"
] as const satisfies readonly (keyof EnrichedTitle)[];

export type TableTitle = Pick<EnrichedTitle, (typeof TABLE_TITLE_FIELDS)[number]>;

export function toTableTitle(title: EnrichedTitle): TableTitle {
  const slim = {} as Record<string, unknown>;
  for (const field of TABLE_TITLE_FIELDS) slim[field] = title[field];
  return slim as TableTitle;
}

/**
 * For client components that still need the full EnrichedTitle shape: drops the
 * heavy nested data (activity log, proofreading review record, alert list) that
 * those components never read, so it is not shipped to the browser.
 */
export function toClientTitle(title: EnrichedTitle): EnrichedTitle {
  return { ...title, alerts: [], activityLog: undefined, proofreadingReview: undefined };
}
