import { OperationsQueue } from "@/components/OperationsQueue";
import { TitleTable } from "@/components/TitleTable";
import { OperationsInlineQueue } from "@/components/mvp3/OperationsInlineQueue";
import { getDashboardData } from "@/lib/dashboardData";
import { operationsSections } from "@/lib/mvp3Views";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const data = await getDashboardData();
  const queueTitles = [
    ...data.operationsQueue.wordCountMissing,
    ...data.operationsQueue.voMissing,
    ...data.operationsQueue.editorMissing,
    ...data.operationsQueue.proofreaderMissing,
    ...data.operationsQueue.notMigrated,
    ...data.operationsQueue.productionOnly
  ];
  const uniqueTitles = Array.from(new Map(queueTitles.map((title) => [title.id, title])).values());
  const sections = operationsSections(data.titles);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Operations</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Deepak Operations Queue</h1>
        <p className="mt-2 text-sm text-black/60">
          Word counts, VO, editors, proofreaders, clip finders, and production statuses in one place.
        </p>
      </div>
      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["Scripts submitted but word count missing", sections.wordCountMissing.length],
          ["Proofreading pending", sections.proofreadingPending.length],
          ["Blocked by proofreader", sections.proofreaderBlocked.length],
          ["Ready for recheck", sections.readyForRecheck.length],
          ["Word count added but VO missing", sections.voMissing.length],
          ["VO assigned but editor missing", sections.editorMissing.length],
          ["Ready to mark completed", sections.readyToComplete.length]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-2xl font-semibold text-ink">{value}</div>
            <div className="mt-1 text-sm text-black/60">{label}</div>
          </div>
        ))}
      </section>
      <OperationsQueue queue={data.operationsQueue} />
      <OperationsInlineQueue titles={uniqueTitles} />
      <TitleTable titles={uniqueTitles} />
    </div>
  );
}
