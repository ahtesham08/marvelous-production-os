"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { QueueTable } from "@/components/mvp3/QueueTable";
import type { EnrichedTitle } from "@/lib/types";

const PREVIEW_ROWS = 10;

/**
 * Command Center sections used to render every matching title in every section at once
 * (thousands of table rows). Now each section shows a short preview and expands on demand.
 */
export function CollapsibleSectionList({ sections }: { sections: Array<{ title: string; titles: EnrichedTitle[] }> }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const isCollapsed = collapsed[section.title] ?? section.titles.length === 0;
        const showAll = expanded[section.title];
        const rows = showAll ? section.titles : section.titles.slice(0, PREVIEW_ROWS);
        return (
          <section key={section.title} className="space-y-3">
            <button
              type="button"
              onClick={() => setCollapsed((current) => ({ ...current, [section.title]: !isCollapsed }))}
              className="focus-ring flex w-full items-center justify-between rounded-md text-left"
              aria-expanded={!isCollapsed}
            >
              <span className="flex items-center gap-2">
                <ChevronDown size={18} className={clsx("text-black/45 transition", isCollapsed && "-rotate-90")} />
                <span className="text-xl font-semibold text-ink">{section.title}</span>
              </span>
              <span
                className={clsx(
                  "rounded-md px-2 py-1 text-xs font-semibold",
                  section.titles.length > 0 ? "bg-[#eef1eb] text-moss" : "bg-black/5 text-black/40"
                )}
              >
                {section.titles.length.toLocaleString("en-IN")}
              </span>
            </button>
            {isCollapsed ? null : (
              <>
                <QueueTable titles={rows} />
                {section.titles.length > PREVIEW_ROWS ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((current) => ({ ...current, [section.title]: !showAll }))}
                    className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:border-moss hover:text-moss"
                  >
                    {showAll ? "Show fewer" : `Show all ${section.titles.length.toLocaleString("en-IN")}`}
                  </button>
                ) : null}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
