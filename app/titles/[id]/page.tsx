import Link from "next/link";
import { notFound } from "next/navigation";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { MissingFieldsBadge } from "@/components/MissingFieldsBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ProofreadingReviewPanel } from "@/components/proofreading/ProofreadingReviewPanel";
import { DeleteTitleButton } from "@/components/title-detail/DeleteTitleButton";
import { TitleUpdateForm } from "@/components/title-detail/TitleUpdateForm";
import { getTitleFreshnessLabel } from "@/lib/adminAttention";
import { getEnrichedTitleById } from "@/lib/dashboardData";
import { getProofreadingBundle } from "@/lib/proofreading";
import { getCurrentUserContext } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export default async function TitleDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const { id } = await params;
  const { return: returnPath } = await searchParams;
  const [title, userContext] = await Promise.all([
    getEnrichedTitleById(id, { includeActivityLog: true }),
    getCurrentUserContext()
  ]);

  if (!title) notFound();
  const proofreading = await getProofreadingBundle(id);
  const canDelete =
    userContext.user?.role === "Admin" ||
    (userContext.user?.role === "Supervisor" && title.supervisor.toLowerCase() === userContext.user.name.toLowerCase());
  const canUpdateProductionFields = ["Admin", "Supervisor", "Operations Supervisor"].includes(
    userContext.user?.role ?? ""
  );

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <Link href={returnPath || "/titles"} className="text-sm font-semibold text-moss hover:underline">
          Back to titles
        </Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-moss">{title.channel}</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">{title.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={title.status} />
              <PriorityBadge priority={title.priority} />
              <SeverityBadge severity={title.severity} />
              <FreshnessBadge label={getTitleFreshnessLabel(title)} />
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
            <Info label="Channel" value={title.channel} />
            <Info label="Priority" value={title.priority} />
            <Info label="Age" value={`${title.ageDays} days`} />
            <Info label="Due Date" value={title.writerDueDate || "Missing"} />
            <Info label="Expected Word Count" value={title.expectedWordCount ? `${title.expectedWordCount}` : "Missing"} />
            <Info label="Actual Word Count" value={title.wordCount ? `${title.wordCount}` : "Missing"} />
            <Info label="Source Row" value={title.sourceRow} />
            <Info label="Production Row" value={title.productionRow} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {canUpdateProductionFields ? (
          <TitleUpdateForm title={title} />
        ) : (
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">Production Fields</h2>
            <p className="mt-3 text-sm leading-6 text-black/65">
              Production fields are read-only for your role. Use the Proofreading Review section below to add feedback,
              screenshots, blocks, and approvals.
            </p>
          </section>
        )}
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
            <h2 className="text-lg font-semibold text-ink">Ahtesham's Directives</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-black/70">
              {title.ahteshamDirectives || "No directives added yet."}
            </p>
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
          {canDelete ? (
            <section className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
              <p className="mt-2 text-sm text-black/65">
                Delete this production title only when it was added by mistake. Old Google Sheets will not be touched.
              </p>
              <div className="mt-4">
                <DeleteTitleButton titleId={title.id} titleName={title.title} returnPath={returnPath || "/titles"} />
              </div>
            </section>
          ) : null}
        </aside>
      </section>
      <ProofreadingReviewPanel
        title={title}
        initialReview={proofreading.review}
        initialMessages={proofreading.messages}
        user={userContext.user}
      />
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
