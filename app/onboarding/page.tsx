const steps = [
  "Add approved titles after brainstorming.",
  "Assign each title to a supervisor.",
  "Supervisor adds help doc and writer.",
  "Writer submits script.",
  "Deepak updates word count, VO, editor, proofreader.",
  "Track everything from the dashboard."
];

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Fresh Start Mode</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">How The Team Uses Marvelous Production OS</h1>
        <p className="mt-2 text-sm text-black/60">
          Old Google Sheets stay as archive/reference. New approved titles start here and move through the dashboard.
        </p>
      </div>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4 rounded-lg border border-black/10 bg-[#f6f4ee] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <div className="text-base font-semibold text-ink">Step {index + 1}</div>
                <div className="mt-1 text-sm text-black/65">{step}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
