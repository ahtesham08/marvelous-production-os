import type { SupervisorSummary } from "@/lib/types";

export function SupervisorBreakdown({ supervisors }: { supervisors: SupervisorSummary[] }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Supervisor Breakdown</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {supervisors.map((supervisor) => (
          <article key={supervisor.name} className="rounded-lg border border-black/10 p-4">
            <div className="text-base font-semibold text-ink">{supervisor.name}</div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Metric label="Total" value={supervisor.total} />
              <Metric label="Not Started" value={supervisor.notStarted} />
              <Metric label="Missing Docs" value={supervisor.missingHelpDocs} />
              <Metric label="Missing Writers" value={supervisor.missingWriters} />
              <Metric label="Overdue" value={supervisor.overdueTitles} />
              <Metric label="Critical" value={supervisor.criticalDelays} />
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-[#f6f4ee] p-2">
      <dt className="text-xs text-black/50">{label}</dt>
      <dd className="text-lg font-semibold text-ink">{value}</dd>
    </div>
  );
}
