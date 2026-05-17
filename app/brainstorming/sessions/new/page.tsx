import { BrainstormingSessionForm } from "@/components/brainstorming/BrainstormingSessionForm";
import { getCurrentUserContext } from "@/lib/serverAuth";

export default async function NewBrainstormingSessionPage() {
  const context = await getCurrentUserContext();
  const canCreate = context.user?.role === "Admin" || context.user?.role === "Supervisor";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Before Meeting</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Create Brainstorming Session</h1>
        <p className="mt-2 text-sm text-black/60">Set up the meeting, then collect titles from supervisors.</p>
      </div>
      {canCreate ? (
        <BrainstormingSessionForm />
      ) : (
        <section className="rounded-lg border border-black/10 bg-white p-6 text-sm text-black/60 shadow-sm">
          Only Admin and Supervisors can create brainstorming sessions.
        </section>
      )}
    </div>
  );
}
