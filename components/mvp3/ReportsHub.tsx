"use client";

import { useState } from "react";

export function ReportsHub({ reports }: { reports: Array<{ id: string; name: string; text: string }> }) {
  const [selected, setSelected] = useState(reports[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const report = reports.find((item) => item.id === selected) ?? reports[0];

  async function copy() {
    await navigator.clipboard.writeText(report?.text ?? "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
        <select className="field-input" value={selected} onChange={(event) => setSelected(event.target.value)}>
          {reports.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">{report?.name}</h2>
          <button type="button" onClick={copy} className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-[#f6f4ee] p-4 text-sm leading-6">{report?.text}</pre>
      </section>
    </div>
  );
}
