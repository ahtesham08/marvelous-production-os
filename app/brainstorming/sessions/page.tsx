import Link from "next/link";
import { BrainstormingStatusBadge } from "@/components/brainstorming/BrainstormingStatusBadge";
import { getBrainstormingSessions, getBrainstormingTitles } from "@/lib/brainstorming";

export const dynamic = "force-dynamic";

export default async function BrainstormingSessionsPage() {
  const [sessions, titles] = await Promise.all([getBrainstormingSessions(), getBrainstormingTitles()]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Before Meeting</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Brainstorming Sessions</h1>
        </div>
        <Link href="/brainstorming/sessions/new" className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss">New Session</Link>
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        {sessions.map((session) => {
          const count = titles.filter((title) => title.session_id === session.id).length;
          return (
            <Link key={session.id} href={`/brainstorming/live/${session.id}`} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:border-moss">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{session.name}</h2>
                  <p className="mt-1 text-sm text-black/60">{session.session_date} | {count} titles</p>
                  <p className="mt-1 text-xs text-black/50">{(session.channels ?? []).join(", ")}</p>
                </div>
                <BrainstormingStatusBadge status={session.status} />
              </div>
            </Link>
          );
        })}
      </section>
      {sessions.length === 0 ? <p className="rounded-lg border border-black/10 bg-white p-8 text-center text-sm text-black/55">No sessions yet.</p> : null}
    </div>
  );
}
