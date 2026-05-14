import { BrainstormingSessionForm } from "@/components/brainstorming/BrainstormingSessionForm";

export default function NewBrainstormingSessionPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Before Meeting</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Create Brainstorming Session</h1>
        <p className="mt-2 text-sm text-black/60">Set up the meeting, then collect titles from supervisors.</p>
      </div>
      <BrainstormingSessionForm />
    </div>
  );
}
