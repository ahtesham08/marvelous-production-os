import Link from "next/link";
import { CalendarPlus, ClipboardList, Radio, Send, Table2 } from "lucide-react";
import { BrainstormingStatusBadge } from "@/components/brainstorming/BrainstormingStatusBadge";
import {
  getBrainstormingSessionsWithDailyEnsure,
  getBrainstormingSummary,
  getBrainstormingTitles
} from "@/lib/brainstorming";

export const dynamic = "force-dynamic";

const actions = [
  { href: "/brainstorming/sessions/new", label: "Create Session", icon: CalendarPlus },
  { href: "/brainstorming/submit", label: "Submit Title", icon: Send },
  { href: "/brainstorming/import", label: "Import WhatsApp Paste", icon: ClipboardList },
  { href: "/brainstorming/title-bank", label: "Title Bank", icon: Table2 }
];

export default async function BrainstormingPage() {
  const [summary, sessions, titles] = await Promise.all([
    getBrainstormingSummary(),
    getBrainstormingSessionsWithDailyEnsure(),
    getBrainstormingTitles()
  ]);
  const activeSessions = sessions.filter((session) => session.status !== "Archived").slice(0, 4);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase text-moss">Brainstorming Module</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Meeting Title Review</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-black/65">
          Supervisors submit ideas before the meeting, Ahtesham reviews them live, and approved titles convert into production tasks.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Today Sessions" value={summary.todaySessions} />
        <Metric label="Pending Proposed" value={summary.pendingProposed} />
        <Metric label="Approved Not Converted" value={summary.approvedNotConverted} />
        <Metric label="Needs Rework" value={summary.needsBetterAngle + summary.needsResearch} />
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="rounded-lg border border-black/10 bg-white p-4 font-semibold text-ink shadow-sm transition hover:border-moss hover:text-moss">
            <action.icon size={18} />
            <div className="mt-3">{action.label}</div>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink">Active Sessions</h2>
          <Link href="/brainstorming/sessions" className="text-sm font-semibold text-moss hover:underline">View all</Link>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {activeSessions.map((session) => (
            <Link key={session.id} href={`/brainstorming/live/${session.id}`} className="rounded-lg border border-black/10 bg-[#f6f4ee] p-4 transition hover:border-moss">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{session.name}</h3>
                  <p className="mt-1 text-sm text-black/60">{session.session_date}</p>
                </div>
                <BrainstormingStatusBadge status={session.status} />
              </div>
            </Link>
          ))}
        </div>
        {activeSessions.length === 0 ? <p className="mt-3 text-sm text-black/55">No active sessions yet. Create one before the meeting.</p> : null}
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-moss" />
          <h2 className="text-xl font-semibold text-ink">Latest Proposed Titles</h2>
        </div>
        <div className="mt-3 space-y-2">
          {titles.slice(0, 8).map((title) => (
            <div key={title.id} className="flex flex-col gap-2 rounded-md bg-[#f6f4ee] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-ink">{title.title}</div>
                <div className="text-xs text-black/55">{title.supervisor || title.submitted_by_name || "Unassigned"} | {title.channel}</div>
              </div>
              <BrainstormingStatusBadge status={title.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-3xl font-semibold text-ink">{value}</div>
      <div className="mt-2 text-sm font-medium text-black/60">{label}</div>
    </div>
  );
}
