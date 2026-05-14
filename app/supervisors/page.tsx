import Link from "next/link";
import { SupervisorBreakdown } from "@/components/SupervisorBreakdown";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function SupervisorsPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Fresh Start Mode</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Supervisor Dashboards</h1>
        <p className="mt-2 text-sm text-black/60">Each supervisor gets a focused accountability view.</p>
      </div>
      <SupervisorBreakdown supervisors={data.supervisorSummary} />
      <section className="grid gap-3 md:grid-cols-3">
        {["Kamran", "Farhan", "Raktim"].map((name) => (
          <Link
            key={name}
            href={`/supervisors/${encodeURIComponent(name)}`}
            className="rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:border-moss"
          >
            <div className="text-lg font-semibold text-ink">{name}</div>
            <div className="mt-2 text-sm text-black/55">Open assigned titles, missing docs, writers, and delays.</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
