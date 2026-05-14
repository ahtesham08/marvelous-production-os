"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function DailyReportBox({ report }: { report: string }) {
  const [copied, setCopied] = useState(false);

  async function copyReport() {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-ink">Daily WhatsApp Report</h2>
        <button
          type="button"
          onClick={copyReport}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-moss"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-4 max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg bg-[#f6f4ee] p-4 text-sm leading-6 text-ink">
        {report}
      </pre>
    </section>
  );
}
