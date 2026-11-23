/**
 * Supabase/PostgREST caps every response at 1,000 rows by default.
 * fetchAllPages keeps requesting ranges until a short page comes back, so large
 * tables (titles, brainstorming bank) are never silently truncated.
 */
export const SUPABASE_PAGE_SIZE = 1000;

type PageResult<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

export async function fetchAllPages<T>(
  buildPage: (from: number, to: number) => PageResult<T>,
  pageSize = SUPABASE_PAGE_SIZE,
  maxPages = 50
): Promise<{ data: T[]; error: unknown }> {
  const rows: T[] = [];
  for (let page = 0; page < maxPages; page += 1) {
    const from = page * pageSize;
    const { data, error } = await buildPage(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return { data: rows, error: null };
}
