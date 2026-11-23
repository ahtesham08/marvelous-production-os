import Link from "next/link";
import { ACTIVITY_FEED_LIMIT, getRecentActivity } from "@/lib/activityFeed";

export const dynamic = "force-dynamic";

const IST_FORMAT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZoneName: "short"
});

export default async function ActivityPage() {
  const activity = await getRecentActivity();
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Accountability</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Activity Feed</h1>
        <p className="mt-1 text-sm text-black/55">
          The latest {ACTIVITY_FEED_LIMIT} changes across all titles. Open a title to see its full history.
        </p>
      </div>
      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <ol className="space-y-3">
          {activity.map((entry) => (
            <li key={entry.id} className="border-l-2 border-moss/30 pl-3">
              <div className="text-sm font-semibold text-ink">
                {entry.action} -{" "}
                {entry.title_id ? (
                  <Link href={`/titles/${entry.title_id}`} className="hover:text-moss hover:underline">
                    {entry.title}
                  </Link>
                ) : (
                  entry.title
                )}
              </div>
              <div className="text-xs text-black/50">
                {entry.channel ? `${entry.channel} | ` : ""}
                {formatIstTimestamp(entry.created_at)}
              </div>
              <div className="text-xs text-black/60">
                {entry.old_value ?? "Blank"} {"->"} {entry.new_value ?? "Blank"}
              </div>
            </li>
          ))}
        </ol>
        {activity.length === 0 ? <p className="text-sm text-black/50">No activity yet.</p> : null}
      </section>
    </div>
  );
}

function formatIstTimestamp(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return IST_FORMAT.format(date);
}
