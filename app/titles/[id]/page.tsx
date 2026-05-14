import Link from "next/link";
import { notFound } from "next/navigation";
import { MissingFieldsBadge } from "@/components/MissingFieldsBadge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { TitleUpdateForm } from "@/components/title-detail/TitleUpdateForm";
import { getDashboardData } from "@/lib/dashboardData";

export const dynamic = "force-dynamic";

export default async function TitleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDashboardData();
  const title = data.titles.find((item) => item.id === id);

  if (!title) notFound();

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <Link href="/titles" className="text-sm font-semibold text-moss hover:underline">
          Back to titles
        </Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-moss">{title.channel}</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">{title.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={title.status} />
              <SeverityBadge severity={title.severity} />
              {title.blocked ? (
                <span className="rounded-md border border-danger/25 bg-red-50 px-2 py-1 text-xs font-semibold text-danger">
                  Blocked
                </span>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2 text-sm text-black/65 sm:grid-cols-2 lg:min-w-[420px]">
            <Info label="Supervisor" value={title.supervisor} />
            <Info label="Writer" value={title.writer} />
            <Info label="Age" value={`${title.ageDays} days`} />
            <Info label="Due Date" value={title.writerDueDate || "Missing"} />
            <Info label="Source Row" value={title.sourceRow} />
            <Info label="Production Row" value={title.productionRow} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <TitleUpdateForm title={title} />
        <aside className="space-y-4">
          <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Current Bottleneck</h2>
            <div className="mt-3">
              <MissingFieldsBadge fields={title.missingFields} />
            </div>
            <p className="mt-4 text-sm font-medium text-black/70">{title.nextAction}</p>
            {title.blockedReason ? <p className="mt-2 text-sm text-danger">{title.blockedReason}</p> : null}
            {title.blocked ? (
              <p className="mt-2 text-xs text-black/55">
                {title.blockedCategory || "Other"} | {title.blockedBy || title.supervisor}
              </p>
            ) : null}
          </section>
          <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Activity Timeline</h2>
            <ol className="mt-4 space-y-3">
              {(title.activityLog ?? []).slice(0, 20).map((entry) => (
                <li key={entry.id} className="border-l-2 border-moss/30 pl-3">
                  <div className="text-sm font-semibold text-ink">{entry.action}</div>
                  <div className="text-xs text-black/50">{entry.created_at ? new Date(entry.created_at).toLocaleString() : ""}</div>
                  <div className="mt-1 text-xs text-black/60">
                    {entry.old_value ?? "Blank"} {"->"} {entry.new_value ?? "Blank"}
                  </div>
                </li>
              ))}
            </ol>
            {(title.activityLog ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-black/50">No manual updates logged yet.</p>
            ) : null}
          </section>
        </aside>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f6f4ee] p-3">
      <div className="text-xs font-semibold uppercase text-black/45">{label}</div>
      <div className="mt-1 font-medium text-ink">{value}</div>
    </div>
  );
}
