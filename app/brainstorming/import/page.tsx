import { WhatsAppImportClient } from "@/components/brainstorming/WhatsAppImportClient";
import { getBrainstormingSessionsWithDailyEnsure } from "@/lib/brainstorming";

export const dynamic = "force-dynamic";

export default async function BrainstormingImportPage({
  searchParams
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;
  const sessions = await getBrainstormingSessionsWithDailyEnsure();
  const activeSessions = sessions.filter((session) => session.status !== "Archived");
  const initialSessionId = activeSessions.some((session) => session.id === sessionId) ? sessionId : activeSessions[0]?.id;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Manual WhatsApp Paste</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Import Numbered Title Lists</h1>
        <p className="mt-2 text-sm text-black/60">Paste supervisor sections from WhatsApp, preview them, edit fields, and add them to a session.</p>
      </div>
      <WhatsAppImportClient sessions={activeSessions} initialSessionId={initialSessionId} />
    </div>
  );
}
