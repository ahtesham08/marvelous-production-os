import { getDashboardData } from "@/lib/dashboardData";
import { flattenActivity } from "@/lib/mvp3Views";
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from "@/lib/supabaseServer";

export const ACTIVITY_FEED_LIMIT = 300;

export type ActivityFeedEntry = {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string | null;
  title_id: string | null;
  title: string;
  channel: string;
};

/**
 * Latest changes across all titles. The old page loaded every title with its full
 * activity history and rendered all of it (a ~32 MB page that took 12+ seconds).
 */
export async function getRecentActivity(limit = ACTIVITY_FEED_LIMIT): Promise<ActivityFeedEntry[]> {
  if (!hasSupabaseAdminConfig()) {
    const data = await getDashboardData({ includeActivityLog: true });
    return flattenActivity(data.titles)
      .slice(0, limit)
      .map((entry) => ({
        id: entry.id,
        action: entry.action,
        old_value: entry.old_value ?? null,
        new_value: entry.new_value ?? null,
        created_at: entry.created_at ?? null,
        title_id: entry.title_id ?? null,
        title: entry.title,
        channel: entry.channel
      }));
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, old_value, new_value, created_at, title_id, titles(title, channels(name))")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  type Row = {
    id: string;
    action: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string | null;
    title_id: string | null;
    titles: { title: string | null; channels: { name: string | null } | null } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    action: row.action,
    old_value: row.old_value,
    new_value: row.new_value,
    created_at: row.created_at,
    title_id: row.title_id,
    title: row.titles?.title ?? "Deleted title",
    channel: row.titles?.channels?.name ?? ""
  }));
}
