import { notFound } from "next/navigation";
import Link from "next/link";
import { LiveMeetingClient } from "@/components/brainstorming/LiveMeetingClient";
import { attachOrphanBrainstormingTitlesToSession, getBrainstormingSession, getBrainstormingTitles } from "@/lib/brainstorming";
import { getCurrentUserContext, isAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function LiveBrainstormingPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await getBrainstormingSession(sessionId);
  if (!session) notFound();
  await attachOrphanBrainstormingTitlesToSession(session);
  const [titles, proposedTitles, context] = await Promise.all([
    getBrainstormingTitles({ sessionId, includeResurfaced: true }),
    getBrainstormingTitles({ status: "Proposed" }),
    getCurrentUserContext()
  ]);
  const recoveryTitles = proposedTitles.filter((title) => title.session_id !== sessionId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">During Meeting</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Live Review Mode</h1>
          <p className="mt-2 text-sm text-black/60">Grouped by supervisor for fast meeting decisions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/brainstorming/submit" className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-moss hover:border-moss">Submit Title</Link>
          <Link href={`/brainstorming/import?sessionId=${encodeURIComponent(sessionId)}`} className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-moss hover:border-moss">Import Paste</Link>
        </div>
      </div>
      <LiveMeetingClient
        session={session}
        titles={titles}
        recoveryTitles={recoveryTitles}
        canDecide={isAdmin(context.user?.role)}
        canEdit={["Admin", "Supervisor"].includes(String(context.user?.role))}
      />
    </div>
  );
}
