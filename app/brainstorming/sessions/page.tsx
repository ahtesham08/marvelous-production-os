import Link from "next/link";
import { BrainstormingSessionsClient } from "@/components/brainstorming/BrainstormingSessionsClient";
import { getBrainstormingSessionsWithDailyEnsure, getBrainstormingTitles } from "@/lib/brainstorming";
import { getCurrentUserContext, isAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function BrainstormingSessionsPage() {
  const [sessions, titles, userContext] = await Promise.all([
    getBrainstormingSessionsWithDailyEnsure(),
    getBrainstormingTitles(),
    getCurrentUserContext()
  ]);
  const canCreate = userContext.user?.role === "Admin" || userContext.user?.role === "Supervisor";
  const canDelete = isAdmin(userContext.user?.role);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Before Meeting</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Brainstorming Sessions</h1>
        </div>
        {canCreate ? (
          <Link href="/brainstorming/sessions/new" className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss">New Session</Link>
        ) : null}
      </div>

      <BrainstormingSessionsClient sessions={sessions} titles={titles} canDelete={canDelete} />
      {sessions.length === 0 ? <p className="rounded-lg border border-black/10 bg-white p-8 text-center text-sm text-black/55">No sessions yet.</p> : null}
    </div>
  );
}
