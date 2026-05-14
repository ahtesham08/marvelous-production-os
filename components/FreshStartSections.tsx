import Link from "next/link";
import type { EnrichedTitle } from "@/lib/types";

type Section = {
  label: string;
  titles: EnrichedTitle[];
};

export function FreshStartSections({ titles }: { titles: EnrichedTitle[] }) {
  const sections: Section[] = [
    { label: "Approved Today", titles: titles.filter((title) => isToday(title.approvedDate)) },
    { label: "Approved This Week", titles: titles.filter((title) => isThisWeek(title.approvedDate)) },
    { label: "Not Assigned Yet", titles: titles.filter((title) => title.supervisor === "Missing") },
    { label: "Missing Help Docs", titles: titles.filter((title) => title.missingFields.includes("Help Doc")) },
    { label: "Missing Writers", titles: titles.filter((title) => title.missingFields.includes("Writer")) },
    { label: "Urgent Titles", titles: titles.filter((title) => title.priority === "Urgent" || title.severity === "Critical") }
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {sections.map((section) => (
        <article key={section.label} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">{section.label}</h2>
            <span className="rounded-md bg-[#eef1eb] px-2 py-1 text-xs font-semibold text-moss">
              {section.titles.length}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {section.titles.slice(0, 5).map((title) => (
              <li key={title.id} className="text-sm">
                <Link href={`/titles/${title.id}`} className="font-medium text-ink hover:text-moss hover:underline">
                  {title.title}
                </Link>
                <div className="text-xs text-black/50">
                  {title.channel} | {title.supervisor} | {title.priority}
                </div>
              </li>
            ))}
          </ul>
          {section.titles.length === 0 ? <p className="mt-3 text-sm text-black/50">Nothing here yet.</p> : null}
        </article>
      ))}
    </section>
  );
}

function isToday(value: string | null) {
  if (!value) return false;
  return value === new Date().toISOString().slice(0, 10);
}

function isThisWeek(value: string | null) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return date >= start;
}
