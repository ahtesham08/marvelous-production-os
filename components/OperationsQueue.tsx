import type { EnrichedTitle, OperationsQueue as OperationsQueueType } from "@/lib/types";

export function OperationsQueue({ queue }: { queue: OperationsQueueType }) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Deepak Operations Queue</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <QueueBlock title="Scripts with missing word count" titles={queue.wordCountMissing} />
        <QueueBlock title="Titles missing VO" titles={queue.voMissing} />
        <QueueBlock title="Titles missing editor" titles={queue.editorMissing} />
        <QueueBlock title="Titles missing proofreader" titles={queue.proofreaderMissing} />
        <QueueBlock title="Title bank rows missing from production" titles={queue.notMigrated} />
        <QueueBlock title="Production rows missing from title bank" titles={queue.productionOnly} />
      </div>
    </section>
  );
}

function QueueBlock({ title, titles }: { title: string; titles: EnrichedTitle[] }) {
  return (
    <article className="rounded-lg border border-black/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span className="rounded-md bg-[#eef1eb] px-2 py-1 text-xs font-semibold text-moss">{titles.length}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {titles.slice(0, 6).map((item) => (
          <li key={item.id} className="text-sm text-black/70">
            <span className="font-medium text-ink">{item.title}</span>
            <span className="block text-xs text-black/50">
              {item.channel} | {item.supervisor} | {item.ageDays}d
            </span>
          </li>
        ))}
      </ul>
      {titles.length === 0 ? <div className="mt-3 text-sm text-black/50">Clear.</div> : null}
    </article>
  );
}
