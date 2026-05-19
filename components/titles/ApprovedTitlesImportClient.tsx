"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { FRESH_START_CHANNELS } from "@/lib/sharedConstants";

type ApprovedImportPreviewRow = {
  title: string;
  supervisor: string;
  channel: string;
  priority: string;
  dueDate: string | null;
  writer: string | null;
  expectedWordCount: number | null;
  notes: string | null;
  importOrder: number;
  duplicateWarning: string | null;
};

const priorityOptions = ["Ultra Urgent", "Urgent", "Normal", "Low"];

type BulkDefaults = {
  channel: string;
  priority: string;
  dueDate: string;
  expectedWordCount: string;
};

export function ApprovedTitlesImportClient() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ApprovedImportPreviewRow[]>([]);
  const [bulk, setBulk] = useState<BulkDefaults>({
    channel: "MV N",
    priority: "Normal",
    dueDate: "",
    expectedWordCount: ""
  });
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function previewPaste() {
    setMessage(null);
    setSuccess(null);
    const response = await fetch("/api/titles/import-approved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, previewOnly: true })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Could not parse approved title paste.");
      return;
    }
    setPreview(payload.preview);
  }

  async function refreshWarnings(rows = preview) {
    const response = await fetch("/api/titles/import-approved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, previewOnly: true })
    });
    const payload = await response.json();
    if (response.ok) setPreview(payload.preview);
  }

  async function createTitles(allowDuplicates = false) {
    setSaving(true);
    setMessage(null);
    setSuccess(null);
    const response = await fetch("/api/titles/import-approved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview, allowDuplicates })
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      if (String(payload.error ?? "").includes("duplicates")) {
        const confirmed = window.confirm(`${payload.error}\n\nCreate these titles anyway?`);
        if (confirmed) return createTitles(true);
      }
      setMessage(payload.error || "Could not create approved titles.");
      return;
    }

    setSuccess(`Created ${payload.createdCount} approved production title${payload.createdCount === 1 ? "" : "s"}.`);
    setText("");
    setPreview([]);
    router.refresh();
  }

  function updateRow(index: number, patch: Partial<ApprovedImportPreviewRow>) {
    setPreview((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setPreview((current) => current.filter((_, rowIndex) => rowIndex !== index).map((row, rowIndex) => ({ ...row, importOrder: rowIndex + 1 })));
  }

  function applyDefaults(mode: "empty" | "all") {
    const next = preview.map((row) => ({
      ...row,
      channel: mode === "all" || !row.channel ? bulk.channel : row.channel,
      priority: mode === "all" || !row.priority ? bulk.priority : row.priority,
      dueDate: mode === "all" || !row.dueDate ? bulk.dueDate || null : row.dueDate,
      expectedWordCount:
        mode === "all" || !row.expectedWordCount
          ? bulk.expectedWordCount
            ? Number(bulk.expectedWordCount)
            : null
          : row.expectedWordCount
    }));
    setPreview(next);
    void refreshWarnings(next);
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <label>
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ClipboardList size={16} />
              Approved WhatsApp Paste
            </span>
            <textarea
              className="field-input mt-3 min-h-[320px] font-mono"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={"Kamran:\n1. Every Origin Of Art The Clown - Explored\n2. 10 Forgotten Sci-Fi Shows That Deserve Reboots\n\nFarhan:\n1. 14 Brutal Slasher Films That Defined The 80s\n\nRaktim:\n1. Shinnok's Entry In MK3 Will Bring Endgame Level Chaos"}
            />
          </label>
        </div>

        <aside className="space-y-4 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-semibold text-ink">Bulk Defaults</h2>
            <p className="mt-1 text-sm text-black/55">Use these to speed up setup before creating production titles.</p>
          </div>
          <Field label="Default Channel">
            <select className="field-input" value={bulk.channel} onChange={(event) => setBulk((current) => ({ ...current, channel: event.target.value }))}>
              {FRESH_START_CHANNELS.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
            </select>
          </Field>
          <Field label="Default Priority">
            <select className="field-input" value={bulk.priority} onChange={(event) => setBulk((current) => ({ ...current, priority: event.target.value }))}>
              {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </Field>
          <Field label="Default Due Date">
            <input type="date" className="field-input" value={bulk.dueDate} onChange={(event) => setBulk((current) => ({ ...current, dueDate: event.target.value }))} />
          </Field>
          <Field label="Default Expected Word Count">
            <input type="number" min={0} className="field-input" value={bulk.expectedWordCount} onChange={(event) => setBulk((current) => ({ ...current, expectedWordCount: event.target.value }))} />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => applyDefaults("empty")} disabled={preview.length === 0} className="focus-ring rounded-md border border-black/10 px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss disabled:opacity-50">
              Apply To Empty
            </button>
            <button type="button" onClick={() => applyDefaults("all")} disabled={preview.length === 0} className="focus-ring rounded-md border border-black/10 px-3 py-2 text-sm font-semibold text-ink hover:border-moss hover:text-moss disabled:opacity-50">
              Apply To All
            </button>
          </div>
          <button type="button" onClick={previewPaste} className="focus-ring w-full rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-moss hover:border-moss">
            Preview Paste
          </button>
          <button
            type="button"
            onClick={() => createTitles(false)}
            disabled={saving || preview.length === 0}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60"
          >
            <Plus size={16} />
            {saving ? "Creating" : "Create Approved Titles"}
          </button>
          {success ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              {success} <Link href="/titles" className="underline">Open Main Title Table</Link>
            </div>
          ) : null}
          {message ? <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{message}</p> : null}
        </aside>
      </section>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 p-4">
          <h2 className="text-lg font-semibold text-ink">Preview Approved Production Titles</h2>
          <p className="mt-1 text-sm text-black/55">Status will be Approved, approved date will be today, and source will be Imported Approved Titles.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1320px] divide-y divide-black/10 text-sm">
            <thead className="bg-[#eef1eb] text-left text-xs uppercase text-black/55">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Title</th>
                <th className="px-3 py-3">Supervisor</th>
                <th className="px-3 py-3">Channel</th>
                <th className="px-3 py-3">Priority / Urgency</th>
                <th className="px-3 py-3">Due Date</th>
                <th className="px-3 py-3">Writer</th>
                <th className="px-3 py-3">Expected Word Count</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {preview.map((row, index) => (
                <tr key={`${row.importOrder}-${index}`} className={row.duplicateWarning ? "bg-[#fff8ec]" : undefined}>
                  <td className="px-3 py-3 text-black/55">{index + 1}</td>
                  <td className="min-w-[320px] px-3 py-3">
                    <input className="field-input" value={row.title} onChange={(event) => updateRow(index, { title: event.target.value })} onBlur={() => refreshWarnings()} />
                    {row.duplicateWarning ? <div className="mt-1 text-xs font-semibold text-amberline">{row.duplicateWarning}</div> : null}
                  </td>
                  <td className="px-3 py-3"><input className="field-input" value={row.supervisor} onChange={(event) => updateRow(index, { supervisor: event.target.value })} /></td>
                  <td className="px-3 py-3">
                    <select className="field-input" value={row.channel} onChange={(event) => updateRow(index, { channel: event.target.value })}>
                      {FRESH_START_CHANNELS.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select className="field-input" value={row.priority} onChange={(event) => updateRow(index, { priority: event.target.value })}>
                      {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3"><input type="date" className="field-input" value={row.dueDate ?? ""} onChange={(event) => updateRow(index, { dueDate: event.target.value || null })} /></td>
                  <td className="px-3 py-3"><input className="field-input" value={row.writer ?? ""} onChange={(event) => updateRow(index, { writer: event.target.value || null })} /></td>
                  <td className="px-3 py-3"><input type="number" min={0} className="field-input" value={row.expectedWordCount ?? ""} onChange={(event) => updateRow(index, { expectedWordCount: event.target.value ? Number(event.target.value) : null })} /></td>
                  <td className="min-w-[240px] px-3 py-3"><input className="field-input" value={row.notes ?? ""} onChange={(event) => updateRow(index, { notes: event.target.value || null })} /></td>
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => removeRow(index)} className="focus-ring rounded-md border border-red-200 bg-red-50 p-2 text-danger hover:border-danger" aria-label={`Remove ${row.title}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview.length === 0 ? <div className="px-4 py-10 text-center text-sm text-black/55">Paste a supervisor-wise numbered list and preview it here.</div> : null}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-black/55">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
