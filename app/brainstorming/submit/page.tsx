import { BrainstormingSubmitForm } from "@/components/brainstorming/BrainstormingSubmitForm";
import { getBrainstormingSessions } from "@/lib/brainstorming";

export const dynamic = "force-dynamic";

export default async function BrainstormingSubmitPage() {
  const sessions = await getBrainstormingSessions();
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Supervisor Submission</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Submit Title Idea</h1>
        <p className="mt-2 text-sm text-black/60">Add the pitch, reason, references, and suggested writer before the meeting starts.</p>
      </div>
      <BrainstormingSubmitForm sessions={sessions.filter((session) => session.status !== "Archived")} />
    </div>
  );
}
