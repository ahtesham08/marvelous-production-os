import type { EnrichedTitle } from "@/lib/types";
import { QueueTable } from "@/components/mvp3/QueueTable";

export function SectionList({ sections }: { sections: Array<{ title: string; titles: EnrichedTitle[] }> }) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
            <span className="rounded-md bg-[#eef1eb] px-2 py-1 text-xs font-semibold text-moss">{section.titles.length}</span>
          </div>
          <QueueTable titles={section.titles} />
        </section>
      ))}
    </div>
  );
}
